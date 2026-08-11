import { Router } from 'express';
import { getReportData, exportReportCsv } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getReportData);
router.get('/export/csv', exportReportCsv);

export default router;
