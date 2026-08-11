import { Router } from 'express';
import {
  getAllProviders,
  toggleProviderStatus,
} from '../controllers/providerController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN'])); // All provider management requires ADMIN

router.get('/', getAllProviders);
router.put('/:id/active', toggleProviderStatus);

export default router;
