import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/ai.service';

/**
 * Generate AI summary from document
 */
export const generateSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
     console.log('[DEBUG] Summary controller called');
    const { documentId, language = 'en', detailLevel = 'standard' } = req.body;

    if (!documentId) {
      res.status(400).json({
        success: false,
        error: 'Document ID is required.',
      });
      return;
    }

    // Validate language
    if (!['en', 'th'].includes(language)) {
      res.status(400).json({
        success: false,
        error: 'Language must be "en" or "th".',
      });
      return;
    }

    // Validate detail level
    if (!['brief', 'standard', 'detailed'].includes(detailLevel)) {
      res.status(400).json({
        success: false,
        error: 'Detail level must be "brief", "standard", or "detailed".',
      });
      return;
    }

    // Get document with extracted text
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: req.user!.id },
      include: { subject: true },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found.',
      });
      return;
    }

    if (!document.extractedText || document.extractedText.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'No extracted text available for this document. Please re-upload the file.',
      });
      return;
    }

    // Generate summary using AI (falls back to the local content analyzer when AI is unavailable)
    console.log('[DEBUG] About to call AIService.generateSummary');

    const result = await AIService.generateSummary(
      document.extractedText,
      language,
      detailLevel
    );

    console.log('[DEBUG] AI summary completed. Engine:', result.engine);

    // Save summary to database
    const summary = await prisma.summary.create({
      data: {
        title: `${language === 'th' ? 'สรุป' : 'Summary'}: ${document.title}`,
        content: result.data,
        language,
        detailLevel,
        documentId: document.id,
        subjectId: document.subjectId,
        userId: req.user!.id,
      },
    });

    // Log study history
    await prisma.studyHistory.create({
      data: {
        action: 'create_summary',
        resourceId: summary.id,
        resourceType: 'summary',
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: summary,
      meta: { engine: result.engine, warning: result.warning },
      message: 'Summary generated successfully.',
    });
  } catch (error: any) {
    console.error('GenerateSummary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary.',
    });
  }
};

/**
 * Get all summaries for current user
 */
export const getSummaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.query;

    const where: any = { userId: req.user!.id };
    if (subjectId) {
      where.subjectId = subjectId as string;
    }

    const summaries = await prisma.summary.findMany({
      where,
      include: {
        document: {
          select: { id: true, title: true, fileName: true },
        },
        subject: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { flashcards: true, quizQuestions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: summaries,
    });
  } catch (error: any) {
    console.error('GetSummaries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get a single summary
 */
export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const summary = await prisma.summary.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        document: {
          select: { id: true, title: true, fileName: true },
        },
        subject: {
          select: { id: true, name: true, color: true },
        },
        flashcards: true,
        quizQuestions: true,
      },
    });

    if (!summary) {
      res.status(404).json({
        success: false,
        error: 'Summary not found.',
      });
      return;
    }

    // Log study history
    await prisma.studyHistory.create({
      data: {
        action: 'view_summary',
        resourceId: summary.id,
        resourceType: 'summary',
        userId: req.user!.id,
      },
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('GetSummary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Update summary content
 */
export const updateSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const existing = await prisma.summary.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Summary not found.',
      });
      return;
    }

    const summary = await prisma.summary.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        isEdited: true,
      },
    });

    res.json({
      success: true,
      data: summary,
      message: 'Summary updated successfully.',
    });
  } catch (error: any) {
    console.error('UpdateSummary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Delete a summary
 */
export const deleteSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.summary.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Summary not found.',
      });
      return;
    }

    await prisma.summary.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Summary deleted successfully.',
    });
  } catch (error: any) {
    console.error('DeleteSummary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get 5 most recent summaries
 */
export const getRecentSummaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const summaries = await prisma.summary.findMany({
      where: { userId: req.user!.id },
      include: {
        document: {
          select: { id: true, title: true },
        },
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: summaries,
    });
  } catch (error: any) {
    console.error('GetRecentSummaries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};
