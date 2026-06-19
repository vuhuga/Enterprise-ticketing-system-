require('dotenv').config();
const db = require('./db');

async function fixTemplateVariables() {
  try {
    console.log('🔧 Fixing template variables JSON format...');
    
    // Get all templates and check their variables
    const [templates] = await db.execute('SELECT id, slug, variables FROM email_templates');
    
    for (const template of templates) {
      console.log(`\n📧 Checking ${template.slug}...`);
      
      if (template.variables) {
        try {
          // Try to parse existing JSON
          JSON.parse(template.variables);
          console.log(`✅ ${template.slug} variables are valid JSON`);
        } catch (error) {
          console.log(`❌ ${template.slug} has invalid JSON, fixing...`);
          
          // Fix common JSON issues
          let fixedVariables = template.variables;
          
          // Convert to string if it's not already
          if (typeof fixedVariables !== 'string') {
            fixedVariables = String(fixedVariables);
          }
          
          // If it's a simple comma-separated list, convert to JSON array
          if (!fixedVariables.startsWith('[') && !fixedVariables.startsWith('{')) {
            const vars = fixedVariables.split(',').map(v => v.trim().replace(/['"]/g, ''));
            fixedVariables = JSON.stringify(vars);
          }
          
          // Update the template
          await db.execute(
            'UPDATE email_templates SET variables = ? WHERE id = ?',
            [fixedVariables, template.id]
          );
          
          console.log(`✅ Fixed ${template.slug} variables: ${fixedVariables}`);
        }
      } else {
        console.log(`⚠️ ${template.slug} has no variables defined`);
      }
    }
    
    console.log('\n🎉 Template variables fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing template variables:', error);
    process.exit(1);
  }
}

fixTemplateVariables();