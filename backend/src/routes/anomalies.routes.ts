import { Router } from 'express';
import { analyzeAllMeters, isDetectedCandidate } from '../services/analytics.service';

const router = Router();

// Includes false positives (anomaly:false) that the engine still flagged and
// explained, per the spec's "Pantalla de Anomalias IA" (M-106 must appear, listed
// as False Positive / Low / "No escalar", not be silently hidden).
router.get('/', (_req, res) => {
  const anomalies = analyzeAllMeters().filter(isDetectedCandidate);
  res.json({ anomalies, total: anomalies.length });
});

export default router;
