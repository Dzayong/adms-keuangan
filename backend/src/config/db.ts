import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let dbInstance: Database | null = null;
const dbDir = path.join(process.cwd(), 'database');
const dbPath = path.join(dbDir, 'adms_qris.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  await initSchemaAndSeed(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

async function initSchemaAndSeed(db: Database) {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'OPERATOR',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT DEFAULT '',
      amount REAL NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      expired_at TEXT NOT NULL,
      paid_at TEXT,
      idempotency_key TEXT UNIQUE,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      environment TEXT NOT NULL DEFAULT 'sandbox',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      provider_reference TEXT NOT NULL,
      qr_content TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'QRIS',
      status TEXT NOT NULL DEFAULT 'PENDING',
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
    );

    CREATE TABLE IF NOT EXISTS payment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      reference TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Seed Users if empty
  const userCheck = db.exec("SELECT COUNT(*) as count FROM users");
  const count = userCheck[0]?.values[0]?.[0] || 0;

  if (count === 0) {
    const adminPassHash = bcrypt.hashSync('Admin123!', 10);
    const opPassHash = bcrypt.hashSync('Operator123!', 10);

    db.run(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'ADMIN', 1)`,
      ['System Administrator', 'admin@admsqris.local', adminPassHash]
    );
    db.run(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'OPERATOR', 1)`,
      ['Operations Staff', 'operator@admsqris.local', opPassHash]
    );
  }

  // Seed Providers if empty
  const providerCheck = db.exec("SELECT COUNT(*) as count FROM payment_providers");
  const providerCount = providerCheck[0]?.values[0]?.[0] || 0;

  if (providerCount === 0) {
    db.run(
      `INSERT INTO payment_providers (id, name, code, environment, is_active) VALUES (1, 'Mock QRIS', 'mock', 'sandbox', 1)`
    );
    db.run(
      `INSERT INTO payment_providers (id, name, code, environment, is_active) VALUES (2, 'DANA QRIS (Placeholder)', 'dana', 'sandbox', 0)`
    );
  }

  // Seed Settings if empty
  const settingCheck = db.exec("SELECT COUNT(*) as count FROM settings");
  const settingCount = settingCheck[0]?.values[0]?.[0] || 0;

  if (settingCount === 0) {
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
      db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [k, v]);
    }
  }

  // Seed sample transactions if none exist
  const txCheck = db.exec("SELECT COUNT(*) as count FROM transactions");
  const txCount = txCheck[0]?.values[0]?.[0] || 0;

  if (txCount === 0) {
    const now = new Date();
    const formattedNow = now.toISOString().replace('T', ' ').substring(0, 19);
    const expiredAt = new Date(now.getTime() + 15 * 60000).toISOString().replace('T', ' ').substring(0, 19);

    db.run(`
      INSERT INTO transactions (invoice_number, customer_name, customer_phone, amount, description, status, expired_at, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, 'PAID', ?, 1, ?)
    `, ['INV-20260810-000001', 'Kantin Utama ADMS', '081234567890', 150000, 'Pembayaran Catering Meeting', expiredAt, formattedNow]);

    db.run(`
      INSERT INTO transactions (invoice_number, customer_name, customer_phone, amount, description, status, expired_at, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 2, ?)
    `, ['INV-20260810-000002', 'Budi Santoso - Divisi IT', '081987654321', 75000, 'Pembelian Supplies Kantor', expiredAt, formattedNow]);

    // Create corresponding payment for transaction 1
    db.run(`
      INSERT INTO payments (transaction_id, provider_id, provider_reference, qr_content, payment_method, status, paid_at)
      VALUES (1, 1, 'MOCK-REF-000001', '00020101021226670016COM.DANA.WWW0118936009110000000001021551234567890123452045812530336054061500005802ID5918ADMS QRIS INTERNAL6012JAKARTA SEL6304A1B2', 'QRIS', 'PAID', ?)
    `, [formattedNow]);

    // Create corresponding payment for transaction 2
    db.run(`
      INSERT INTO payments (transaction_id, provider_id, provider_reference, qr_content, payment_method, status)
      VALUES (2, 1, 'MOCK-REF-000002', '00020101021226670016COM.DANA.WWW011893600911000000000102155123456789012345204581253033605403750005802ID5918ADMS QRIS INTERNAL6012JAKARTA SEL6304C3D4', 'QRIS', 'PENDING')
    `, []);
  }
}

export async function querySql<T>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export async function getSql<T>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await querySql<T>(sql, params);
  return rows[0] || null;
}

export async function runSql(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  const db = await getDb();
  db.run(sql, params);
  
  const idResult = db.exec("SELECT last_insert_rowid() as id");
  const lastInsertRowid = (idResult[0]?.values[0]?.[0] as number) || 0;
  
  const changesResult = db.exec("SELECT changes() as cnt");
  const changes = (changesResult[0]?.values[0]?.[0] as number) || 0;
  
  saveDb();
  return { lastInsertRowid, changes };
}

export async function runTransaction(queries: { sql: string; params?: any[] }[]): Promise<void> {
  const db = await getDb();
  try {
    db.exec('BEGIN TRANSACTION');
    for (const query of queries) {
      db.run(query.sql, query.params || []);
    }
    db.exec('COMMIT');
    saveDb();
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
