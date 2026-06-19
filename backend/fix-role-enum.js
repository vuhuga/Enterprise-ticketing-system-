require('dotenv').config();
const db = require('./db');

async function fixRoleEnum() {
  try {
    console.log('🔧 Fixing role ENUM to include customer...');
    
    // Update the role column to include 'customer'
    await db.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'staff', 'customer', 'user') DEFAULT 'customer'
    `);
    
    console.log('✅ Role ENUM updated successfully!');
    console.log('   Valid roles: admin, staff, customer, user');
    console.log('   Default role: customer');
    
    // Verify the change
    const [roleInfo] = await db.execute("SHOW COLUMNS FROM users WHERE Field = 'role'");
    if (roleInfo.length > 0) {
      console.log('\n📋 Updated role column details:');
      console.log('   Type:', roleInfo[0].Type);
      console.log('   Default:', roleInfo[0].Default);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing role ENUM:', error);
    process.exit(1);
  }
}

fixRoleEnum();