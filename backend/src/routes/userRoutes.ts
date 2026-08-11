import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
} from '../controllers/userController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN'])); // All user management requires ADMIN

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.put('/:id/active', toggleUserStatus);

export default router;
