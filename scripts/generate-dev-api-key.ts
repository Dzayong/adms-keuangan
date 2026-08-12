import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../backend/src/config/db';

async function generateDevApiKey() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Error: This script is for development only and cannot be run in production.');
    process.exit(1);
  }

  try {
    const db = await getDb();
    
    // Generate a cryptographically random key
    const randomSecret = crypto.randomBytes(32).toString('hex');
    const plaintextKey = `adms_sk_test_${randomSecret}`;
    const keyHash = bcrypt.hashSync(plaintextKey, 10);

    const keyHint = `adms_sk_test_••••••••••••${randomSecret.slice(-4)}`;

    // Use a specific Dev key record to avoid overwriting the Default Internal Application
    const check = db.exec("SELECT id FROM api_keys WHERE name = 'Development API Key'");
    const existingId = check[0]?.values[0]?.[0];

    if (existingId) {
      db.run("UPDATE api_keys SET key_hash = ?, key_hint = ? WHERE id = ?", [keyHash, keyHint, existingId]);
    } else {
      db.run(
        `INSERT INTO api_keys (name, key_hash, key_hint) VALUES (?, ?, ?)`,
        ['Development API Key', keyHash, keyHint]
      );
    }

    // Verify DB save succeeds before printing plaintext key
    saveDb();

    console.log('\n=============================================================');
    console.log('⚠ IMPORTANT: DEVELOPMENT API KEY GENERATED ⚠');
    console.log('This key is only displayed ONCE and its hash is saved.');
    console.log(`API Key: ${plaintextKey}`);
    console.log('=============================================================\n');
  } catch (error) {
    console.error('Failed to generate or save the development API key. The key was NOT generated or printed.', error);
    process.exit(1);
  }
}

generateDevApiKey().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
