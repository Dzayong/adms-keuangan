import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  createUser,
  resetUserPassword,
} from '../controllers/userController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN'])); // All user management requires ADMIN

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id/role', updateUserRole);
router.put('/:id/active', toggleUserStatus);
router.put('/:id/reset-password', resetUserPassword);

export default router;
