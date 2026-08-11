import { Router } from 'express';
import { apiCreatePayment, apiGetPayment } from '../../../controllers/api/v1/paymentController.js';
import { apiAuth, requirePermission } from '../../../middleware/apiAuth.js';

const router = Router();

router.use(apiAuth);

router.post('/', requirePermission('payments:create'), apiCreatePayment);
router.get('/:id', requirePermission('payments:read'), apiGetPayment);

export default router;
