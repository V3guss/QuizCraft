import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/ai.service';

/**
 * Generate flashcards from a summary using AI
 */
export const generateFlashcards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { summaryId, count = 10, language } = req.body;
    const n = Math.min(Math.max(parseInt(String(count), 10) || 10, 1), 50);

    if (!summaryId) {
      res.status(400).json({
        success: false,
        error: 'Summary ID is required.',
      });
      return;
    }

    // Get the summary
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

    // Generate flashcards from the original document text (richer than the summary alone)
    const lang = language === 'en' || language === 'th' ? language : summary.language === 'en' ? 'en' : 'th';
    const source = summary.document?.extractedText?.trim() ? summary.document.extractedText : summary.content;
    const generated = await AIService.generateFlashcards(source, n, lang);
    const flashcardData = generated.data;

    if (!flashcardData.length) {
      res.status(422).json({ success: false, error: 'Not enough content to create flashcards.' });
      return;
    }

    // Save flashcards to database
    const flashcards = await Promise.all(
      flashcardData.map((card) =>
        prisma.flashcard.create({
          data: {
            front: card.front,
            back: card.back,
            summaryId: summary.id,
            userId: req.user!.id,
          },
        })
      )
    );

    // Log study history
    await prisma.studyHistory.create({
      data: {
        action: 'review_flashcard',
        resourceId: summary.id,
        resourceType: 'flashcard',
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: flashcards,
      meta: { engine: generated.engine, warning: generated.warning },
      message: `${flashcards.length} flashcards generated successfully.`,
    });
  } catch (error: any) {
    console.error('GenerateFlashcards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate flashcards.',
    });
  }
};

/**
 * Get all flashcards (with optional summaryId filter)
 */
export const getFlashcards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { summaryId } = req.query;

    const where: any = { userId: req.user!.id };
    if (summaryId) {
      where.summaryId = summaryId as string;
    }

    const flashcards = await prisma.flashcard.findMany({
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
      data: flashcards,
    });
  } catch (error: any) {
    console.error('GetFlashcards error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Delete a flashcard
 */
export const deleteFlashcard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.flashcard.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Flashcard not found.',
      });
      return;
    }

    await prisma.flashcard.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Flashcard deleted successfully.',
    });
  } catch (error: any) {
    console.error('DeleteFlashcard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};
