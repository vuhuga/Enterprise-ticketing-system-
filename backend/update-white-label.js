
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateWhiteLabel() {
    let connection;
    try {
        console.log('🚀 Updating White-Label Branding...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'support_ticket_crm',
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        const sql = `
      -- Update System Name
      UPDATE system_settings SET value = 'Suntra Investment Bank' WHERE \`key\` = 'system_name';
      
      -- Update Email Branding
      INSERT INTO system_settings (\`key\`, value, label, description, dataType, category) 
      VALUES ('email_company_name', 'Suntra Investment Bank', 'Email Company Name', 'Company name for email communication', 'string', 'email')
      ON DUPLICATE KEY UPDATE value = 'Suntra Investment Bank';

      INSERT INTO system_settings (\`key\`, value, label, description, dataType, category) 
      VALUES ('email_company_tagline', 'Making A Positive Change To Your Investments', 'Email Company Tagline', 'Tagline for email communication', 'string', 'email')
      ON DUPLICATE KEY UPDATE value = 'Making A Positive Change To Your Investments';

      INSERT INTO system_settings (\`key\`, value, label, description, dataType, category) 
      VALUES ('email_footer_copyright', '© 2026 Suntra Investment Bank. Powered by Optimum ERP Systems', 'Email Footer Copyright', 'Copyright text for email footer', 'string', 'email')
      ON DUPLICATE KEY UPDATE value = '© 2026 Suntra Investment Bank. Powered by Optimum ERP Systems';

      -- Add System Provider
      INSERT INTO system_settings (\`key\`, value, label, description, dataType, category) 
      VALUES ('system_provider', 'Optimum ERP Systems', 'System Provider', 'Name of the software provider', 'string', 'ui')
      ON DUPLICATE KEY UPDATE value = 'Optimum ERP Systems';
    `;

        await connection.query(sql);
        console.log('✅ Branding settings updated successfully');

    } catch (error) {
        console.error('❌ Update failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 Database connection closed');
        }
    }
}

updateWhiteLabel();
