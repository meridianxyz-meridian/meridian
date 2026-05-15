import { Router } from 'express';
import { getPatient, savePatient, addRecord, updateAnalysis, updateName } from '../services/db.js';
import { synthesizeHealthTimeline } from '../agents/healthAgent.js';
import crypto from 'crypto';

export const patientRouter = Router();

/** GET /api/patient/:address — load patient data */
patientRouter.get('/:address', (req, res) => {
  const data = getPatient(req.params.address);
  res.json(data);
});

/** PUT /api/patient/:address/name — update display name */
patientRouter.put('/:address/name', (req, res) => {
  const { name } = req.body as { name: string };
  const data = updateName(req.params.address, name);
  res.json(data);
});

/** POST /api/patient/:address/records — add a record manually */
patientRouter.post('/:address/records', (req, res) => {
  const record = {
    ...req.body,
    id: `rec_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    uploadedAt: Date.now(),
  };
  const data = addRecord(req.params.address, record);
  res.status(201).json(data);
});

/** DELETE /api/patient/:address/records/:id — delete a record */
patientRouter.delete('/:address/records/:id', (req, res) => {
  const patient = getPatient(req.params.address);
  patient.records = patient.records.filter(r => r.id !== req.params.id);
  savePatient(patient);
  res.json(patient);
});

/** POST /api/patient/:address/analyze — run AI analysis and save */
patientRouter.post('/:address/analyze', async (req, res) => {
  try {
    const patient = getPatient(req.params.address);
    if (!patient.records.length) {
      res.status(400).json({ error: 'No records to analyze' });
      return;
    }
    const result = await synthesizeHealthTimeline(
      patient.records.map(r => ({ type: r.type, date: r.date, content: r.content, source: r.source })),
      `Wallet: ${req.params.address}, Name: ${patient.name}`
    );
    const analysis = { ...result, interactions: result.interactions ?? [], trialMatches: result.trialMatches ?? [], urgentFlags: result.urgentFlags ?? [], generatedAt: Date.now() };
    const data = updateAnalysis(req.params.address, analysis);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
