import { Router } from 'express';
import { getStats, getCharts } from '../controllers/dashboard.controller';
import { auth } from '../middleware/auth';
import { RequestHandler } from 'express';

const router = Router();

// Apply auth middleware to all routes
router.use(auth);

// Dashboard routes
router.get('/stats', getStats as RequestHandler);
router.get('/charts', getCharts as RequestHandler);

export default router; 