import { Router } from 'express';
import {
  generateSummary,
  getSummaries,
  getSummary,
  updateSummary,
  deleteSummary,
  getRecentSummaries,
} from '../controllers/summary.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/recent', getRecentSummaries);
router.post('/generate', generateSummary);
router.get('/', getSummaries);
router.get('/:id', getSummary);
router.put('/:id', updateSummary);
router.delete('/:id', deleteSummary);

export default router;
