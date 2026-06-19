const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedDatabase() {
    console.log('🚀 Starting database seeding from code...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        const dbName = process.env.DB_NAME || 'support_ticket_crm';

        // Drop and recreate database for a clean start
        console.log(`🗑️ Dropping database ${dbName} if it exists...`);
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        await connection.query(`CREATE DATABASE ${dbName}`);
        await connection.query(`USE ${dbName}`);
        console.log(`✅ Database ${dbName} created and selected.`);

        // Read SQL file
        const sqlPath = path.join(__dirname, '..', 'setup-database.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`SQL file not found at ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('📖 Reading setup-database.sql...');

        // Execute SQL
        // mysql2 supports multipleStatements: true, so we can run the whole file
        await connection.query(sql);
        console.log('✅ SQL commands executed successfully!');

        console.log('\n🌟 Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

seedDatabase();
