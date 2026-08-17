import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { querySql, runSql } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const keys = await querySql(`
      SELECT 
        id, 
        name, 
        key_hint, 
        is_active, 
        created_at, 
        last_used_at 
      FROM api_keys 
      ORDER BY id DESC
    `);
    
    // Map is_active to a clear string status
    const formattedKeys = keys.map((k: any) => ({
      ...k,
      status: k.is_active === 1 ? 'ACTIVE' : 'REVOKED'
    }));
    
    res.json({ success: true, data: formattedKeys });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'Application name is required' } });
    }

    const randomSecret = crypto.randomBytes(32).toString('hex');
    const plaintextKey = `adms_sk_test_${randomSecret}`;
    const keyHash = bcrypt.hashSync(plaintextKey, 10);
    const keyHint = `adms_sk_test_••••••••••••${randomSecret.slice(-4)}`;

    const { lastInsertRowid } = await runSql(
      `INSERT INTO api_keys (name, key_hash, key_hint, permissions) VALUES (?, ?, ?, ?)`,
      [name, keyHash, keyHint, '["payments:create","payments:read"]']
    );

    res.json({
      success: true,
      data: {
        id: lastInsertRowid,
        name,
        key_hint: keyHint,
        key: plaintextKey // Sent exactly once
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/revoke', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await runSql(
      `UPDATE api_keys SET is_active = 0 WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await runSql(
      `DELETE FROM api_keys WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
