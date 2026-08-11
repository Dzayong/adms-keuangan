import { Router } from 'express';
import {
  createPayment,
  getPaymentDetail,
  simulatePayment,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/create', createPayment);
router.get('/:id', getPaymentDetail);
router.post('/:id/simulate', simulatePayment);

export default router;
