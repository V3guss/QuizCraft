import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/ai.service';

/**
 * Generate quiz questions from a summary using AI
 */
export const generateQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { summaryId, count = 10, difficulty = 'medium', language } = req.body;

    if (!summaryId) {
      res.status(400).json({
        success: false,
        error: 'Summary ID is required.',
      });
      return;
    }

    if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
      res.status(400).json({ success: false, error: 'Difficulty must be easy, medium, hard or mixed.' });
      return;
    }
    const n = parseInt(String(count), 10);
    if (!Number.isInteger(n) || n < 1 || n > 50) {
      res.status(400).json({ success: false, error: 'Number of questions must be between 1 and 50.' });
      return;
    }

    // Get the summary (and its source document)
    const summary = await prisma.summary.findFirst({
      where: { id: summaryId, userId: req.user!.id },
      include: { document: { select: { extractedText: true } } },
    });

    if (!summary) {
      res.status(404).json({
        success: false,
        error: 'Summary not found.',
      });
      return;
    }

    // Questions are written from the original document text (falls back to the summary)
    const lang = language === 'en' || language === 'th' ? language : summary.language === 'en' ? 'en' : 'th';
    const source = summary.document?.extractedText?.trim() ? summary.document.extractedText : summary.content;
    const generated = await AIService.generateQuizQuestions(source, n, { difficulty, language: lang });
    const questionsData = generated.data;

    if (!questionsData.length) {
      res.status(422).json({ success: false, error: 'Not enough content in this document to create questions.' });
      return;
    }

    // Save quiz questions to database
    const questions = await Promise.all(
      questionsData.map((q) =>
        prisma.quizQuestion.create({
          data: {
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty,
            language: lang,
            summaryId: summary.id,
            userId: req.user!.id,
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      data: questions.map((q) => ({
        ...q,
        options: JSON.parse(q.options),
      })),
      meta: { engine: generated.engine, warning: generated.warning, requested: n, created: questions.length },
      message: `${questions.length} quiz questions generated successfully.`,
    });
  } catch (error: any) {
    console.error('GenerateQuiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz questions.',
    });
  }
};

/**
 * Get quiz questions (with optional summaryId filter)
 */
export const getQuizQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { summaryId } = req.query;

    const where: any = { userId: req.user!.id };
    if (summaryId) {
      where.summaryId = summaryId as string;
    }

    const questions = await prisma.quizQuestion.findMany({
      where,
      include: {
        summary: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: questions.map((q) => ({
        ...q,
        options: JSON.parse(q.options),
      })),
    });
  } catch (error: any) {
    console.error('GetQuizQuestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Submit quiz answers and get score
 */
export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers } = req.body;
    // answers should be: [{ questionId: string, selectedAnswer: number }]

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Answers array is required.',
      });
      return;
    }

    // Get all question IDs
    const questionIds = answers.map((a: any) => a.questionId);

    const questions = await prisma.quizQuestion.findMany({
      where: {
        id: { in: questionIds },
        userId: req.user!.id,
      },
    });

    if (questions.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No valid questions found.',
      });
      return;
    }

    // Calculate score
    let score = 0;
    const results = answers.map((answer: any) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) {
        return {
          questionId: answer.questionId,
          correct: false,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: -1,
        };
      }

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) score++;

      return {
        questionId: answer.questionId,
        question: question.question,
        correct: isCorrect,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        options: JSON.parse(question.options),
      };
    });

    // Save quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        score,
        totalQuestions: questions.length,
        answers: JSON.stringify(results),
        userId: req.user!.id,
      },
    });

    // Log study history
    await prisma.studyHistory.create({
      data: {
        action: 'take_quiz',
        resourceId: attempt.id,
        resourceType: 'quiz_attempt',
        userId: req.user!.id,
      },
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        results,
      },
      message: `Quiz completed! Score: ${score}/${questions.length}`,
    });
  } catch (error: any) {
    console.error('SubmitQuiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get quiz attempt history
 */
export const getQuizAttempts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: attempts.map((a) => ({
        ...a,
        answers: JSON.parse(a.answers),
      })),
    });
  } catch (error: any) {
    console.error('GetQuizAttempts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};
