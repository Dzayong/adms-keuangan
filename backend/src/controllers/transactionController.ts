import { Response } from 'express';
import { querySql, getSql, runSql } from '../config/db.js';
import { Transaction, Payment, PaymentLog } from '../models/types.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAllTransactions(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '10', 10)));
    const offset = (page - 1) * limit;

    const search = ((req.query.search as string) || '').trim();
    const status = ((req.query.status as string) || '').trim();
    const startDate = ((req.query.startDate as string) || '').trim();
    const endDate = ((req.query.endDate as string) || '').trim();

    let whereConditions: string[] = [];
    let params: any[] = [];

    // MERCHANT: hanya lihat transaksi milik sistem mereka
    // IT: lihat semua transaksi (tidak difilter)
    if (req.user?.role === 'MERCHANT' && req.user?.source_system) {
      whereConditions.push('t.source_system = ?');
      params.push(req.user.source_system);
    }

    if (search) {
      whereConditions.push('(t.invoice_number LIKE ? OR t.customer_name LIKE ? OR t.customer_phone LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    if (startDate) {
      whereConditions.push('t.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereConditions.push('t.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count Total
    const countSql = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
    const countResult = await querySql<{ total: number }>(countSql, params);
    const totalItems = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    // Fetch Data
    const dataSql = `
      SELECT
        t.*,
        u.name as creator_name,
        p.id as payment_id,
        p.qr_content,
        p.provider_reference,
        p.payment_method,
        p.proof_image_path,
        pp.code as provider_code
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN payments p ON p.transaction_id = t.id
      LEFT JOIN payment_providers pp ON pp.id = p.provider_id
      ${whereClause}
      ORDER BY t.id DESC
      LIMIT ? OFFSET ?
    `;

    const transactions = await querySql<Transaction>(dataSql, [...params, limit, offset]);

    return sendSuccess(res, {
      transactions,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
    return sendError(res, 'Gagal mengambil daftar transaksi.', 500);
  }
}

export async function getTransactionById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 'ID Transaksi tidak valid.', 400);
    }

    const transaction = await getSql<Transaction>(`
      SELECT
        t.*,
        u.name as creator_name,
        p.id as payment_id,
        p.qr_content,
        p.provider_reference,
        p.payment_method,
        p.proof_image_path,
        pp.code as provider_code
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN payments p ON p.transaction_id = t.id
      LEFT JOIN payment_providers pp ON pp.id = p.provider_id
      WHERE t.id = ?
    `, [id]);

    if (!transaction) {
      return sendError(res, 'Transaksi tidak ditemukan.', 404);
    }

    // Get Payment and Logs
    let payment = null;
    let logs: PaymentLog[] = [];

    if (transaction.payment_id) {
      payment = await getSql<Payment>('SELECT * FROM payments WHERE id = ?', [transaction.payment_id]);
      logs = await querySql<PaymentLog>('SELECT * FROM payment_logs WHERE payment_id = ? ORDER BY id DESC', [transaction.payment_id]);
    }

    return sendSuccess(res, {
      transaction,
      payment,
      logs,
    });
  } catch (err: any) {
    return sendError(res, 'Gagal mengambil detail transaksi.', 500);
  }
}

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const { month, year } = req.query; 
    
    let whereClause = '';
    let params: any[] = [];
    
    if (month && typeof month === 'string') {
      whereClause = 'WHERE created_at LIKE ?';
      params.push(`${month}%`);
    } else if (year && typeof year === 'string') {
      whereClause = 'WHERE created_at LIKE ?';
      params.push(`${year}-%`);
    }

    // Aggregates
    const statsResult = await querySql<{
      total_count: number;
      total_amount: number;
      paid_count: number;
      paid_amount: number;
      pending_count: number;
      pending_amount: number;
      failed_count: number;
      failed_amount: number;
    }>(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) as paid_count,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status IN ('FAILED', 'EXPIRED', 'CANCELLED') THEN 1 ELSE 0 END), 0) as failed_count,
        COALESCE(SUM(CASE WHEN status IN ('FAILED', 'EXPIRED', 'CANCELLED') THEN amount ELSE 0 END), 0) as failed_amount
      FROM transactions
      ${whereClause}
    `, params);

    const stats = statsResult[0] || {
      total_count: 0,
      total_amount: 0,
      paid_count: 0,
      paid_amount: 0,
      pending_count: 0,
      pending_amount: 0,
      failed_count: 0,
      failed_amount: 0,
    };

    // Chart Data (Last 7 Days)
    const chartRows = await querySql<{ date: string; paid_amount: number; count: number }>(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_amount,
        COUNT(*) as count
      FROM transactions
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `, params);

    // Recent Transactions (Last 5)
    const recentTransactions = await querySql<Transaction>(`
      SELECT t.*, p.qr_content 
      FROM transactions t
      LEFT JOIN payments p ON p.transaction_id = t.id
      ${whereClause ? whereClause.replace('created_at', 't.created_at') : ''}
      ORDER BY t.id DESC
      LIMIT 5
    `, params);

    return sendSuccess(res, {
      stats,
      chartData: chartRows.reverse(),
      recentTransactions,
    });
  } catch (err: any) {
    console.error('Error in getDashboardStats:', err);
    return sendError(res, 'Gagal mengambil data statistik dashboard.', 500);
  }
}

