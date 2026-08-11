import { Response } from 'express';
import { querySql } from '../config/db.js';
import { Transaction } from '../models/types.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { formatRupiah } from '../utils/currency.js';

export async function getReportData(req: AuthenticatedRequest, res: Response) {
  try {
    const startDate = ((req.query.startDate as string) || '').trim();
    const endDate = ((req.query.endDate as string) || '').trim();
    const status = ((req.query.status as string) || '').trim();
    const search = ((req.query.search as string) || '').trim();

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (startDate) {
      whereConditions.push('t.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereConditions.push('t.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(t.invoice_number LIKE ? OR t.customer_name LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Summary Totals
    const summarySql = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) as paid_count,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status IN ('FAILED', 'EXPIRED', 'CANCELLED') THEN 1 ELSE 0 END), 0) as failed_count,
        COALESCE(SUM(CASE WHEN status IN ('FAILED', 'EXPIRED', 'CANCELLED') THEN amount ELSE 0 END), 0) as failed_amount
      FROM transactions t
      ${whereClause}
    `;

    const summaryResult = await querySql<any>(summarySql, params);
    const summary = summaryResult[0] || {};

    // Transactions list
    const itemsSql = `
      SELECT t.*, u.name as creator_name, p.provider_reference, p.payment_method
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN payments p ON p.transaction_id = t.id
      ${whereClause}
      ORDER BY t.id DESC
      LIMIT 1000
    `;

    const items = await querySql<Transaction>(itemsSql, params);

    return sendSuccess(res, {
      summary,
      items,
    });
  } catch (err: any) {
    console.error('Error fetching report:', err);
    return sendError(res, 'Gagal mengambil data laporan.', 500);
  }
}

export async function exportReportCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const startDate = ((req.query.startDate as string) || '').trim();
    const endDate = ((req.query.endDate as string) || '').trim();
    const status = ((req.query.status as string) || '').trim();

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (startDate) {
      whereConditions.push('t.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereConditions.push('t.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const items = await querySql<any>(`
      SELECT t.invoice_number, t.customer_name, t.customer_phone, t.amount, t.status, t.created_at, t.paid_at, p.provider_reference
      FROM transactions t
      LEFT JOIN payments p ON p.transaction_id = t.id
      ${whereClause}
      ORDER BY t.id DESC
    `, params);

    // Build CSV
    const headers = ['Invoice Number', 'Customer Name', 'Customer Phone', 'Amount (IDR)', 'Formatted Amount', 'Status', 'Created At', 'Paid At', 'Provider Reference'];
    const csvRows = [headers.join(',')];

    for (const item of items) {
      const row = [
        `"${item.invoice_number || ''}"`,
        `"${item.customer_name || ''}"`,
        `"${item.customer_phone || ''}"`,
        item.amount || 0,
        `"${formatRupiah(item.amount || 0)}"`,
        `"${item.status || ''}"`,
        `"${item.created_at || ''}"`,
        `"${item.paid_at || '-'}"`,
        `"${item.provider_reference || '-'}"`,
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan_qris_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err: any) {
    return sendError(res, 'Gagal mendownload laporan CSV.', 500);
  }
}
