const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});

async function createEmailTemplatesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        content LONGTEXT NOT NULL,
        variables JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ email_templates table created successfully');

    // Check if table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM email_templates');

    if (rows[0].count === 0) {
      console.log('Inserting default email templates...');

      // Insert default templates
      const defaultTemplates = [{
        name: 'A new comment has been added on the ticket',
        slug: 'ticket_new_comment',
        description: 'When a comment has been added on a ticket.',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <img src="{logo_url}" alt="Logo" style="height: 25px; width: auto; max-width: 60px;">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000; line-height: 1.5;">
                Hi {name},
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #000000; line-height: 1.5;">
                A new comment has been added on the ticket.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Ticket number:</strong> {uid}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Comment:</strong> {comment}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.6;">
                You would be able view the ticket from the following link.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{ticket_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      View Ticket
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #000000;">
                Thank you!
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.5;">
                Best regards,<br>
                {sender_name}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                <strong style="color: #666666;">Suntra Investment</strong> - Relationship Portal
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 Suntra Investment. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'uid', 'comment', 'sender_name', 'ticket_url', 'logo_url'])
      },
      {
        name: 'Create ticket by new customer',
        slug: 'create_ticket_new_customer',
        description: 'When customer create a new ticket from the landing page',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <img src="{logo_url}" alt="Logo" style="height: 25px; width: auto; max-width: 60px;">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000; line-height: 1.5;">
                Hi {name},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #000000; line-height: 1.5;">
                Your ticket has been created successfully.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Ticket number:</strong> {uid}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Title:</strong> {title}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Status:</strong> {status}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.6;">
                Thank you for contacting us!
              </p>
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #000000;">
                Best regards,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.5;">
                {sender_name}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                <strong style="color: #666666;">Suntra Investment</strong> - Relationship Portal
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 Suntra Investment. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'uid', 'title', 'status', 'sender_name', 'logo_url'])
      }
      ];

      for (const template of defaultTemplates) {
        await connection.execute(
          'INSERT INTO email_templates (name, slug, description, content, variables) VALUES (?, ?, ?, ?, ?)',
          [template.name, template.slug, template.description, template.content, template.variables]
        );
      }

      console.log('✓ Default email templates inserted');
    }

    console.log('\n✓ Email templates setup completed successfully!');
  } catch (error) {
    console.error('Error creating email_templates table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createEmailTemplatesTable();
