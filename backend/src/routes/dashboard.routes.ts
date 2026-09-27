import { Router } from 'express';
import { getDashboardData } from '../services/analytics.service';

const router = Router();

router.get('/summary', (_req, res) => {
  res.json(getDashboardData());
});

export default router;
