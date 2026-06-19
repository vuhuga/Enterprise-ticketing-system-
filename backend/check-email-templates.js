require('dotenv').config();
const db = require('./db');

async function checkEmailTemplates() {
  try {
    console.log('📧 Checking email templates...');
    
    // Check if email_templates table exists
    try {
      const [tables] = await db.execute("SHOW TABLES LIKE 'email_templates'");
      if (tables.length === 0) {
        console.log('❌ email_templates table does not exist');
        return;
      }
      console.log('✅ email_templates table exists');
    } catch (error) {
      console.log('❌ Error checking table:', error.message);
      return;
    }
    
    // Get table structure
    const [structure] = await db.execute('DESCRIBE email_templates');
    console.log('\n📋 Table structure:');
    structure.forEach(row => {
      console.log(`   ${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Get all templates
    const [templates] = await db.execute('SELECT id, name, slug, description FROM email_templates ORDER BY name');
    
    console.log(`\n📧 Found ${templates.length} email templates:`);
    if (templates.length === 0) {
      console.log('   No templates found in database');
    } else {
      templates.forEach(template => {
        console.log(`   ${template.id}: ${template.name} (${template.slug})`);
        if (template.description) {
          console.log(`      Description: ${template.description}`);
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking email templates:', error);
    process.exit(1);
  }
}

checkEmailTemplates();