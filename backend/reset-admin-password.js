// Reset admin password script
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...');
    
    // Check if admin user exists
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', ['admin@presidentsaward.ke']);
    
    if (users.length === 0) {
      console.log('❌ Admin user not found. Creating new admin user...');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.execute(`
        INSERT INTO users (first_name, last_name, email, password, role, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, ['Admin', 'User', 'admin@presidentsaward.ke', hashedPassword, 'admin']);
      
      console.log('✅ Created new admin user:');
      console.log('   Email: admin@presidentsaward.ke');
      console.log('   Password: admin123');
      
    } else {
      console.log('✅ Admin user found. Updating password...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Update the password
      await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, 'admin@presidentsaward.ke']);
      
      console.log('✅ Admin password updated successfully!');
      console.log('   Email: admin@presidentsaward.ke');
      console.log('   Password: admin123');
      
      // Verify the password works
      const [updatedUsers] = await db.execute('SELECT * FROM users WHERE email = ?', ['admin@presidentsaward.ke']);
      const isValid = await bcrypt.compare('admin123', updatedUsers[0].password);
      
      if (isValid) {
        console.log('✅ Password verification successful!');
      } else {
        console.log('❌ Password verification failed!');
      }
    }
    
    // Also check for other admin users
    const [allAdmins] = await db.execute('SELECT id, first_name, last_name, email, role FROM users WHERE role = "admin"');
    console.log('\n📋 All admin users:');
    allAdmins.forEach(admin => {
      console.log(`   - ${admin.first_name} ${admin.last_name} (${admin.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  }
}

resetAdminPassword().then(() => process.exit(0));