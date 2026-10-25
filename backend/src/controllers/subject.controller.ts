import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all subjects for current user
 */
export const getSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: {
            documents: true,
            summaries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error: any) {
    console.error('GetSubjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Create a new subject
 */
export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Subject name is required.',
      });
      return;
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description,
        color,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: subject,
      message: 'Subject created successfully.',
    });
  } catch (error: any) {
    console.error('CreateSubject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Update a subject
 */
export const updateSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Check ownership
    const existing = await prisma.subject.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Subject not found.',
      });
      return;
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: { name, description, color },
    });

    res.json({
      success: true,
      data: subject,
      message: 'Subject updated successfully.',
    });
  } catch (error: any) {
    console.error('UpdateSubject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Delete a subject
 */
export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.subject.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Subject not found.',
      });
      return;
    }

    await prisma.subject.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Subject deleted successfully.',
    });
  } catch (error: any) {
    console.error('DeleteSubject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get a single subject with counts
 */
export const getSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        _count: {
          select: {
            documents: true,
            summaries: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!subject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: subject,
    });
  } catch (error: any) {
    console.error('GetSubject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};
