
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runBrokerageMigration() {
    let connection;
    try {
        console.log('🚀 Starting Brokerage Migration...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'support_ticket_crm',
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        const sql = `
      -- Insert new Brokerage-specific Departments
      INSERT IGNORE INTO departments (name, description, status) VALUES
      ('Brokerage Operations', 'Direct handling of share transactions and account maintenance', 'active'),
      ('Compliance', 'KYC verification and regulatory adherence monitoring', 'active'),
      ('Trading Desk', 'Execution of buy and sell orders on the NSE', 'active');

      -- Insert new Brokerage-specific Ticket Types
      INSERT IGNORE INTO ticket_types (name, description, category, priority_level, status) VALUES
      ('Account Opening', 'New CDSC account opening for individual or corporate clients', 'Onboarding', 'medium', 'active'),
      ('Order Placing', 'Buy or sell order execution on the Nairobi Securities Exchange', 'Trading', 'urgent', 'active'),
      ('Share Immobilization', 'Process of converting physical share certificates back to electronic form', 'Shares', 'medium', 'active'),
      ('Shares Transfer/Transmission', 'Transfer or transmission of shares after death or court order', 'Legal', 'high', 'active');
    `;

        await connection.query(sql);
        console.log('✅ Brokerage Departments and Ticket Types inserted successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 Database connection closed');
        }
    }
}

runBrokerageMigration();
