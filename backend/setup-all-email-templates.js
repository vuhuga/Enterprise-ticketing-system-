require('dotenv').config();
const db = require('./db');

async function setupAllEmailTemplates() {
  try {
    console.log('📧 Setting up all email templates...');

    // Define all required templates
    const templates = [
      {
        name: 'Password Reset Link',
        slug: 'password_reset_link',
        description: 'Sent to users when they request a password reset',
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
                You requested a password reset for your account. Click the button below to reset your password.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{reset_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666; line-height: 1.5;">
                If you didn't request this password reset, please ignore this email. This link will expire in 1 hour.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.5;">
                Best regards,<br>
                Suntra Support Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                <strong style="color: #666666;">Suntra Investment</strong> - Relationship Portal
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'reset_url', 'logo_url'])
      },
      {
        name: 'Password Reset Confirmation',
        slug: 'password_reset_confirmation',
        description: 'Sent to users after successful password reset',
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
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{login_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      Login Now
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.5;">
                Best regards,<br>
                Suntra Support Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                <strong style="color: #666666;">Suntra Investment</strong> - Relationship Portal
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'login_url', 'logo_url'])
      },
      {
        name: 'Ticket Updated',
        slug: 'ticket_updated',
        description: 'Sent to customers when ticket status is updated',
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
                Your ticket has been updated.
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
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{ticket_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      View Ticket
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.5;">
                Best regards,<br>
                Suntra Support Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                <strong style="color: #666666;">Suntra Investment</strong> - Relationship Portal
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'uid', 'title', 'status', 'ticket_url', 'logo_url'])
      },
      {
        name: 'User Account Created',
        slug: 'user_created',
        description: 'Sent to new users when their account is created',
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
                Welcome to Suntra Investment! Your account has been created successfully.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Username:</strong> {username}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Email:</strong> {email}
                    </p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{login_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      Login to Your Account
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.5;">
                Best regards,<br>
                Suntra Support Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                <strong style="color: #666666;">Suntra Investment</strong> - Relationship Portal
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'username', 'email', 'login_url', 'logo_url'])
      },
      {
        name: 'Create ticket by new customer',
        slug: 'create_ticket_new_customer',
        description: 'Sent to new customers when they create their first ticket',
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
                Thank you for contacting us! Your support ticket has been created successfully.
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
                We will review your request and get back to you as soon as possible.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #000000; line-height: 1.5;">
                Best regards,<br>
                Suntra Support Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #999999;">
                <strong style="color: #666666;">Suntra Investment</strong> - Relationship Portal
              </p>
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'uid', 'title', 'status', 'logo_url'])
      },
      {
        name: 'New Comment Added to Ticket',
        slug: 'ticket_new_comment',
        description: 'Sent to customers when a new comment is added to their ticket',
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
                A new comment has been added to your ticket.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Ticket number:</strong> {ticket_id}
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #000000;">
                      <strong style="color: #1e3a8a; font-weight: 600;">Comment:</strong>
                    </p>
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; border-left: 3px solid #6366f1;">
                      <p style="margin: 0; font-size: 14px; color: #000000; line-height: 1.5;">
                        {comment}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #6366f1; border-radius: 6px; text-align: center;">
                    <a href="{ticket_url}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      View Ticket
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
                © 2026 All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: JSON.stringify(['name', 'ticket_id', 'comment', 'ticket_url', 'sender_name', 'logo_url'])
      }
    ];

    // Insert templates (replace if exists)
    for (const template of templates) {
      await db.execute(`
        INSERT INTO email_templates (name, slug, description, content, variables) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          description = VALUES(description),
          content = VALUES(content),
          variables = VALUES(variables),
          updated_at = NOW()
      `, [template.name, template.slug, template.description, template.content, template.variables]);

      console.log(`✅ Template '${template.slug}' created/updated`);
    }

    console.log('\n🎉 All email templates setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up email templates:', error);
    process.exit(1);
  }
}

setupAllEmailTemplates();