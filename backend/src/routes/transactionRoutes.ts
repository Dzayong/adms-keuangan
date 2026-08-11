import { Router } from 'express';
import {
  getAllTransactions,
  getTransactionById,
  getDashboardStats,
  cancelTransaction,
} from '../controllers/transactionController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.post('/:id/cancel', roleMiddleware(['ADMIN']), cancelTransaction);

export default router;
