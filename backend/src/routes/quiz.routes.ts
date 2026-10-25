import { Router } from 'express';
import {
  generateQuiz,
  getQuizQuestions,
  submitQuiz,
  getQuizAttempts,
} from '../controllers/quiz.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.post('/generate', generateQuiz);
router.get('/questions', getQuizQuestions);
router.post('/submit', submitQuiz);
router.get('/attempts', getQuizAttempts);

export default router;
