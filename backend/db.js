const mysql = require('mysql2');

// Create connection pool for efficient database operations
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'support_ticket_crm',
  port: process.env.DB_PORT || 3306,
  timezone: 'local'
});

module.exports = pool.promise();
