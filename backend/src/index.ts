import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { callsRouter } from './routes/calls.js';
import { metricsRouter } from './routes/metrics.js';
import { agentHandoffRouter } from './routes/agentHandoff.js';
import { demoAccountsRouter } from './routes/demoAccounts.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/calls', callsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/escalations', agentHandoffRouter);
app.use('/api/demo-accounts', demoAccountsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`VoiceNexus backend listening on http://localhost:${config.port}`);
});
