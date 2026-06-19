require('dotenv').config();
const db = require('./db');

async function fixUserRoles() {
  try {
    console.log('🔧 Fixing user roles...');
    
    // First, update all 'user' roles to 'customer'
    const [result] = await db.execute('UPDATE users SET role = "customer" WHERE role = "user"');
    console.log(`✅ Updated ${result.affectedRows} users from 'user' to 'customer'`);
    
    // Now update the column definition
    await db.execute('ALTER TABLE users MODIFY COLUMN role enum("admin","staff","customer") DEFAULT "customer"');
    console.log('✅ Role column updated successfully!');
    
    // Verify the changes
    const [roles] = await db.execute('SELECT DISTINCT role FROM users');
    console.log('Current roles in database:');
    roles.forEach(r => console.log(`- ${r.role}`));
    
    // Show all users
    const [users] = await db.execute('SELECT id, first_name, last_name, email, role FROM users');
    console.log('\n📋 All users:');
    users.forEach(user => {
      console.log(`   ${user.id}: ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
  }
  process.exit(0);
}

fixUserRoles();