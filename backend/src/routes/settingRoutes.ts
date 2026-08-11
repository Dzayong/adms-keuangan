import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettings);
router.post('/', roleMiddleware(['ADMIN']), updateSettings);

export default router;
