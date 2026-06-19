require('dotenv').config();
const db = require('./db');

async function addColumn() {
  try {
    await db.execute('ALTER TABLE tickets ADD COLUMN `assigned_at` timestamp NULL DEFAULT NULL COMMENT "When ticket was assigned to staff"');
    console.log('✅ Added assigned_at column');
  } catch (error) {
    console.log('Column might already exist:', error.message);
  }
  process.exit(0);
}

addColumn();