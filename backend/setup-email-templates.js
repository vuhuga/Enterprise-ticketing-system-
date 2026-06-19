const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setupEmailTemplates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Create email_templates table if it doesn't exist
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

    console.log('✓ email_templates table created/verified');

    // Define all required templates
    const templates = [
      {
        name: 'Ticket Status Updated',
        slug: 'ticket_status_updated',
        description: 'Sent to customers when ticket status changes',
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
                Your ticket status has been updated.
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
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">New Status:</strong> {status}
                    </p>
                    {public_note}
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{button_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      {button_text}
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
        variables: JSON.stringify(['name', 'uid', 'title', 'status', 'public_note', 'button_url', 'button_text', 'sender_name', 'logo_url'])
      },
      {
        name: 'Got assigned for a ticket',
        slug: 'assigned_ticket',
        description: 'Sent to staff when a ticket is assigned to them',
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
                A ticket has been assigned to you. Please review and respond promptly.
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
                      <strong style="color: #1e3a8a; font-weight: 600;">Priority:</strong> {priority}
                    </p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{button_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      {button_text}
                    </a>
                  </td>
                </tr>
              </table>
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
        variables: JSON.stringify(['name', 'uid', 'title', 'priority', 'button_url', 'button_text', 'sender_name', 'logo_url'])
      },
      {
        name: 'Create ticket by dashboard',
        slug: 'create_ticket_dashboard',
        description: 'Sent to customers when ticket is created from dashboard',
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
                Your support ticket has been created successfully.
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
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Status:</strong> {status}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Department:</strong> {department}
                    </p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{button_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      {button_text}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #000000;">
                Thank you for contacting us!
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
        variables: JSON.stringify(['name', 'uid', 'title', 'status', 'department', 'button_url', 'button_text', 'sender_name', 'logo_url'])
      }
    ];

    // Insert templates (replace if exists)
    for (const template of templates) {
      await connection.execute(`
        INSERT INTO email_templates (name, slug, description, content, variables) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          description = VALUES(description),
          content = VALUES(content),
          variables = VALUES(variables),
          updated_at = NOW()
      `, [template.name, template.slug, template.description, template.content, template.variables]);

      console.log(`✓ Template '${template.slug}' created/updated`);
    }

    console.log('\n✓ All email templates setup completed successfully!');
  } catch (error) {
    console.error('Error setting up email templates:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

setupEmailTemplates().catch(console.error);