const db = require('./db');

async function checkEmailTemplates() {
  try {
    const [rows] = await db.execute('SELECT slug, name, description FROM email_templates');
    console.log('Email templates in database:');
    rows.forEach(row => {
      console.log(`- ${row.slug}: ${row.name} - ${row.description}`);
    });
  } catch (error) {
    console.error('Error checking email templates:', error);
  } finally {
    process.exit(0);
  }
}

checkEmailTemplates();