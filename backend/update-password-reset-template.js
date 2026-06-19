const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePasswordResetTemplate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    const [rows] = await connection.execute(
      'SELECT content FROM email_templates WHERE slug = ?',
      ['password_reset_link']
    );

    if (rows.length === 0) {
      console.log('No password_reset_link template found.');
      await connection.end();
      return;
    }

    let content = rows[0].content;
    // Replace only the reset link section
    content = content.replace(
      /<table[^>]*>\s*<tbody>\s*<tr>\s*<td>\s*<a href=\"\{reset_url\}\">([\s\S]*?)<\/a>\s*<\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>/,
      `<table cellpadding="0" cellspacing="0" style="margin: 20px 0; width: 100%;"><tr><td align="center"><a href="{reset_url}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 20px; border-radius: 6px; font-weight: 600; font-size: 16px; text-decoration: none; text-align: center; min-width: 180px; box-sizing: border-box; margin: 0 auto;">Reset Password</a></td></tr></table>`
    );

    await connection.execute(
      'UPDATE email_templates SET content = ? WHERE slug = ?',
      [content, 'password_reset_link']
    );

    console.log('✅ Password reset link template updated successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updatePasswordResetTemplate();
