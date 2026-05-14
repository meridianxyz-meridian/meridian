import { Router } from 'express';
import multer from 'multer';
import { uploadToWalrus } from '../services/walrus.js';
import { encryptRecord } from '../services/seal.js';
import { parseFhirBundle } from '../services/fhirParser.js';
import crypto from 'crypto';

export const recordsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /api/records/upload
 * Accepts a file (PDF, JSON FHIR bundle, or image) + patient address.
 * Encrypts with Seal, uploads to Walrus, returns blob ID + seal key ID.
 */
recordsRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { patientAddress, recordType } = req.body as { patientAddress: string; recordType: string };
    if (!req.file || !patientAddress) {
      res.status(400).json({ error: 'file and patientAddress required' });
      return;
    }

    const { ciphertext, sealKeyId, iv, authTag } = encryptRecord(req.file.buffer, patientAddress);
    const metadataHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    const { blobId, suiObjectId } = await uploadToWalrus(ciphertext);

    res.json({
      blobId,
      suiObjectId,
      sealKeyId,
      iv,
      authTag,
      metadataHash,
      recordType: recordType ?? 'unknown',
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/records/parse-fhir
 * Accepts a FHIR R4 Bundle JSON, returns parsed flat records.
 */
recordsRouter.post('/parse-fhir', async (req, res) => {
  try {
    const bundle = req.body;
    const records = parseFhirBundle(bundle);
    res.json({ records, count: records.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/records/:blobId
 * Retrieve a blob from Walrus (returns encrypted bytes — decryption happens client-side).
 */
recordsRouter.get('/:blobId', async (req, res) => {
  try {
    const { retrieveFromWalrus } = await import('../services/walrus.js');
    const data = await retrieveFromWalrus(req.params.blobId);
    res.set('Content-Type', 'application/octet-stream');
    res.send(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});
