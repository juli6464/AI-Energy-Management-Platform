import { Router } from 'express';
import { listMeters, listMeterReadings, meterExists } from '../services/meters.service';
import { getMeterDetail } from '../services/analytics.service';
import { MeterStatus } from '../types';

const router = Router();

const VALID_SEVERITIES: Array<'all' | MeterStatus> = ['all', 'normal', 'alert', 'critical'];

router.get('/', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const severityParam = typeof req.query.severity === 'string' ? req.query.severity : 'all';

  if (!VALID_SEVERITIES.includes(severityParam as any)) {
    return res.status(400).json({ error: `Invalid severity filter. Use one of: ${VALID_SEVERITIES.join(', ')}` });
  }

  const meters = listMeters({ search, severity: severityParam as 'all' | MeterStatus });
  res.json({ meters, total: meters.length });
});

router.get('/:meterId', (req, res) => {
  const { meterId } = req.params;
  if (!meterExists(meterId)) {
    return res.status(404).json({ error: `Meter ${meterId} not found` });
  }
  res.json(getMeterDetail(meterId));
});

router.get('/:meterId/readings', (req, res) => {
  const { meterId } = req.params;
  if (!meterExists(meterId)) {
    return res.status(404).json({ error: `Meter ${meterId} not found` });
  }
  res.json({ meter_id: meterId, readings: listMeterReadings(meterId) });
});

export default router;
