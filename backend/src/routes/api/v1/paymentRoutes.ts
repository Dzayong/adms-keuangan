import { Router } from 'express';
import { apiCreatePayment, apiGetPayment, apiGetPaymentByInvoice } from '../../../controllers/api/v1/paymentController.js';
import { apiAuth, requirePermission } from '../../../middleware/apiAuth.js';

const router = Router();

router.use(apiAuth);

router.post('/', requirePermission('payments:create'), apiCreatePayment);
// Must be before /:id to avoid "invoice" being parsed as an ID
router.get('/invoice/:invoiceNumber', requirePermission('payments:read'), apiGetPaymentByInvoice);
router.get('/:id', requirePermission('payments:read'), apiGetPayment);

export default router;
