require('dotenv').config();
const db = require('./db');

async function checkUsersTable() {
  try {
    const [columns] = await db.execute('DESCRIBE users');
    console.log('Users table structure:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkUsersTable();