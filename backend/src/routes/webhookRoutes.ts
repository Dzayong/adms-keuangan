import { Router } from 'express';
import { handleMockWebhook, handleDanaWebhook } from '../controllers/webhookController.js';

const router = Router();

router.post('/mock', handleMockWebhook);
router.post('/dana', handleDanaWebhook);

export default router;
