import { Router } from 'express';
import { getPublicPayment, uploadPaymentProof } from '../controllers/publicController.js';
import { proofUpload } from '../utils/upload.js';

const router = Router();

router.get('/pay/:invoiceNumber', getPublicPayment);
router.post('/pay/:invoiceNumber/proof', proofUpload.single('proof'), uploadPaymentProof);

export default router;
