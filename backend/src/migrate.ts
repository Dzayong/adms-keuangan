import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigrations() {
  console.log('Running migrations...');
  const pool = await getDb();

  try {
    // Add profile_photo to users if not exists (MySQL syntax doesn't have IF NOT EXISTS for columns, catch error)
    await pool.query(`ALTER TABLE users ADD COLUMN profile_photo TEXT DEFAULT ''`);
    console.log('Added profile_photo to users table.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column profile_photo already exists.');
    } else {
      console.error('Error adding profile_photo:', err.message);
    }
  }

  try {
    // Create login_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        ip_address VARCHAR(255),
        user_agent TEXT,
        login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log('Created login_logs table.');
  } catch (err: any) {
    console.error('Error creating login_logs table:', err.message);
  }

  console.log('Migration completed.');
  process.exit(0);
}

runMigrations();
