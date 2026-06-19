const db = require('../db');

// Retrieve SMTP configuration settings
const getSmtpSettings = async (req, res) => {
  try {
    console.log('📧 Getting SMTP settings');

    const [settings] = await db.execute(`
      SELECT \`key\`, value
      FROM system_settings
      WHERE \`key\` IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'mail_encryption', 'from_address', 'from_name')
    `);

    // Convert database rows to object format
    const smtpSettings = {
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      mailEncryption: 'tls',
      fromAddress: '',
      fromName: ''
    };

    settings.forEach(setting => {
      switch (setting.key) {
        case 'smtp_host':
          smtpSettings.smtpHost = setting.value;
          break;
        case 'smtp_port':
          smtpSettings.smtpPort = parseInt(setting.value) || 587;
          break;
        case 'smtp_username':
          smtpSettings.smtpUsername = setting.value;
          break;
        case 'smtp_password':
          smtpSettings.smtpPassword = setting.value;
          break;
        case 'mail_encryption':
          smtpSettings.mailEncryption = setting.value;
          break;
        case 'from_address':
          smtpSettings.fromAddress = setting.value;
          break;
        case 'from_name':
          smtpSettings.fromName = setting.value;
          break;
      }
    });

    res.json(smtpSettings);
  } catch (error) {
    console.error('❌ Error getting SMTP settings:', error);
    res.status(500).json({
      error: 'Failed to get SMTP settings',
      message: error.message
    });
  }
};

// Save SMTP configuration with validation
const saveSmtpSettings = async (req, res) => {
  try {
    console.log('📧 Saving SMTP settings');

    const {
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      mailEncryption,
      fromAddress,
      fromName
    } = req.body;

    // Validate all required fields
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !mailEncryption || !fromAddress || !fromName) {
      return res.status(400).json({
        error: 'All SMTP settings fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromAddress)) {
      return res.status(400).json({
        error: 'Invalid email format for From Address'
      });
    }

    // Validate port number range
    const port = parseInt(smtpPort);
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        error: 'Invalid port number. Must be between 1 and 65535'
      });
    }

    // Validate encryption options
    if (!['ssl', 'tls', 'none'].includes(mailEncryption)) {
      return res.status(400).json({
        error: 'Invalid encryption type. Must be ssl, tls, or none'
      });
    }

    // Settings to save with metadata
    const settingsToSave = [
      { key: 'smtp_host', value: smtpHost, label: 'SMTP Host', description: 'SMTP server hostname', category: 'email' },
      { key: 'smtp_port', value: port.toString(), label: 'SMTP Port', description: 'SMTP server port', category: 'email' },
      { key: 'smtp_username', value: smtpUsername, label: 'SMTP Username', description: 'SMTP authentication username', category: 'email' },
      { key: 'smtp_password', value: smtpPassword, label: 'SMTP Password', description: 'SMTP authentication password', category: 'email' },
      { key: 'mail_encryption', value: mailEncryption, label: 'Mail Encryption', description: 'Email encryption method', category: 'email' },
      { key: 'from_address', value: fromAddress, label: 'From Address', description: 'Default sender email address', category: 'email' },
      { key: 'from_name', value: fromName, label: 'From Name', description: 'Default sender name', category: 'email' }
    ];

    // Save settings with upsert logic
    for (const setting of settingsToSave) {
      await db.execute(`
        INSERT INTO system_settings (\`key\`, value, label, description, dataType, category, isEditable, isActive)
        VALUES (?, ?, ?, ?, 'string', ?, TRUE, TRUE)
        ON DUPLICATE KEY UPDATE
          value = VALUES(value),
          label = VALUES(label),
          description = VALUES(description),
          category = VALUES(category),
          updatedAt = CURRENT_TIMESTAMP
      `, [setting.key, setting.value, setting.label, setting.description, setting.category]);
    }

    console.log('✅ SMTP settings saved successfully');

    res.json({
      message: 'SMTP settings saved successfully',
      settings: {
        smtpHost,
        smtpPort: port,
        smtpUsername,
        smtpPassword: '***', // Don't return the actual password
        mailEncryption,
        fromAddress,
        fromName
      }
    });

  } catch (error) {
    console.error('❌ Error saving SMTP settings:', error);
    res.status(500).json({
      error: 'Failed to save SMTP settings',
      message: error.message
    });
  }
};

// Test SMTP connection and send verification email
const testSmtpConnection = async (req, res) => {
  try {
    console.log('📧 Testing SMTP connection');

    const {
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      mailEncryption,
      fromAddress,
      fromName
    } = req.body;

    // Validate all required fields for testing
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !mailEncryption || !fromAddress) {
      return res.status(400).json({
        error: 'All SMTP settings are required for testing'
      });
    }

    const nodemailer = require('nodemailer');

    // Create transporter with provided settings
    const testTransporter = nodemailer.createTransporter({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: mailEncryption === 'ssl', // true for 465, false for other ports
      auth: {
        user: smtpUsername,
        pass: smtpPassword
      },
      tls: {
        rejectUnauthorized: mailEncryption !== 'none'
      }
    });

    // Verify connection
    await testTransporter.verify();

    // Send test email
    const testEmail = {
      from: `"${fromName}" <${fromAddress}>`,
      to: fromAddress, // Send to the same address for testing
      subject: 'SMTP Configuration Test - Success',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">✅ SMTP Configuration Test Successful</h2>
          <p>Your SMTP settings are working correctly!</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>Configuration Details:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>SMTP Host:</strong> ${smtpHost}</li>
              <li><strong>SMTP Port:</strong> ${smtpPort}</li>
              <li><strong>Username:</strong> ${smtpUsername}</li>
              <li><strong>Encryption:</strong> ${mailEncryption.toUpperCase()}</li>
              <li><strong>From Address:</strong> ${fromAddress}</li>
              <li><strong>From Name:</strong> ${fromName}</li>
            </ul>
          </div>
          <p style="color: #6c757d; font-size: 14px;">
            This test email was sent automatically by your ticketing system to verify SMTP configuration.
          </p>
        </div>
      `
    };

    await testTransporter.sendMail(testEmail);

    console.log('✅ SMTP test email sent successfully');
    res.json({
      success: true,
      message: 'SMTP connection test successful! Test email sent.',
      details: {
        host: smtpHost,
        port: parseInt(smtpPort),
        encryption: mailEncryption,
        testEmailSent: true
      }
    });

  } catch (error) {
    console.error('❌ SMTP connection test failed:', error);

    let errorMessage = 'SMTP connection test failed';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your username and password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your host and port settings.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Socket error. Please check your network connection and firewall settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};

module.exports = {
  getSmtpSettings,
  saveSmtpSettings,
  testSmtpConnection
};