const bcrypt = require('bcryptjs');
const db = require('./db');

async function fixAdminPassword() {
    try {
        console.log('🔧 Fixing admin password...');

        // Generate new hash for 'admin123'
        const hashedPassword = await bcrypt.hash('admin123', 10);
        console.log('✓ Generated new hash:', hashedPassword);

        // Update admin user
        await db.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@presidentsaward.ke']
        );
        console.log('✓ Admin password updated successfully');

        // Verify the update
        const [users] = await db.execute(
            'SELECT id, email, role FROM users WHERE email = ?',
            ['admin@presidentsaward.ke']
        );
        console.log('✓ Admin user verified:', users[0]);

        // Test the password
        const [testUsers] = await db.execute(
            'SELECT password FROM users WHERE email = ?',
            ['admin@presidentsaward.ke']
        );
        const isValid = await bcrypt.compare('admin123', testUsers[0].password);
        console.log('✓ Password test result:', isValid ? 'PASS ✓' : 'FAIL ✗');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixAdminPassword();
