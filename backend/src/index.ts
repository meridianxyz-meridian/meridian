import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { recordsRouter } from './routes/records.js';
import { agentRouter } from './routes/agent.js';
import { marketplaceRouter } from './routes/marketplace.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/records', recordsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/marketplace', marketplaceRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Meridian backend running on :${PORT}`));
