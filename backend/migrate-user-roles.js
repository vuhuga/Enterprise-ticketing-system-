/**
 * User Role Migration Script
 * 
 * This script properly maps users to customers and contacts tables
 * and sets up the correct role-based access control.
 * 
 * Customers -> role: 'customer' (limited access)
 * Contacts -> role: 'staff' or 'admin' (full access)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateUserRoles() {
  let connection;
  
  try {
    console.log(' Starting user role migration...');
    
    // Create database connection
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'support_ticket_crm'
    };
    
    console.log('� Connecting to database:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('� Connected to database successfully');

    // Step 1: Update users table to support customer role
    console.log(' Updating users table role enum...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'staff', 'customer') DEFAULT 'customer'
    `);

    // Step 2: Add user_id columns to customers and contacts tables if they don't exist
    console.log(' Adding user_id columns to customers and contacts tables...');
    
    try {
      await connection.execute(`
        ALTER TABLE customers 
        ADD COLUMN user_id INT UNIQUE,
        ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('   - user_id column already exists in customers table');
    }

    try {
      await connection.execute(`
        ALTER TABLE contacts 
        ADD COLUMN user_id INT UNIQUE,
        ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('   - user_id column already exists in contacts table');
    }

    // Step 3: Create user accounts for existing customers (if they don't have accounts)
    console.log('� Creating user accounts for customers...');
    const [customers] = await connection.execute(`
      SELECT * FROM customers 
      WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM users)
    `);

    for (const customer of customers) {
      // Check if user already exists with this email
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
      } else {
        // Create new user account for customer
        const bcrypt = require('bcryptjs');
        const defaultPassword = await bcrypt.hash('customer123', 10); // Default password
        
        const [result] = await connection.execute(`
          INSERT INTO users (first_name, last_name, email, password, role, phone, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'customer', ?, NOW(), NOW())
        `, [customer.first_name, customer.last_name, customer.email, defaultPassword, customer.phone]);
        
        userId = result.insertId;
        console.log(`    Created user account for customer: ${customer.email} (password: customer123)`);
      }

      // Link customer to user
      await connection.execute(
        'UPDATE customers SET user_id = ? WHERE id = ?',
        [userId, customer.id]
      );
    }

    // Step 4: Create user accounts for existing contacts (if they don't have accounts)
    console.log('� Creating user accounts for contacts...');
    const [contacts] = await connection.execute(`
      SELECT * FROM contacts 
      WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM users)
    `);

    for (const contact of contacts) {
      // Check if user already exists with this email
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [contact.email]
      );

      let userId;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        // Update existing user to staff role (contacts are staff by default)
        await connection.execute(
          'UPDATE users SET role = ? WHERE id = ?',
          ['staff', userId]
        );
      } else {
        // Create new user account for contact
        const bcrypt = require('bcryptjs');
        const defaultPassword = await bcrypt.hash('staff123', 10); // Default password
        
        const [result] = await connection.execute(`
          INSERT INTO users (first_name, last_name, email, password, role, phone, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'staff', ?, NOW(), NOW())
        `, [contact.first_name, contact.last_name, contact.email, defaultPassword, contact.phone]);
        
        userId = result.insertId;
        console.log(`    Created user account for contact: ${contact.email} (password: staff123)`);
      }

      // Link contact to user
      await connection.execute(
        'UPDATE contacts SET user_id = ? WHERE id = ?',
        [userId, contact.id]
      );
    }

    // Step 5: Update existing admin user if needed
    console.log('� Ensuring admin user exists...');
    const [adminUsers] = await connection.execute(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminUsers.length === 0) {
      // Update the first user to admin if no admin exists
      await connection.execute(
        "UPDATE users SET role = 'admin' WHERE id = 1"
      );
      console.log('    Set first user as admin');
    }

    console.log(' Migration completed successfully!');
    console.log('');
    console.log('� Summary:');
    console.log('   - Customers have role "customer" with limited access');
    console.log('   - Contacts have role "staff" with full access');
    console.log('   - Default passwords: customer123 for customers, staff123 for contacts');
    console.log('   - Users should change their passwords after first login');

  } catch (error) {
    console.error(' Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('� Database connection closed');
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserRoles()
    .then(() => {
      console.log('� Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('� Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserRoles };