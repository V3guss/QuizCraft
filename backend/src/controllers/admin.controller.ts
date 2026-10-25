import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all users (Admin only)
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            documents: true,
            summaries: true,
            subjects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Admin GetUsers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Update a user (Admin only)
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'User not found.',
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully.',
    });
  } catch (error: any) {
    console.error('Admin UpdateUser error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Delete a user (Admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.id) {
      res.status(400).json({
        success: false,
        error: 'You cannot delete your own account.',
      });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'User not found.',
      });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error: any) {
    console.error('Admin DeleteUser error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};

/**
 * Get system-wide stats (Admin only)
 */
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [usersCount, documentsCount, summariesCount, flashcardsCount, quizAttemptsCount, subjectsCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.document.count(),
        prisma.summary.count(),
        prisma.flashcard.count(),
        prisma.quizAttempt.count(),
        prisma.subject.count(),
      ]);

    res.json({
      success: true,
      data: {
        users: usersCount,
        documents: documentsCount,
        summaries: summariesCount,
        flashcards: flashcardsCount,
        quizAttempts: quizAttemptsCount,
        subjects: subjectsCount,
      },
    });
  } catch (error: any) {
    console.error('Admin GetStats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
};
