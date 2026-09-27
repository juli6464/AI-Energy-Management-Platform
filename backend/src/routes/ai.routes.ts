import { Router } from 'express';
import { analyzeAllMeters, analyzeMeter } from '../services/analytics.service';
import { meterExists } from '../services/meters.service';

const router = Router();

router.post('/analyze', (req, res) => {
  const meterId = typeof req.body?.meter_id === 'string' ? req.body.meter_id : undefined;

  if (meterId) {
    if (!meterExists(meterId)) {
      return res.status(404).json({ error: `Meter ${meterId} not found` });
    }
    return res.json(analyzeMeter(meterId));
  }

  const reports = analyzeAllMeters();
  res.json({ reports, total: reports.length, analyzed_at: new Date().toISOString() });
});

export default router;
