require('dotenv').config();
const db = require('./db');

async function checkTemplateVariables() {
  try {
    console.log('📋 Checking template variables...');
    
    const [templates] = await db.execute('SELECT slug, variables FROM email_templates ORDER BY slug');
    
    templates.forEach(template => {
      console.log(`\n📧 ${template.slug}:`);
      if (template.variables) {
        const vars = JSON.parse(template.variables);
        vars.forEach(variable => {
          console.log(`   - {${variable}}`);
        });
      } else {
        console.log('   No variables defined');
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking template variables:', error);
    process.exit(1);
  }
}

checkTemplateVariables();