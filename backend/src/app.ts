import express from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.routes';
import metersRoutes from './routes/meters.routes';
import anomaliesRoutes from './routes/anomalies.routes';
import aiRoutes from './routes/ai.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meters', metersRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/ai', aiRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
