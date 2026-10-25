import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Get dashboard stats (counts)
 */
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [documentsCount, summariesCount, flashcardsCount, quizAttemptsCount, subjectsCount] =
      await Promise.all([
        prisma.document.count({ where: { userId } }),
        prisma.summary.count({ where: { userId } }),
        prisma.flashcard.count({ where: { userId } }),
        prisma.quizAttempt.count({ where: { userId } }),
        prisma.subject.count({ where: { userId } }),
      ]);

    res.json({
      success: true,
      data: {
        documents: documentsCount,
        summaries: summariesCount,
        flashcards: flashcardsCount,
        quizzes: quizAttemptsCount,
        subjects: subjectsCount,
      },
    });
  } catch (error: any) {
    console.error('GetStats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get recent study activity
 */
export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await prisma.studyHistory.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('GetRecentActivity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};
