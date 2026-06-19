require('dotenv').config();
const db = require('./db');

async function fixRoleColumn() {
  try {
    console.log('🔧 Fixing role column...');
    
    // Update the role column to include 'customer'
    await db.execute('ALTER TABLE users MODIFY COLUMN role enum("admin","staff","customer") DEFAULT "customer"');
    
    console.log('✅ Role column updated successfully!');
    console.log('   Available roles: admin, staff, customer');
    
    // Verify the change
    const [columns] = await db.execute('DESCRIBE users');
    const roleColumn = columns.find(col => col.Field === 'role');
    console.log(`   Role column type: ${roleColumn.Type}`);
    
  } catch (error) {
    console.error('❌ Error fixing role column:', error);
  }
  process.exit(0);
}

fixRoleColumn();