require('dotenv').config();
const db = require('./db');

async function checkTableStructure() {
  try {
    console.log('Checking users table structure...');
    
    const [rows] = await db.execute('DESCRIBE users');
    console.log('Users table structure:');
    rows.forEach(row => {
      console.log(`${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}) Default: ${row.Default}`);
    });
    
    // Check current role values
    const [roleInfo] = await db.execute("SHOW COLUMNS FROM users WHERE Field = 'role'");
    if (roleInfo.length > 0) {
      console.log('\nRole column details:');
      console.log('Type:', roleInfo[0].Type);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTableStructure();