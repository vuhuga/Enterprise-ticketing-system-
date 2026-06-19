const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTicketNotesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ticketing_system'
  });

  try {
    console.log(' Creating ticket_notes table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ticket_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id INT NOT NULL,
        note TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_ticket_id (ticket_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      )
    `);

    console.log(' ticket_notes table created successfully!');

  } catch (error) {
    console.error(' Error creating table:', error);
  } finally {
    await connection.end();
  }
}

createTicketNotesTable();
