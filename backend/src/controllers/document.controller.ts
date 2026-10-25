import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { TextExtractorService } from '../services/textExtractor.service';

/**
 * Upload a document file
 */
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded.',
      });
      return;
    }

    const { subjectId, title, description } = req.body;

    if (!subjectId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        success: false,
        error: 'Subject ID is required.',
      });
      return;
    }

    // Verify subject belongs to user
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: req.user!.id },
    });

    if (!subject) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({
        success: false,
        error: 'Subject not found.',
      });
      return;
    }

    // Extract text from document
    let extractedText = '';
    try {
      extractedText = await TextExtractorService.extractText(
        req.file.path,
        req.file.mimetype
      );
    } catch (extractError: any) {
      console.error('Text extraction warning:', extractError.message);
      // Continue even if extraction fails
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: title || req.file.originalname,
        description,
        fileName: req.file.originalname,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        fileSize: req.file.size,
        filePath: req.file.path,
        extractedText,
        subjectId,
        userId: req.user!.id,
      },
    });

    // Log study history
    await prisma.studyHistory.create({
      data: {
        action: 'upload_document',
        resourceId: document.id,
        resourceType: 'document',
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...document,
        extractedText: extractedText ? `${extractedText.substring(0, 500)}...` : null,
      },
      message: 'Document uploaded successfully.',
    });
  } catch (error: any) {
    console.error('UploadDocument error:', error);
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get all documents for current user
 */
export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.query;

    const where: any = { userId: req.user!.id };
    if (subjectId) {
      where.subjectId = subjectId as string;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { summaries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Don't send extractedText in list view
    const sanitized = documents.map(({ extractedText, ...doc }) => doc);

    res.json({
      success: true,
      data: sanitized,
    });
  } catch (error: any) {
    console.error('GetDocuments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get a single document with extracted text
 */
export const getDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error('GetDocument error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Delete a document and its file
 */
export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found.',
      });
      return;
    }

    // Delete physical file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from database (cascades to summaries)
    await prisma.document.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error: any) {
    console.error('DeleteDocument error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get 5 most recent documents
 */
export const getRecentDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user!.id },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Don't send extractedText
    const sanitized = documents.map(({ extractedText, ...doc }) => doc);

    res.json({
      success: true,
      data: sanitized,
    });
  } catch (error: any) {
    console.error('GetRecentDocuments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};
