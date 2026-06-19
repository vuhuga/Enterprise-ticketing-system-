require('dotenv').config();
const db = require('./db');

async function fixEmailLogoSettings() {
  try {
    console.log('🔧 Fixing email logo settings...');
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const logoUrl = `${backendUrl}/public/logo.png`;
    
    // Insert/update email logo settings
    const emailSettings = [
      {
        key: 'email_logo_url',
        value: logoUrl,
        label: 'Email Logo URL',
        description: 'URL to the logo displayed in email templates',
        dataType: 'string',
        category: 'email'
      },
      {
        key: 'email_company_name',
        value: 'HelpDesk',
        label: 'Company Name',
        description: 'Company name displayed in email templates',
        dataType: 'string',
        category: 'email'
      },
      {
        key: 'email_company_tagline',
        value: 'Enterprise Ticketing System',
        label: 'Company Tagline',
        description: 'Company tagline displayed in email templates',
        dataType: 'string',
        category: 'email'
      },
      {
        key: 'email_footer_copyright',
        value: '© 2025 All rights reserved.',
        label: 'Footer Copyright',
        description: 'Copyright text displayed in email footer',
        dataType: 'string',
        category: 'email'
      }
    ];
    
    for (const setting of emailSettings) {
      await db.execute(`
        INSERT INTO system_settings (\`key\`, value, label, description, dataType, category, isEditable) 
        VALUES (?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE 
          value = VALUES(value),
          label = VALUES(label),
          description = VALUES(description),
          dataType = VALUES(dataType),
          category = VALUES(category),
          updatedAt = NOW()
      `, [setting.key, setting.value, setting.label, setting.description, setting.dataType, setting.category]);
      
      console.log(`✅ Setting '${setting.key}' = '${setting.value}'`);
    }
    
    // Verify settings
    console.log('\n📋 Verifying email settings:');
    const [settings] = await db.execute(
      'SELECT `key`, value FROM system_settings WHERE `key` IN (?, ?, ?, ?)',
      ['email_logo_url', 'email_company_name', 'email_company_tagline', 'email_footer_copyright']
    );
    
    settings.forEach(setting => {
      console.log(`   ${setting.key}: ${setting.value}`);
    });
    
    console.log('\n🎉 Email logo settings fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing email logo settings:', error);
    process.exit(1);
  }
}

fixEmailLogoSettings();