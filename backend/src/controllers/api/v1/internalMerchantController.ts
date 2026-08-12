import { Response, Request } from 'express';
import { z } from 'zod';
import { getSql, runSql } from '../../../config/db.js';
import fs from 'fs';
import path from 'path';

// Schema for updating internal merchant
const updateMerchantSchema = z.object({
  name: z.string().min(1, 'Merchant name is required').max(100),
  nmid: z.string().min(1, 'NMID is required').max(50),
  isActive: z.boolean(),
  qrisImageBase64: z.string().optional() // "data:image/png;base64,...."
});

function getExtensionFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }

  // WebP: RIFF ... WEBP
  if (buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'webp';
  }

  return null;
}

export async function getInternalMerchant(req: Request, res: Response) {
  try {
    const merchant = await getSql('SELECT * FROM internal_merchants LIMIT 1');
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Internal merchant not found' });
    }
    return res.status(200).json({ success: true, data: merchant });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateInternalMerchant(req: Request, res: Response) {
  try {
    const parseResult = updateMerchantSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, message: parseResult.error.issues.map(i => i.message).join(', ') });
    }

    const { name, nmid, isActive, qrisImageBase64 } = parseResult.data;

    let imagePath = undefined;

    if (qrisImageBase64) {
      // Decode base64
      const matches = qrisImageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      let base64Data = qrisImageBase64;
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Strict size limit check just in case it bypassed json limit somehow
      if (buffer.length > 1024 * 1024) { // 1 MB
        return res.status(400).json({ success: false, message: 'Image size exceeds 1MB limit.' });
      }

      // Check magic bytes
      const ext = getExtensionFromMagicBytes(buffer);
      if (!ext) {
        return res.status(400).json({ success: false, message: 'Invalid image format. Only PNG, JPEG, and WebP are allowed.' });
      }

      // Save file securely
      const uploadsDir = path.join(process.cwd(), 'uploads', 'qris');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `internal_office_qris_${Date.now()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);
      
      // Store relative path in db
      imagePath = `/uploads/qris/${filename}`;
    }

    const current = await getSql<{id: number, qris_image_path: string}>('SELECT id, qris_image_path FROM internal_merchants LIMIT 1');
    if (!current) {
      return res.status(404).json({ success: false, message: 'Internal merchant not found' });
    }

    const finalImagePath = imagePath || current.qris_image_path;

    await runSql(
      'UPDATE internal_merchants SET name = ?, nmid = ?, is_active = ?, qris_image_path = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
      [name, nmid, isActive ? 1 : 0, finalImagePath, current.id]
    );

    return res.status(200).json({ success: true, message: 'Internal merchant updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
