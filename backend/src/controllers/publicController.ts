import { Request, Response } from 'express';
import { getSql, runSql } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import path from 'path';
import fs from 'fs';

interface PublicTxRow {
  id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  description: string;
  status: string;
  expired_at: string;
  payment_id: number;
  qr_content: string;
  payment_method: string;
  provider_code: string;
  proof_image_path: string | null;
}

export async function getPublicPayment(req: Request, res: Response) {
  try {
    const { invoiceNumber } = req.params;

    const tx = await getSql<PublicTxRow>(`
      SELECT
        t.id, t.invoice_number, t.customer_name, t.amount, t.description, t.status, t.expired_at,
        p.id as payment_id, p.qr_content, p.payment_method, p.proof_image_path,
        pp.code as provider_code
      FROM transactions t
      JOIN payments p ON p.transaction_id = t.id
      JOIN payment_providers pp ON pp.id = p.provider_id
      WHERE t.invoice_number = ?
    `, [invoiceNumber]);

    if (!tx) {
      return sendError(res, 'Tagihan tidak ditemukan.', 404);
    }

    // Only expose safe fields
    return sendSuccess(res, {
      invoiceNumber: tx.invoice_number,
      customerName: tx.customer_name,
      amount: tx.amount,
      description: tx.description,
      status: tx.status,
      expiredAt: tx.expired_at,
      paymentMethod: tx.payment_method,
      providerCode: tx.provider_code,
      qrContent: tx.provider_code === 'internal_qris' ? tx.qr_content : null,
      hasProof: !!tx.proof_image_path,
      paymentId: tx.payment_id,
    });
  } catch (err: any) {
    return sendError(res, 'Gagal mengambil data tagihan.', 500);
  }
}

export async function uploadPaymentProof(req: Request, res: Response) {
  try {
    const { invoiceNumber } = req.params;

    const tx = await getSql<PublicTxRow>(`
      SELECT t.id, t.status, p.id as payment_id, p.proof_image_path, pp.code as provider_code
      FROM transactions t
      JOIN payments p ON p.transaction_id = t.id
      JOIN payment_providers pp ON pp.id = p.provider_id
      WHERE t.invoice_number = ?
    `, [invoiceNumber]);

    if (!tx) return sendError(res, 'Tagihan tidak ditemukan.', 404);
    if (tx.status !== 'PENDING') return sendError(res, 'Tagihan sudah tidak aktif.', 400);

    if (!req.file) return sendError(res, 'File bukti bayar wajib diunggah.', 400);

    const proofPath = `/uploads/proofs/${req.file.filename}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await runSql(
      `UPDATE payments SET proof_image_path = ?, updated_at = ? WHERE id = ?`,
      [proofPath, now, tx.payment_id]
    );

    return sendSuccess(res, { proofPath }, 'Bukti bayar berhasil diunggah. Menunggu verifikasi admin.');
  } catch (err: any) {
    console.error('Upload proof error:', err);
    return sendError(res, 'Gagal mengunggah bukti bayar.', 500);
  }
}
