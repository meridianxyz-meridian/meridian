import { Router } from 'express';
import {
  synthesizeHealthTimeline,
  generateVisitBriefing,
  streamAgentChat,
  type HealthRecord,
} from '../agents/healthAgent.js';

export const agentRouter = Router();

/**
 * POST /api/agent/synthesize
 * Takes raw records, returns AI-synthesized timeline + interactions + trial matches.
 */
agentRouter.post('/synthesize', async (req, res) => {
  try {
    const { records, patientContext } = req.body as {
      records: HealthRecord[];
      patientContext?: string;
    };
    if (!records?.length) {
      res.status(400).json({ error: 'records array required' });
      return;
    }
    const result = await synthesizeHealthTimeline(records, patientContext);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agent/visit-briefing
 * Generates a pre-visit clinical briefing for a new doctor.
 */
agentRouter.post('/visit-briefing', async (req, res) => {
  try {
    const { patientSummary, visitReason } = req.body as {
      patientSummary: string;
      visitReason: string;
    };
    const briefing = await generateVisitBriefing(patientSummary, visitReason);
    res.json({ briefing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agent/chat
 * Streaming conversational health agent.
 */
agentRouter.post('/chat', async (req, res) => {
  try {
    const { message, history, patientContext } = req.body as {
      message: string;
      history: Array<{ role: 'user' | 'assistant'; content: string }>;
      patientContext: string;
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of streamAgentChat(message, history ?? [], patientContext ?? '')) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
