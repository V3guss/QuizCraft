import { Router } from 'express';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubject,
} from '../controllers/subject.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/', getSubjects);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);
router.get('/:id', getSubject);

export default router;
