import { Router } from 'express';
import { login, logout, getMe, getLoginLogs } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.get('/logs', authMiddleware, getLoginLogs);

export default router;
