require('dotenv').config();
const db = require('./db');

async function checkSystemSettingsTable() {
  try {
    console.log('📋 Checking system_settings table structure...');
    
    const [structure] = await db.execute('DESCRIBE system_settings');
    console.log('Table structure:');
    structure.forEach(row => {
      console.log(`   ${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}) Default: ${row.Default}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking table:', error);
    process.exit(1);
  }
}

checkSystemSettingsTable();