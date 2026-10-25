import { Router } from 'express';
import {
  generateFlashcards,
  getFlashcards,
  deleteFlashcard,
} from '../controllers/flashcard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.post('/generate', generateFlashcards);
router.get('/', getFlashcards);
router.delete('/:id', deleteFlashcard);

export default router;
