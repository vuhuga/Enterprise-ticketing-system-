const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runSqlMigration() {
  let connection;
  
  try {
    console.log(' Starting SQL migration...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'support_ticket_crm'
    });

    console.log('� Connected to database');

    // Step 1: Update users table to support customer role
    console.log(' Step 1: Updating users table role enum...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('admin', 'staff', 'customer') DEFAULT 'customer'
      `);
      console.log('    Users table updated');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('customer')) {
        console.log('    Users table already has customer role');
      } else {
        throw error;
      }
    }

    // Step 2: Add user_id column to customers table
    console.log(' Step 2: Adding user_id to customers table...');
    try {
      await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN user_id INT UNIQUE
      `);
      console.log('    Added user_id column to customers');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('    user_id column already exists in customers table');
      } else {
        throw error;
      }
    }

    // Step 3: Add user_id column to contacts table
    console.log(' Step 3: Adding user_id to contacts table...');
    try {
      await connection.execute(`
        ALTER TABLE contacts 
        ADD COLUMN user_id INT UNIQUE
      `);
      console.log('    Added user_id column to contacts');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('    user_id column already exists in contacts table');
      } else {
        throw error;
      }
    }

    // Step 4: Create user accounts for existing customers
    console.log(' Step 4: Creating user accounts for customers...');
    const [customers] = await connection.execute('SELECT * FROM customers');
    console.log(`   Found ${customers.length} customers`);

    const customerPassword = await bcrypt.hash('customer123', 10);

    for (const customer of customers) {
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [customer.email]
      );

      let userId;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        // Update existing user to customer role
        await connection.execute(
          'UPDATE users SET role = ? WHERE id = ?',
          ['customer', userId]
        );
        console.log(`    Updated existing user: ${customer.email}`);
      } else {
        // Create new user account
        const [result] = await connection.execute(`
          INSERT INTO users (first_name, last_name, email, password, role, phone, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'customer', ?, NOW(), NOW())
        `, [customer.first_name, customer.last_name, customer.email, customerPassword, customer.phone]);
        
        userId = result.insertId;
        console.log(`    Created user account: ${customer.email} (password: customer123)`);
      }

      // Link customer to user
      await connection.execute(
        'UPDATE customers SET user_id = ? WHERE id = ?',
        [userId, customer.id]
      );
    }

    // Step 5: Create user accounts for existing contacts
    console.log(' Step 5: Creating user accounts for contacts...');
    const [contacts] = await connection.execute('SELECT * FROM contacts');
    console.log(`   Found ${contacts.length} contacts`);

    const staffPassword = await bcrypt.hash('staff123', 10);

    for (const contact of contacts) {
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [contact.email]
      );

      let userId;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        // Update existing user to staff role
        await connection.execute(
          'UPDATE users SET role = ? WHERE id = ?',
          ['staff', userId]
        );
        console.log(`    Updated existing user: ${contact.email}`);
      } else {
        // Create new user account
        const [result] = await connection.execute(`
          INSERT INTO users (first_name, last_name, email, password, role, phone, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'staff', ?, NOW(), NOW())
        `, [contact.first_name, contact.last_name, contact.email, staffPassword, contact.phone]);
        
        userId = result.insertId;
        console.log(`    Created user account: ${contact.email} (password: staff123)`);
      }

      // Link contact to user
      await connection.execute(
        'UPDATE contacts SET user_id = ? WHERE id = ?',
        [userId, contact.id]
      );
    }

    // Step 6: Ensure admin user exists
    console.log(' Step 6: Setting up admin user...');
    await connection.execute(
      "UPDATE users SET role = 'admin' WHERE email = 'admin@presidentsaward.ke'"
    );

    // Step 7: Show results
    console.log('� Final Results:');
    const [users] = await connection.execute(
      'SELECT id, first_name, last_name, email, role FROM users ORDER BY role, id'
    );
    
    console.log('Users by role:');
    users.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.first_name} ${user.last_name} (${user.email})`);
    });

    console.log(' Migration completed successfully!');
    console.log('');
    console.log('� Login Credentials:');
    console.log('   � Admin: admin@presidentsaward.ke / admin123');
    console.log('   � Staff: Use any contact email / staff123');
    console.log('   � Customer: Use any customer email / customer123');

  } catch (error) {
    console.error(' Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('� Database connection closed');
    }
  }
}

runSqlMigration();