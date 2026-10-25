import { Router } from 'express';
import {
  getUsers,
  updateUser,
  deleteUser,
  getAdminStats,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

// All routes are protected and admin-only
router.use(authMiddleware);
router.use(roleGuard('ADMIN'));

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/stats', getAdminStats);

export default router;
