import initSqlJs, { Database } from 'sql.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Pastikan dotenv membaca .env di root
dotenv.config({ path: path.join(process.cwd(), '../.env') });

let db: Database | null = null;
let poolWrapper: any = null;

export async function getDb(): Promise<any> {
  if (poolWrapper) return poolWrapper;

  const SQL = await initSqlJs();
  db = new SQL.Database(); // In-memory database

  poolWrapper = new PoolWrapper();
  await initSchemaAndSeed();
  return poolWrapper;
}

export function saveDb() {
  // no-op for in-memory dummy
}

class PoolWrapper {
  private formatSql(sql: string) {
    let s = sql.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
    s = s.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
    s = s.replace(/INSERT IGNORE INTO/gi, 'INSERT OR IGNORE INTO');
    return s;
  }

  async query(sql: string, params: any[] = []) {
    sql = this.formatSql(sql);
    if (!db) throw new Error("DB not init");
    
    try {
      if (params.length === 0 && sql.includes(';')) {
         db.exec(sql);
         return [[]];
      }
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while(stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return [rows];
    } catch(e) {
      console.error("SQL Error in query:", sql, e);
      throw e;
    }
  }

  async execute(sql: string, params: any[] = []) {
    sql = this.formatSql(sql);
    if (!db) throw new Error("DB not init");
    
    try {
      db.run(sql, params);
      const res = db.exec("SELECT last_insert_rowid() as id, changes() as c");
      const insertId = res[0]?.values[0][0] || 0;
      const affectedRows = res[0]?.values[0][1] || 0;
      return [{ insertId, affectedRows }];
    } catch(e) {
      console.error("SQL Error in execute:", sql, e);
      throw e;
    }
  }

  async getConnection() {
    return {
      beginTransaction: async () => { db?.exec("BEGIN TRANSACTION"); },
      commit: async () => { db?.exec("COMMIT"); },
      rollback: async () => { db?.exec("ROLLBACK"); },
      execute: this.execute.bind(this),
      release: () => {}
    };
  }
}

async function initSchemaAndSeed() {
  const pool = poolWrapper;
  if (!pool) return;
  
  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'OPERATOR',
      profile_photo TEXT,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      source_system VARCHAR(100) DEFAULT NULL,
      api_key_id INT DEFAULT NULL,
      webhook_url VARCHAR(255) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number VARCHAR(255) NOT NULL UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) DEFAULT '',
      amount DECIMAL(15, 2) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      expired_at DATETIME NOT NULL,
      paid_at DATETIME,
      idempotency_key VARCHAR(255) UNIQUE,
      created_by INT NOT NULL,
      callback_url TEXT DEFAULT NULL,
      source_system VARCHAR(100) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INT NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      ip_address VARCHAR(255),
      user_agent TEXT,
      login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(255) NOT NULL UNIQUE,
      environment VARCHAR(50) NOT NULL DEFAULT 'sandbox',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS internal_merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      nmid VARCHAR(255) UNIQUE NOT NULL,
      qris_image_path TEXT NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INT NOT NULL,
      provider_id INT NOT NULL,
      provider_reference VARCHAR(255) NOT NULL,
      qr_content TEXT NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'QRIS',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      paid_at DATETIME,
      proof_image_path TEXT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
    );

    CREATE TABLE IF NOT EXISTS payment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INT NOT NULL,
      event_type VARCHAR(255) NOT NULL,
      reference VARCHAR(255) NOT NULL,
      payload TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      \`key\` VARCHAR(255) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      key_hash VARCHAR(255) NOT NULL,
      permissions TEXT NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      last_used_at DATETIME,
      key_hint VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_id INT,
      source_system VARCHAR(100),
      method VARCHAR(10) NOT NULL,
      path VARCHAR(255) NOT NULL,
      status_code INT NOT NULL,
      ip_address VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
    );
  `);

  // Seed Users if empty
  const [userRows]: any = await pool.query("SELECT COUNT(*) as count FROM users");
  const count = userRows[0].count;

  if (count === 0) {
    const adminPassHash = bcrypt.hashSync('Admin123!', 10);
    const opPassHash = bcrypt.hashSync('Operator123!', 10);
    const itPassHash = bcrypt.hashSync('adms123!', 10);

    await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'ADMIN', 1)`,
      ['System Administrator', 'admin@admsqris.local', adminPassHash]
    );
    await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'OPERATOR', 1)`,
      ['Operations Staff', 'operator@admsqris.local', opPassHash]
    );
    await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'IT', 1)`,
      ['IT Gateway Team', 'it@adms.gateway', itPassHash]
    );
  }

  // Ensure IT account always exists even on existing DB
  const [itRows]: any = await pool.query("SELECT COUNT(*) as count FROM users WHERE email = 'it@adms.gateway'");
  if (itRows[0].count === 0) {
    const itPassHash = bcrypt.hashSync('adms123!', 10);
    await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'IT', 1)`,
      ['IT Gateway Team', 'it@adms.gateway', itPassHash]
    );
    console.log('[ADMS] IT account created: it@adms.gateway / adms123!');
  }

  // Seed Providers if empty
  const [providerRows]: any = await pool.query("SELECT COUNT(*) as count FROM payment_providers");
  if (providerRows[0].count === 0) {
    await pool.query(
      `INSERT INTO payment_providers (id, name, code, environment, is_active) VALUES 
      (1, 'Mock QRIS', 'mock', 'sandbox', 1),
      (2, 'DANA QRIS (Placeholder)', 'dana', 'sandbox', 0),
      (3, 'Internal Office QRIS', 'internal_qris', 'sandbox', 1)`
    );
  }

  // Seed Internal Merchants if empty
  const [merchantRows]: any = await pool.query("SELECT COUNT(*) as count FROM internal_merchants");
  if (merchantRows[0].count === 0) {
    await pool.execute(
      'INSERT INTO internal_merchants (name, nmid, qris_image_path) VALUES (?, ?, ?)',
      ['Toko Default', 'ID102030405060708', '/qris-default.jpg']
    );
  }

  // Seed API Keys if empty
  const [apiKeyRows]: any = await pool.query("SELECT COUNT(*) as count FROM api_keys");
  if (apiKeyRows[0].count === 0) {
    const randomSecret = crypto.randomBytes(32).toString('hex');
    const plaintextKey = `adms_sk_test_${randomSecret}`;
    const keyHash = bcrypt.hashSync(plaintextKey, 10);
    const keyHint = `adms_sk_test_••••••••••••${randomSecret.slice(-4)}`;

    await pool.execute(
      `INSERT INTO api_keys (name, key_hash, permissions, key_hint) VALUES (?, ?, ?, ?)`,
      ['Default Internal Application', keyHash, '["payments:create", "payments:read"]', keyHint]
    );

    console.log('\n=============================================================');
    console.log('⚠ IMPORTANT: API KEY GENERATED ⚠');
    console.log('This key is only displayed ONCE and its hash is saved.');
    console.log(`API Key: ${plaintextKey}`);
    console.log('=============================================================\n');
  }

  // Seed Settings if empty
  const [settingRows]: any = await pool.query("SELECT COUNT(*) as count FROM settings");
  if (settingRows[0].count === 0) {
    const defaultSettings = [
      ['company_name', 'PT ADMS Solusi Digital'],
      ['company_email', 'contact@admsqris.local'],
      ['company_phone', '021-555-0199'],
      ['currency', 'IDR'],
      ['timezone', 'Asia/Jakarta'],
      ['mock_expiry_minutes', '15'],
      ['dana_client_id', ''],
      ['dana_client_secret', ''],
      ['dana_environment', 'sandbox']
    ];

    for (const [k, v] of defaultSettings) {
      await pool.execute(`INSERT OR IGNORE INTO settings (\`key\`, value) VALUES (?, ?)`, [k, v]);
    }
  }

  // Seed sample transactions if none exist
  const [txRows]: any = await pool.query("SELECT COUNT(*) as count FROM transactions");
  if (txRows[0].count === 0) {
    const now = new Date();
    const formattedNow = now.toISOString().replace('T', ' ').substring(0, 19);
    const expiredAt = new Date(now.getTime() + 15 * 60000).toISOString().replace('T', ' ').substring(0, 19);

    await pool.execute(`
      INSERT INTO transactions (invoice_number, customer_name, customer_phone, amount, description, status, expired_at, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, 'PAID', ?, 1, ?)
    `, ['INV-20260810-000001', 'Kantin Utama ADMS', '081234567890', 150000, 'Pembayaran Catering Meeting', expiredAt, formattedNow]);

    await pool.execute(`
      INSERT INTO transactions (invoice_number, customer_name, customer_phone, amount, description, status, expired_at, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 2, ?)
    `, ['INV-20260810-000002', 'Budi Santoso - Divisi IT', '081987654321', 75000, 'Pembelian Supplies Kantor', expiredAt, formattedNow]);

    // Create corresponding payment for transaction 1
    await pool.execute(`
      INSERT INTO payments (transaction_id, provider_id, provider_reference, qr_content, payment_method, status, paid_at)
      VALUES (1, 1, 'MOCK-REF-000001', '00020101021226670016COM.DANA.WWW0118936009110000000001021551234567890123452045812530336054061500005802ID5918ADMS QRIS INTERNAL6012JAKARTA SEL6304A1B2', 'QRIS', 'PAID', ?)
    `, [formattedNow]);

    // Create corresponding payment for transaction 2
    await pool.execute(`
      INSERT INTO payments (transaction_id, provider_id, provider_reference, qr_content, payment_method, status)
      VALUES (2, 1, 'MOCK-REF-000002', '00020101021226670016COM.DANA.WWW011893600911000000000102155123456789012345204581253033605403750005802ID5918ADMS QRIS INTERNAL6012JAKARTA SEL6304C3D4', 'QRIS', 'PENDING')
    `, []);
  }
}

export async function querySql<T>(sql: string, params: any[] = []): Promise<T[]> {
  const p = await getDb();
  const [rows] = await p.query(sql, params);
  return rows as T[];
}

export async function getSql<T>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await querySql<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function runSql(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  const p = await getDb();
  const [result]: any = await p.execute(sql, params);
  
  const lastInsertRowid = result.insertId || 0;
  const changes = result.affectedRows || 0;
  
  return { lastInsertRowid, changes };
}

export async function runTransaction(queries: { sql: string; params?: any[] }[]): Promise<void> {
  const p = await getDb();
  const connection = await p.getConnection();
  try {
    await connection.beginTransaction();
    for (const query of queries) {
      await connection.execute(query.sql, query.params || []);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
