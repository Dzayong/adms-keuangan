import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  createUser,
  resetUserPassword,
  updateWebhookUrl,
  getMe
} from '../controllers/userController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { fireWebhook } from '../utils/webhookDelivery.js';

const router = Router();

router.use(authMiddleware);

// Routes accessible to all authenticated users
router.get('/me', getMe);
router.put('/me/webhook', updateWebhookUrl);
router.post('/me/test-webhook', async (req, res) => {
  try {
    const { webhook_url } = req.body;
    if (!webhook_url) return res.status(400).json({ success: false, message: "Webhook URL diperlukan" });
    
    // Fire a test dummy payload
    fireWebhook(webhook_url, {
      transactionId: 'TEST-12345',
      invoiceNumber: 'INV-TEST-00000',
      status: 'PAID',
      amount: 10000,
      timestamp: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Ping webhook telah dikirim. Cek server Anda.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// User management requires ADMIN
router.use(roleMiddleware(['ADMIN'])); 

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id/role', updateUserRole);
router.put('/:id/active', toggleUserStatus);
router.put('/:id/reset-password', resetUserPassword);

export default router;