export async function cancelTransaction(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const transaction = await getSql<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);

    if (!transaction) {
      return sendError(res, 'Transaksi tidak ditemukan.', 404);
    }

    if (transaction.status !== 'PENDING') {
      return sendError(res, "Transaksi tidak dapat dibatalkan karena berstatus " + transaction.status + ".", 400);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await runSql("UPDATE transactions SET status = 'CANCELLED', updated_at = ? WHERE id = ?", [now, id]);
    await runSql("UPDATE payments SET status = 'CANCELLED', updated_at = ? WHERE transaction_id = ?", [now, id]);

    return sendSuccess(res, {}, 'Transaksi berhasil dibatalkan.');
  } catch (err: any) {
    return sendError(res, 'Gagal membatalkan transaksi.', 500);
  }
}

export async function getPendingVerificationCount(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await querySql<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM transactions t
      JOIN payments p ON p.transaction_id = t.id
      JOIN payment_providers pp ON pp.id = p.provider_id
      WHERE t.status = 'PENDING' AND pp.code = 'internal_qris'
    `);
    return sendSuccess(res, { count: result[0]?.count || 0 });
  } catch (err: any) {
    return sendError(res, 'Gagal mengambil data.', 500);
  }
}

export async function autoExpireTransactions(): Promise<number> {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const expired = await querySql<{ id: number }>(
    `SELECT id FROM transactions WHERE status = 'PENDING' AND expired_at < ?`,
    [now]
  );
  if (expired.length === 0) return 0;

  const ids = expired.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');
  await runSql(
    `UPDATE transactions SET status = 'EXPIRED', updated_at = ? WHERE id IN (${placeholders})`,
    [now, ...ids]
  );
  await runSql(
    `UPDATE payments SET status = 'EXPIRED', updated_at = ? WHERE transaction_id IN (${placeholders})`,
    [now, ...ids]
  );
  return ids.length;
}

export async function getLatestPaidTransaction(req: AuthenticatedRequest, res: Response) {
  try {
    let whereClause = "WHERE status = 'PAID'";
    let params: any[] = [];

    // Filter by source system if merchant
    if (req.user?.role === 'MERCHANT' && req.user?.source_system) {
      whereClause += " AND source_system = ?";
      params.push(req.user.source_system);
    }

    const rows = await querySql<{id: number}>(`SELECT id FROM transactions ${whereClause} ORDER BY updated_at DESC LIMIT 1`, params);
    return sendSuccess(res, { id: rows.length > 0 ? rows[0].id : null });
  } catch (err: any) {
    console.error('Error fetching latest paid transaction:', err);
    return sendError(res, 'Gagal mengambil data transaksi terakhir.', 500);
  }
}
