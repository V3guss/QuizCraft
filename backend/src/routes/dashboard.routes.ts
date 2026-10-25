import { Router } from 'express';
import { getStats, getRecentActivity } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);

export default router;
