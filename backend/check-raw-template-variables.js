require('dotenv').config();
const db = require('./db');

async function checkRawTemplateVariables() {
  try {
    console.log('📋 Checking raw template variables...');
    
    const [templates] = await db.execute('SELECT slug, variables FROM email_templates ORDER BY slug');
    
    templates.forEach(template => {
      console.log(`\n📧 ${template.slug}:`);
      console.log(`   Raw: ${JSON.stringify(template.variables)}`);
      console.log(`   Type: ${typeof template.variables}`);
      
      if (template.variables) {
        try {
          const parsed = JSON.parse(template.variables);
          console.log(`   Parsed: ${JSON.stringify(parsed)}`);
        } catch (error) {
          console.log(`   Parse Error: ${error.message}`);
        }
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking template variables:', error);
    process.exit(1);
  }
}

checkRawTemplateVariables();