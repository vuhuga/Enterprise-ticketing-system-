require('dotenv').config();
const db = require('./db');

async function checkLogoSettings() {
  try {
    console.log('🖼️ Checking logo settings...');
    
    // Check current logo settings
    const [settings] = await db.execute(
      'SELECT `key`, value FROM system_settings WHERE `key` LIKE "%logo%" OR `key` LIKE "%email%"'
    );
    
    console.log('\n📋 Current email/logo settings:');
    if (settings.length === 0) {
      console.log('   No email/logo settings found');
    } else {
      settings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value}`);
      });
    }
    
    // Check if logo file exists
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const logoUrl = `${backendUrl}/public/logo.png`;
    console.log(`\n🔗 Expected logo URL: ${logoUrl}`);
    
    // Check if public directory exists
    const fs = require('fs');
    const path = require('path');
    const publicDir = path.join(__dirname, '../public');
    const logoPath = path.join(publicDir, 'logo.png');
    
    console.log(`📁 Public directory: ${publicDir}`);
    console.log(`🖼️ Logo file path: ${logoPath}`);
    
    if (fs.existsSync(publicDir)) {
      console.log('✅ Public directory exists');
      
      if (fs.existsSync(logoPath)) {
        console.log('✅ Logo file exists');
      } else {
        console.log('❌ Logo file does not exist');
        
        // List files in public directory
        const files = fs.readdirSync(publicDir);
        console.log('📂 Files in public directory:', files);
      }
    } else {
      console.log('❌ Public directory does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking logo settings:', error);
    process.exit(1);
  }
}

checkLogoSettings();