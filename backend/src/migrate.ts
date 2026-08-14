import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/database.sqlite');

const db = new Database(dbPath);

console.log('Running migrations...');

try {
  // Add profile_photo to users
  db.prepare(`ALTER TABLE users ADD COLUMN profile_photo TEXT DEFAULT ''`).run();
  console.log('Added profile_photo to users table.');
} catch (err: any) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column profile_photo already exists.');
  } else {
    console.error('Error adding profile_photo:', err.message);
  }
}

try {
  // Create login_logs table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      login_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `).run();
  console.log('Created login_logs table.');
} catch (err: any) {
  console.error('Error creating login_logs table:', err.message);
}

console.log('Migration completed.');
db.close();
