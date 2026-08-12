import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { querySql } from '../config/db.js';

export interface ApiAuthenticatedRequest extends Request {
  apiApp?: {
    id: number;
    name: string;
    permissions: string[];
  };
}

export async function apiAuth(req: ApiAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing API Key in headers (X-API-Key).' } });
    }

    // Since API Keys are bcrypt hashed, we need to load active keys and compare.
    const activeKeys = await querySql<{ id: number, name: string, key_hash: string, permissions: string }>('SELECT id, name, key_hash, permissions FROM api_keys WHERE is_active = 1');

    let matchedApp = null;
    for (const keyRecord of activeKeys) {
      if (bcrypt.compareSync(apiKey, keyRecord.key_hash)) {
        matchedApp = keyRecord;
        break;
      }
    }

    if (!matchedApp) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API Key.' } });
    }

    let parsedPermissions: string[] = [];
    try {
      parsedPermissions = JSON.parse(matchedApp.permissions);
    } catch (e) {
      parsedPermissions = [];
    }

    req.apiApp = {
      id: matchedApp.id,
      name: matchedApp.name,
      permissions: parsedPermissions
    };

    // Update last_used_at asynchronously
    import('../config/db.js').then(({ runSql }) => {
      runSql("UPDATE api_keys SET last_used_at = datetime('now', 'localtime') WHERE id = ?", [matchedApp.id]).catch(err => {
        console.error('Failed to update last_used_at:', err);
      });
    });

    next();
  } catch (err) {
    console.error('API Auth Error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error during authentication.' } });
  }
}

export function requirePermission(permission: string) {
  return (req: ApiAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.apiApp) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } });
    }
    
    if (!req.apiApp.permissions.includes(permission)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Forbidden. Missing required permission: ${permission}` } });
    }

    next();
  };
}
