import { Router } from 'express';
import express from 'express';
import { getInternalMerchant, updateInternalMerchant } from '../../../controllers/api/v1/internalMerchantController.js';
import { authMiddleware, roleMiddleware } from '../../../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['ADMIN', 'OPERATOR']), getInternalMerchant);

// Apply strict 1MB limit specifically to this upload route, bypassing the global limit if needed.
// Express allows route-specific body parsers. 
router.put('/', roleMiddleware(['ADMIN']), express.json({ limit: '5mb' }), updateInternalMerchant);

export default router;
