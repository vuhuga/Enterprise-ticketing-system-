// Main Express server setup and configuration
console.log(' Initializing Enterprise Ticketing System...');

require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
// Configure file upload with memory storage and size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('./db');

// Import all API controllers
const authController = require('./controllers/authController');
const roleController = require('./controllers/roleController');
const departmentController = require('./controllers/departmentController');
const ticketTypeController = require('./controllers/ticketTypeController');
const userController = require('./controllers/userController');
const priorityController = require('./controllers/priorityController');
const statusController = require('./controllers/statusController');
const systemSettingsController = require('./controllers/systemSettingsController');
const smtpSettingsController = require('./controllers/smtpSettingsController');

const app = express();
const PORT = 3000;

// Configure CORS for frontend communication
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200'
];

app.use(cors({
  origin: '*',
  credentials: true
}));

// Parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(` ${req.method} ${req.url} - ${new Date().toISOString()}`);
  if (req.method === 'POST' && req.url.includes('/contacts')) {
    console.log(' Contact POST request body:', req.body);
  }
  next();
});

// Email service setup
let transporter = null;

async function createEmailTransporter() {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_PASSWORD !== 'placeholder_password_replace_with_real_app_password') {
      const config = {
        host: host || 'smtp.gmail.com',
        port: port,
        secure: secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      };

      // Gmail special handling if no host is provided
      if (!host) {
        config.service = 'gmail';
      } else {
        // For cPanel/custom SMTP, often useful to allow self-signed certs
        config.tls = {
          rejectUnauthorized: false
        };
      }

      transporter = nodemailer.createTransport(config);

      console.log(` Email transporter created successfully (${host || 'Gmail'})`);

      // Verify connection
      transporter.verify(function (error, success) {
        if (error) {
          console.log(' SMTP Verification Error:', error.message);
        } else {
          console.log(' SMTP Server is ready to take messages');
        }
      });

      return transporter;
    }

    console.log(' Email credentials not fully configured');
    return null;
  } catch (error) {
    console.log(' Email setup error:', error.message);
    return null;
  }
}

// Initialize email transporter
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  if (process.env.EMAIL_PASSWORD === 'placeholder_password_replace_with_real_app_password') {
    console.log(' Replace EMAIL_PASSWORD in .env with your credentials to enable email notifications');
  } else {
    console.log(' Initializing Email Service...');
    createEmailTransporter();
  }
} else {
  console.log(' EMAIL_USER or EMAIL_PASSWORD not configured. Email notifications disabled.');
}

// Email template generator
function createEmailTemplate(options) {
  const {
    title,
    greeting,
    message,
    buttonText,
    buttonUrl,
    additionalInfo,
    footerText
  } = options;

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const logoUrl = `${backendUrl}/public/logo.png`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Suntra Investment Notification'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

          <!-- Logo Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <img src="${logoUrl}" alt="Suntra Investment Logo" style="height: 60px; width: auto; max-width: 180px;">
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              ${greeting ? `<p style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">
                ${greeting}
              </p>` : ''}              <div style="margin: 0 0 30px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                ${message}
              </div>
              
              ${additionalInfo ? `<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #667eea;">
                <tr>
                  <td style="padding: 20px;">
                    ${additionalInfo}
                  </td>
                </tr>
              </table>` : ''}
              
              ${buttonText && buttonUrl ? `<table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
                    <a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>` : ''}
              
              <p style="margin: 30px 0 10px 0; font-size: 14px; color: #666666;">
                Best regards,<br>
                <strong style="color: #333333;">Suntra Support Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #666666;">
                ${footerText || 'This is an automated message from the Suntra Investment Portal.'}
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                <strong style="color: #667eea;">Suntra Investment</strong> - Relationship Portal<br>
                © ${new Date().getFullYear()} All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Render Email Template from Database
 * Fetches template by slug and replaces variables with actual data
 */
async function renderEmailTemplate(slug, variables = {}) {
  try {
    console.log(` Rendering email template: ${slug}`);

    // Fetch template from database
    const [templates] = await db.execute(
      'SELECT content FROM email_templates WHERE slug = ?',
      [slug]
    );

    if (templates.length === 0) {
      console.error(` Email template not found: ${slug}`);
      return null;
    }

    let htmlContent = templates[0].content;
    console.log(`✓ Template found, length: ${htmlContent.length} characters`);

    // Fetch shared settings from system_settings
    const [settings] = await db.execute(
      'SELECT `key`, value FROM system_settings WHERE `key` IN (?, ?, ?, ?)',
      ['email_logo_url', 'email_company_name', 'email_company_tagline', 'email_footer_copyright']
    );

    settings.forEach(setting => {
      if (setting.key === 'email_logo_url') variables.logo_url = setting.value;
      if (setting.key === 'email_company_name') variables.company_name = setting.value;
      if (setting.key === 'email_company_tagline') variables.company_tagline = setting.value;
      if (setting.key === 'email_footer_copyright') variables.footer_copyright = setting.value;
    });

    // Replace all variables in the template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      htmlContent = htmlContent.replace(regex, variables[key] || '');
    });

    console.log(`✓ Template rendered successfully with ${Object.keys(variables).length} variables`);
    return htmlContent;
  } catch (error) {
    console.error(' Error rendering email template:', error);
    return null;
  }
}


// Initialize database connection
async function initDatabase() {
  try {
    console.log('Connecting to database...');
    // Test the connection
    await db.execute('SELECT 1');
    console.log('Connected to MySQL database');

    // Create tables if they don't exist
    await createTables();

    // Enforce manual assignment by default unless explicitly enabled
    try {
      await db.execute(
        "INSERT INTO system_settings(`key`, value, label, description, dataType, category) VALUES ('auto_assign_tickets','false','Auto Assign Tickets','Automatically assign tickets to available agents','boolean','system') ON DUPLICATE KEY UPDATE value='false'"
      );
      console.log('⚙️  auto_assign_tickets=false enforced');
    } catch (enforceErr) {
      console.error('Failed to enforce auto_assign_tickets=false:', enforceErr.message);
    }

  } catch (error) {
    console.error(' Database connection failed:', error.message);
    process.exit(1);
  }
}

// Create necessary tables
async function createTables() {
  try {
    // Check if department_id column exists, if not add it
    try {
      await db.execute('ALTER TABLE users ADD COLUMN department_id INT NULL');
      console.log(' Added department_id column to users table');
    } catch (alterError) {
      // Column probably already exists, ignore the error
      if (!alterError.message.includes('Duplicate column name')) {
        console.log(' department_id column may already exist:', alterError.message);
      }
    }

    // Check if is_active column exists, if not add it
    try {
      await db.execute('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
      console.log(' Added is_active column to users table');
    } catch (alterError) {
      // Column probably already exists, ignore the error
      if (!alterError.message.includes('Duplicate column name')) {
        console.log(' is_active column may already exist:', alterError.message);
      }
    }

    // Add foreign key constraint if it doesn't exist
    try {
      await db.execute('ALTER TABLE users ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL');
      console.log(' Added foreign key constraint for department_id');
    } catch (fkError) {
      // Constraint probably already exists, ignore the error
      if (!fkError.message.includes('Duplicate foreign key constraint')) {
        console.log(' Foreign key constraint may already exist:', fkError.message);
      }
    }

    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff', 'customer') DEFAULT 'customer',
        department_id INT NULL,
        phone VARCHAR(20),
        city VARCHAR(50),
        country VARCHAR(50),
        address TEXT,
        photo VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    // Tickets table - Using VARCHAR for type and department to support dynamic values from database
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'new',
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Ensure assigned_to column exists in tickets table (migration)
    try {
      await db.execute(`
        ALTER TABLE tickets 
        ADD COLUMN IF NOT EXISTS assigned_to INT,
        ADD CONSTRAINT IF NOT EXISTS fk_tickets_assigned_to 
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log(' Verified tickets.assigned_to column exists');
    } catch (alterError) {
      // Column might already exist, check if it exists
      try {
        const [columns] = await db.execute(`SHOW COLUMNS FROM tickets LIKE 'assigned_to'`);
        if (columns.length === 0) {
          await db.execute(`ALTER TABLE tickets ADD COLUMN assigned_to INT`);
          await db.execute(`ALTER TABLE tickets ADD CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL`);
          console.log(' Added assigned_to column to tickets table');
        } else {
          console.log(' assigned_to column already exists');
        }
      } catch (checkError) {
        console.error(' Could not verify/add assigned_to column:', checkError.message);
      }
    }

    // Add resolution_comment column for storing detailed resolution notes
    try {
      const [resolutionColumns] = await db.execute(`SHOW COLUMNS FROM tickets LIKE 'resolution_comment'`);
      if (resolutionColumns.length === 0) {
        await db.execute(`ALTER TABLE tickets ADD COLUMN resolution_comment TEXT`);
        console.log(' Added resolution_comment column to tickets table');
      } else {
        console.log(' resolution_comment column already exists');
      }
    } catch (resolutionError) {
      console.error(' Could not add resolution_comment column:', resolutionError.message);
    }

    // Migrate type column from ENUM to VARCHAR to support dynamic ticket types
    try {
      const [typeColumns] = await db.execute(`SHOW COLUMNS FROM tickets WHERE Field = 'type'`);
      if (typeColumns.length > 0 && typeColumns[0].Type.includes('enum')) {
        await db.execute(`ALTER TABLE tickets MODIFY COLUMN type VARCHAR(100) NOT NULL`);
        console.log(' Migrated tickets.type column from ENUM to VARCHAR for dynamic ticket types');
      } else {
        console.log(' tickets.type column is already VARCHAR or migration not needed');
      }
    } catch (typeError) {
      console.error(' Could not migrate type column:', typeError.message);
    }

    // Migrate department column from ENUM to VARCHAR to support dynamic departments
    try {
      const [deptColumns] = await db.execute(`SHOW COLUMNS FROM tickets WHERE Field = 'department'`);
      if (deptColumns.length > 0 && deptColumns[0].Type.includes('enum')) {
        await db.execute(`ALTER TABLE tickets MODIFY COLUMN department VARCHAR(100) NOT NULL`);
        console.log(' Migrated tickets.department column from ENUM to VARCHAR for dynamic departments');
      } else {
        console.log(' tickets.department column is already VARCHAR or migration not needed');
      }
    } catch (deptError) {
      console.error(' Could not migrate department column:', deptError.message);
    }

    // Customers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(100),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Organizations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(100),
        website VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Contacts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        job_title VARCHAR(100),
        department VARCHAR(100),
        organization_id INT,
        city VARCHAR(50),
        country VARCHAR(50),
        address TEXT,
        notes TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        preferred_contact_method ENUM('Email', 'Phone', 'SMS') DEFAULT 'Email',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
      )
    `);

    // Notes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Password reset tokens table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Roles table (for user role management)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Departments table (for ticket categorization)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        manager_id INT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Ticket Types table (for ticket classification)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ticket_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(50),
        priority_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Priorities table (for ticket priority levels)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS priorities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(50) NOT NULL UNIQUE,
        label VARCHAR(100) NOT NULL,
        color VARCHAR(7), -- Hex color code
        sortOrder INT NOT NULL DEFAULT 0,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ticket Statuses table (for ticket status workflow)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ticket_statuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(50) NOT NULL UNIQUE,
        label VARCHAR(100) NOT NULL,
        color VARCHAR(7), -- Hex color code
        sortOrder INT NOT NULL DEFAULT 0,
        isActive BOOLEAN DEFAULT TRUE,
        isFinal BOOLEAN DEFAULT FALSE, -- True for 'closed', 'resolved' etc.
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // System Settings table (for configurable system parameters)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        label VARCHAR(200) NOT NULL,
        description TEXT,
        dataType ENUM('string', 'number', 'boolean', 'json', 'array') DEFAULT 'string',
        category ENUM('file_upload', 'email', 'system', 'ui', 'security') DEFAULT 'system',
        isEditable BOOLEAN DEFAULT TRUE,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user if not exists
    const [adminExists] = await db.execute('SELECT id FROM users WHERE email = ?', ['admin@presidentsaward.ke']);
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.execute(`
        INSERT INTO users (first_name, last_name, email, password, role) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Admin', 'User', 'admin@presidentsaward.ke', hashedPassword, 'admin']);
      console.log('Default admin user created');
      console.log('Admin default password hash:', hashedPassword); // Debug log
    }

    // Insert default regular user if not exists
    const [userExists] = await db.execute('SELECT id FROM users WHERE email = ?', ['user@presidentsaward.ke']);
    if (userExists.length === 0) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      await db.execute(`
        INSERT INTO users (first_name, last_name, email, password, role) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Regular', 'User', 'user@presidentsaward.ke', hashedPassword, 'customer']);
      console.log('Default regular user created');
      console.log('User default password hash:', hashedPassword); // Debug log
    }

    // Insert default roles if not exist
    const [rolesExist] = await db.execute('SELECT COUNT(*) as count FROM roles');
    if (rolesExist[0].count === 0) {
      await db.execute(`
        INSERT INTO roles (name, slug, permissions) VALUES 
        ('Administrator', 'admin', ?),
        ('Staff', 'staff', ?),
        ('Customer', 'customer', ?)
      `, [
        JSON.stringify(["manage_users", "manage_tickets", "manage_settings", "view_reports"]),
        JSON.stringify(["manage_tickets", "view_reports"]),
        JSON.stringify(["create_tickets", "view_own_tickets"])
      ]);
      console.log('Default roles created');
    }

    // Insert default departments if not exist
    const [deptExist] = await db.execute('SELECT COUNT(*) as count FROM departments');
    if (deptExist[0].count === 0) {
      await db.execute(`
        INSERT INTO departments (name, description) VALUES 
        ('Admin', 'Administration and Management'),
        ('ICT', 'Information and Communication Technology'),
        ('HR', 'Human Resources'),
        ('Finance', 'Finance and Accounting'),
        ('General', 'General Support')
      `);
      console.log('Default departments created');
    }

    // Insert default ticket types if not exist
    const [typesExist] = await db.execute('SELECT COUNT(*) as count FROM ticket_types');
    if (typesExist[0].count === 0) {
      await db.execute(`
        INSERT INTO ticket_types (name, description, category, priority_level) VALUES 
        ('Technical Issue', 'Hardware or software problems', 'technical', 'medium'),
        ('Account Access', 'Login or account related issues', 'access', 'high'),
        ('Bug Report', 'Software bugs and errors', 'bug', 'medium'),
        ('Feature Request', 'New feature suggestions', 'enhancement', 'low'),
        ('General Inquiry', 'General questions and information requests', 'general', 'low'),
        ('Award Progression', 'Issues related to award progression', 'award', 'high')
      `);
      console.log('Default ticket types created');
    }

    // Insert default priorities if not exist
    const [prioritiesExist] = await db.execute('SELECT COUNT(*) as count FROM priorities');
    if (prioritiesExist[0].count === 0) {
      await db.execute(`
        INSERT INTO priorities (value, label, color, sortOrder, isActive) VALUES 
        ('low', 'Low Priority', '#28a745', 1, TRUE),
        ('medium', 'Medium Priority', '#ffc107', 2, TRUE),
        ('high', 'High Priority', '#fd7e14', 3, TRUE),
        ('urgent', 'Urgent Priority', '#dc3545', 4, TRUE)
      `);
      console.log('Default priorities created');
    }

    // Insert default statuses if not exist
    const [statusesExist] = await db.execute('SELECT COUNT(*) as count FROM ticket_statuses');
    if (statusesExist[0].count === 0) {
      await db.execute(`
        INSERT INTO ticket_statuses (value, label, color, sortOrder, isActive, isFinal) VALUES 
        ('new', 'New', '#6c757d', 1, TRUE, FALSE),
        ('open', 'Open', '#007bff', 2, TRUE, FALSE),
        ('in_progress', 'In Progress', '#ffc107', 3, TRUE, FALSE),
        ('pending_assignment', 'Pending Assignment', '#ff6b6b', 4, TRUE, FALSE),
        ('resolved', 'Resolved', '#28a745', 5, TRUE, TRUE),
        ('closed', 'Closed', '#343a40', 6, TRUE, TRUE)
      `);
      console.log('Default statuses created');
    }

    // Insert default system settings if not exist
    const [settingsExist] = await db.execute('SELECT COUNT(*) as count FROM system_settings');
    if (settingsExist[0].count === 0) {
      await db.execute(`
        INSERT INTO system_settings (\`key\`, value, label, description, dataType, category, isEditable, isActive) VALUES 
        ('max_file_size_mb', '5', 'Maximum File Size (MB)', 'Maximum file size allowed for uploads in megabytes', 'number', 'file_upload', TRUE, TRUE),
        ('max_files_per_ticket', '3', 'Maximum Files per Ticket', 'Maximum number of files that can be uploaded per ticket', 'number', 'file_upload', TRUE, TRUE),
        ('allowed_file_types', '["image/png", "image/jpeg", "image/jpg", "application/pdf", "text/plain"]', 'Allowed File Types', 'MIME types allowed for file uploads', 'array', 'file_upload', TRUE, TRUE),
        ('system_name', 'Ticketing System CRM', 'System Name', 'Display name for the system', 'string', 'ui', TRUE, TRUE),
        ('default_ticket_priority', 'medium', 'Default Ticket Priority', 'Default priority assigned to new tickets', 'string', 'system', TRUE, TRUE),
        ('default_ticket_status', 'new', 'Default Ticket Status', 'Default status assigned to new tickets', 'string', 'system', FALSE, TRUE),
        ('email_notifications_enabled', 'true', 'Email Notifications', 'Enable/disable email notifications', 'boolean', 'email', TRUE, TRUE),
        ('auto_assign_tickets', 'false', 'Auto Assign Tickets', 'Automatically assign tickets to available agents based on workload and priority', 'boolean', 'system', TRUE, TRUE)
      `);
      console.log('Default system settings created');
    }

    console.log('Database tables created/verified');

  } catch (error) {
    console.error(' Error creating tables:', error.message);
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Suntra Investment Portal API',
    status: 'running'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Email functionality is now handled via Gmail App Password

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(500).json({
        error: 'Email transporter not configured',
        message: 'Please set up EMAIL_PASSWORD in your .env file'
      });
    }

    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Suntra Investment - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">Email Configuration Test</h2>
          <p>Your email configuration is working correctly!</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Email User: ${process.env.EMAIL_USER}</li>
            <li>Authentication: ${process.env.EMAIL_PASSWORD ? 'App Password' : 'OAuth 2.0'}</li>
            <li>Service: Gmail</li>
          </ul>
          <p>You can now receive ticket notifications and confirmations.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Test sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };

    await transporter.sendMail(testEmail);

    res.json({
      success: true,
      message: 'Test email sent successfully!',
      details: {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        authMethod: process.env.EMAIL_PASSWORD ? 'App Password' : 'OAuth 2.0'
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      message: error.message,
      suggestion: 'Check your EMAIL_PASSWORD in .env file'
    });
  }
});

// ================================================
// API ROUTES - Business Logic Endpoints
// ================================================

// Authentication endpoint - handles user login with JWT token generation
app.post('/api/login', async (req, res) => {
  try {
    let {
      email,
      password
    } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    email = email.trim().toLowerCase();

    console.log(' [LOGIN] Attempt for email:', email);
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    console.log(' [LOGIN] Found users:', users.length);

    if (users.length === 0) {
      console.error(' [LOGIN] Failed: user not found for email', email);
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = users[0];
    console.log(' [LOGIN] Comparing password for user:', user.id);
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(' [LOGIN] Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.error(' [LOGIN] Failed: invalid password for', email);
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    console.log(' [LOGIN] Generating token for user:', user.id);
    const {
      password: _,
      ...userWithoutPassword
    } = user;
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    },
      process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '24h'
    }
    );
    console.log(' [LOGIN] Success for user:', user.id);
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(' [LOGIN] CRITICAL ERROR:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Forgot Password - Request Reset
app.post('/api/forgot-password', async (req, res) => {
  try {
    const {
      email
    } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if user exists
    const [users] = await db.execute('SELECT id, first_name, last_name FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If the email exists, a reset link has been sent.'
      });
    }

    const user = users[0];

    // Generate secure reset token with short expiration for enhanced security
    // 5 minutes provides enough time for users while minimizing security risk
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 300000); // 5 minutes from now for security

    // Store reset token in database with short expiration
    await db.execute(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at) 
      VALUES (?, ?, ?)
    `, [user.id, resetToken, expiresAt]);

    // Send reset email
    if (transporter) {
      try {
        const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

        const htmlContent = await renderEmailTemplate('password_reset_link', {
          name: `${user.first_name} ${user.last_name}`,
          reset_url: resetUrl,
          button_url: resetUrl,
          button_text: 'Reset Password',
          sender_name: 'Suntra Support Team'
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset Request - Suntra Investment',
          html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(' Password reset email sent to:', email);
      } catch (emailError) {
        console.error(' Failed to send reset email:', emailError.message);
      }
    }

    res.json({
      message: 'If the email exists, a reset link has been sent. The link expires in 5 minutes for security.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Reset Password - Verify Token and Update Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const {
      token,
      newPassword
    } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Find valid reset token - tokens expire after 5 minutes for security
    const [tokens] = await db.execute(`
      SELECT rt.*, u.email, u.first_name, u.last_name 
      FROM password_reset_tokens rt 
      JOIN users u ON rt.user_id = u.id 
      WHERE rt.token = ? AND rt.expires_at > NOW() AND rt.used = FALSE
    `, [token]);

    if (tokens.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired reset token. Reset tokens expire after 5 minutes for security.'
      });
    }

    const resetData = tokens[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetData.user_id]);

    // Mark token as used
    await db.execute('UPDATE password_reset_tokens SET used = TRUE WHERE id = ?', [resetData.id]);

    // Send confirmation email
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: resetData.email,
          subject: 'Password Successfully Reset - Suntra Investment',
          html: await renderEmailTemplate('password_reset_confirmation', {
            name: `${resetData.first_name} ${resetData.last_name}`,
            login_url: `${process.env.FRONTEND_URL}/auth/login`,
            button_url: `${process.env.FRONTEND_URL}/auth/login`,
            button_text: 'Sign in',
            sender_name: 'Suntra Support Team'
          })
        };

        await transporter.sendMail(mailOptions);
        console.log(' Password reset confirmation sent to:', resetData.email);
      } catch (emailError) {
        console.error(' Failed to send confirmation email:', emailError.message);
      }
    }

    res.json({
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Register route
app.post('/api/register', async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      password,
      phone,
      city,
      country,
      address
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'First name, last name, email, and password are required'
      });
    }

    email = email.trim().toLowerCase();

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      console.error('Registration failed: duplicate email', email);
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle optional fields - convert undefined to null
    const userPhone = phone || null;
    const userCity = city || null;
    const userCountry = country || null;
    const userAddress = address || null;

    // Create user
    try {
      const [result] = await db.execute(`
        INSERT INTO users (first_name, last_name, email, password, phone, city, country, address, role) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [firstName, lastName, email, hashedPassword, userPhone, userCity, userCountry, userAddress, 'customer']);

      res.status(201).json({
        message: 'User registered successfully',
        userId: result.insertId
      });
    } catch (dbError) {
      console.error('Registration DB error:', dbError, 'Email:', email);
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          error: 'User with this email already exists'
        });
      }
      return res.status(500).json({
        error: 'Registration failed. Please try again.'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.'
    });
  }
});

// DEBUG: Check default user existence and password hash
app.get('/api/debug-user', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, email, password, role FROM users WHERE email = ?', ['user@presidentsaward.ke']);
    if (users.length === 0) {
      return res.json({
        exists: false
      });
    }
    res.json({
      exists: true,
      user: users[0]
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// DEBUG: List all users (for troubleshooting)
app.get('/api/debug-users', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, email, first_name, last_name, role FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Get tickets (list with pagination)
app.get('/api/tickets', async (req, res) => {
  try {
    console.log('� GET /api/tickets called with query params:', req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const priority = req.query.priority || '';
    const department = req.query.department || '';
    const created_by = req.query.created_by || '';
    const offset = (page - 1) * limit;

    console.log(' Parsed parameters:', {
      page,
      limit,
      search,
      status,
      priority,
      department,
      created_by
    });

    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    if (search) {
      whereClause += ' AND (t.subject LIKE ? OR t.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND t.status = ?';
      queryParams.push(status);
    }

    if (priority) {
      whereClause += ' AND t.priority = ?';
      queryParams.push(priority);
    }

    if (department) {
      whereClause += ' AND t.department = ?';
      queryParams.push(department);
    }

    if (created_by) {
      whereClause += ' AND t.user_id = ?';
      queryParams.push(created_by);
      console.log('� Customer filter applied - filtering by user_id:', created_by);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tickets t ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Get tickets with user info and proper UTC timestamps
    const ticketsQuery = `
      SELECT 
        t.id,
        CONCAT('#', LPAD(t.id, 6, '0')) as \`key\`,
        t.subject,
        t.description,
        COALESCE(tt.name, t.type) as type,
        COALESCE(d.name, t.department) as department,
        t.priority,
        t.status,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        u.email as customerEmail,
        t.assigned_to as assignedTo,
        assigned_user.first_name as assignedToName,
        DATE_FORMAT(t.created_at, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(t.updated_at, '%Y-%m-%dT%H:%i:%s') as updatedAt,
        DATE_FORMAT(t.resolved_at, '%Y-%m-%dT%H:%i:%s') as resolvedAt,
        DATE_FORMAT(t.assignment_deadline, '%Y-%m-%dT%H:%i:%s') as assignmentDeadline,
        DATE_FORMAT(t.resolution_deadline, '%Y-%m-%dT%H:%i:%s') as resolutionDeadline,
        t.assignment_sla_breached as assignmentSlaBreached,
        t.resolution_sla_breached as resolutionSlaBreached,
        t.sla_status as slaStatus
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN ticket_types tt ON t.type = tt.id OR t.type = tt.name
      LEFT JOIN departments d ON t.department = d.id OR t.department = d.name
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [tickets] = await db.execute(ticketsQuery, queryParams);

    res.json({
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Create ticket
app.post('/api/tickets', async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      subject,
      description,
      type,
      department,
      priority = 'medium'
    } = req.body;

    if (!firstName || !lastName || !email || !subject || !description || !type || !department) {
      return res.status(400).json({
        error: 'All required fields must be provided'
      });
    }

    email = email.trim().toLowerCase();

    // Check if user exists, if not create one
    let userId = null;
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      const [userResult] = await db.execute(`
        INSERT INTO users (first_name, last_name, email, password, role) 
        VALUES (?, ?, ?, ?, ?)
      `, [firstName, lastName, email, await bcrypt.hash('temp123', 10), 'customer']);
      userId = userResult.insertId;
    }

    // ============================================================================
    // PHASE 1: ENTERPRISE-GRADE AUTO-ASSIGNMENT WITH INTELLIGENT LOAD MANAGEMENT
    // ============================================================================

    // Check if auto-assignment is enabled
    const [autoAssignSetting] = await db.execute(`
      SELECT value FROM system_settings WHERE \`key\` = 'auto_assign_tickets'
    `);
    const autoAssignEnabled = autoAssignSetting.length > 0 && autoAssignSetting[0].value === 'true';

    let assignedTo = null;
    let ticketStatus = 'new';
    let assignmentReason = 'NOT_ATTEMPTED';

    if (!autoAssignEnabled) {
      console.log(`\n⚠️  [AUTO-ASSIGNMENT] Auto-assignment is disabled - ticket will require manual assignment`);
      assignmentReason = 'AUTO_ASSIGNMENT_DISABLED';
    } else {
      // Configuration constants
      const MAX_LOAD_THRESHOLD = 10; // Maximum tickets per staff before saturation
      const COMFORTABLE_LOAD_THRESHOLD = 7; // Comfortable workload threshold
      const CRITICAL_PRIORITIES = new Set(['urgent', 'high']); // Always auto-assign these

      console.log(`\n🎯 [AUTO-ASSIGNMENT] Starting intelligent assignment for ${priority} priority ticket to ${department} department`);

      // Step 1: Fetch department-specific staff with current load
      const [deptStaff] = await db.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, d.name as department,
             COUNT(t.id) as current_tickets
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tickets t ON u.id = t.assigned_to 
                         AND t.status IN ('new', 'open', 'in_progress', 'pending_assignment')
      WHERE u.role = 'staff' 
        AND u.is_active = TRUE
        AND d.name = ?
      GROUP BY u.id
      ORDER BY current_tickets ASC, RAND()
    `, [department]);

      console.log(`📊 [LOAD ANALYSIS] Found ${deptStaff.length} active staff in ${department} department`);

      // Step 2: Evaluate assignment eligibility
      if (deptStaff.length === 0) {
        // No staff in department - try general pool
        console.log(`⚠️  [FALLBACK] No staff in ${department}, checking general pool...`);

        const [generalStaff] = await db.execute(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, d.name as department,
               COUNT(t.id) as current_tickets
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN tickets t ON u.id = t.assigned_to 
                           AND t.status IN ('new', 'open', 'in_progress', 'pending_assignment')
        WHERE u.role = 'staff' AND u.is_active = TRUE
        GROUP BY u.id
        ORDER BY current_tickets ASC, RAND()
      `);

        if (generalStaff.length === 0) {
          ticketStatus = 'pending_assignment';
          assignmentReason = 'NO_STAFF_AVAILABLE';
          console.log(`❌ [ASSIGNMENT FAILED] No active staff in system - ticket marked as pending_assignment`);
        } else {
          const loads = generalStaff.map(s => s.current_tickets);
          const minLoad = Math.min(...loads);
          const avgLoad = (loads.reduce((sum, l) => sum + l, 0) / loads.length).toFixed(1);

          console.log(`📈 [SYSTEM LOAD] Min: ${minLoad}, Avg: ${avgLoad}, Staff: ${generalStaff.length}`);

          // Check if we should assign based on priority and load
          if (CRITICAL_PRIORITIES.has(priority)) {
            // Critical tickets always get assigned
            const candidate = generalStaff[0]; // Least busy
            assignedTo = candidate.id;
            ticketStatus = 'open';
            assignmentReason = 'CRITICAL_PRIORITY_OVERRIDE';
            console.log(`🚨 [CRITICAL OVERRIDE] Assigned to ${candidate.first_name} ${candidate.last_name} (${candidate.current_tickets} tickets) - Priority override`);
          } else if (minLoad >= MAX_LOAD_THRESHOLD) {
            // System saturated
            ticketStatus = 'pending_assignment';
            assignmentReason = 'SYSTEM_SATURATED';
            console.log(`🔴 [SYSTEM SATURATED] All staff at/above ${MAX_LOAD_THRESHOLD} tickets - deferring assignment`);
          } else if (minLoad < COMFORTABLE_LOAD_THRESHOLD) {
            // Capacity available
            const topCandidates = generalStaff.slice(0, Math.min(3, generalStaff.length));
            const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
            assignedTo = selected.id;
            ticketStatus = 'open';
            assignmentReason = 'CAPACITY_AVAILABLE_GENERAL';
            console.log(`✅ [ASSIGNED] ${selected.first_name} ${selected.last_name} from ${selected.department || 'No Dept'} (${selected.current_tickets} tickets) - General pool`);
          } else {
            // Busy but not saturated - defer non-critical
            ticketStatus = 'pending_assignment';
            assignmentReason = 'STAFF_BUSY_DEFERRED';
            console.log(`🟡 [DEFERRED] Staff busy (min load: ${minLoad}) - non-critical ticket deferred`);
          }
        }
      } else {
        // Department staff available
        const loads = deptStaff.map(s => s.current_tickets);
        const minLoad = Math.min(...loads);
        const avgLoad = (loads.reduce((sum, l) => sum + l, 0) / loads.length).toFixed(1);

        console.log(`📈 [DEPT LOAD] ${department}: Min: ${minLoad}, Avg: ${avgLoad}, Staff: ${deptStaff.length}`);

        if (CRITICAL_PRIORITIES.has(priority)) {
          // Critical tickets always get assigned
          const candidate = deptStaff[0]; // Least busy in department
          assignedTo = candidate.id;
          ticketStatus = 'open';
          assignmentReason = 'CRITICAL_PRIORITY_DEPT';
          console.log(`🚨 [CRITICAL DEPT] Assigned to ${candidate.first_name} ${candidate.last_name} (${candidate.current_tickets} tickets) - Priority override`);
        } else if (minLoad >= MAX_LOAD_THRESHOLD) {
          // Department saturated
          ticketStatus = 'pending_assignment';
          assignmentReason = 'DEPARTMENT_SATURATED';
          console.log(`🔴 [DEPT SATURATED] ${department} staff at/above ${MAX_LOAD_THRESHOLD} tickets - deferring assignment`);
        } else if (minLoad < COMFORTABLE_LOAD_THRESHOLD) {
          // Capacity available in department
          const topCandidates = deptStaff.slice(0, Math.min(3, deptStaff.length));
          const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
          assignedTo = selected.id;
          ticketStatus = 'open';
          assignmentReason = 'CAPACITY_AVAILABLE_DEPT';
          console.log(`✅ [DEPT ASSIGNED] ${selected.first_name} ${selected.last_name} (${selected.current_tickets} tickets) - ${department} department`);
        } else {
          // Department busy but not saturated - defer non-critical
          ticketStatus = 'pending_assignment';
          assignmentReason = 'DEPARTMENT_BUSY_DEFERRED';
          console.log(`🟡 [DEPT DEFERRED] ${department} busy (min load: ${minLoad}) - non-critical ticket deferred`);
        }
      }

      console.log(`📝 [ASSIGNMENT RESULT] Status: ${ticketStatus}, Assigned: ${assignedTo ? 'Yes' : 'No'}, Reason: ${assignmentReason}\n`);
    } // End auto-assignment conditional

    // Step 3: Calculate SLA deadlines
    const now = new Date();
    const SLACalculator = require('./services/SLACalculator');
    const slaDeadlines = await SLACalculator.calculateTicketSLA(priority, now);

    console.log(`[SLA] Assignment deadline: ${slaDeadlines.assignmentDeadline.toISOString()}`);

    // If ticket is assigned, calculate resolution deadline
    let resolutionDeadline = null;
    let assignedAt = null;
    if (assignedTo) {
      assignedAt = now;
      resolutionDeadline = SLACalculator.calculateResolutionDeadline(assignedAt, slaDeadlines.resolutionSLAMinutes);
      console.log(`[SLA] Resolution deadline: ${resolutionDeadline.toISOString()}`);
    }

    // Step 4: Insert ticket with determined status, assignment, and SLA deadlines
    const [result] = await db.execute(`
      INSERT INTO tickets (
        user_id, subject, description, type, department, priority, status, assigned_to, 
        created_at, updated_at, assigned_at, assignment_deadline, resolution_deadline
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, subject, description, type, department, priority, ticketStatus, assignedTo,
      now, now, assignedAt, slaDeadlines.assignmentDeadline, resolutionDeadline
    ]);

    // Get the created ticket with user info and assignment details
    const [newTicket] = await db.execute(`
      SELECT 
        t.id,
        CONCAT('#', LPAD(t.id, 6, '0')) as \`key\`,
        t.subject,
        t.description,
        t.type,
        t.department,
        t.priority,
        t.status,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        u.email as customerEmail,
        t.assigned_to as assignedTo,
        CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) as assignedToName,
        assigned_user.email as assignedToEmail,
        DATE_FORMAT(t.created_at, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(t.updated_at, '%Y-%m-%dT%H:%i:%s') as updatedAt,
        
        -- Get readable names for email notifications
        COALESCE(dept.name, t.department) as departmentName,
        COALESCE(tt.name, t.type) as typeName,
        COALESCE(p.label, t.priority) as priorityName,
        COALESCE(ts.label, t.status) as statusName
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN departments dept ON dept.name = t.department OR dept.id = t.department
      LEFT JOIN ticket_types tt ON tt.name = t.type OR tt.id = t.type  
      LEFT JOIN priorities p ON p.value = t.priority OR p.id = t.priority
      LEFT JOIN ticket_statuses ts ON ts.value = t.status OR ts.id = t.status
      WHERE t.id = ?
    `, [result.insertId]);

    console.log(' Created ticket with timestamp:', newTicket[0].createdAt);

    // Send notification email to assigned staff member
    if (assignedTo && transporter && process.env.EMAIL_USER && newTicket[0].assignedToEmail) {
      try {
        const priorityColor = (newTicket[0].priorityName || priority) === 'urgent' ? '#dc2626' :
          (newTicket[0].priorityName || priority) === 'high' ? '#ea580c' :
            (newTicket[0].priorityName || priority) === 'medium' ? '#ca8a04' : '#16a34a';

        const staffMailOptions = {
          from: `"Suntra Support" <${process.env.EMAIL_USER}>`,
          to: newTicket[0].assignedToEmail,
          subject: `New Ticket Assigned: ${newTicket[0].key} - ${subject}`,
          html: await renderEmailTemplate('assigned_ticket', {
            name: newTicket[0].assignedToName,
            uid: newTicket[0].key,
            title: subject,
            priority: (newTicket[0].priorityName || priority).toUpperCase(),
            button_url: `${process.env.FRONTEND_URL}/tickets/${newTicket[0].id}`,
            button_text: 'View Ticket',
            sender_name: 'Suntra Support Team'
          })
        };

        await transporter.sendMail(staffMailOptions);
        console.log(' Assignment notification sent to staff:', newTicket[0].assignedToEmail);
      } catch (emailError) {
        console.error(' Failed to send staff notification:', emailError.message);
      }
    }

    // Send confirmation email to the user who created the ticket (template-driven)
    if (transporter && process.env.EMAIL_USER) {
      try {
        const customerHtml = await renderEmailTemplate('create_ticket_dashboard', {
          name: `${firstName} ${lastName}`,
          uid: newTicket[0].key,
          title: subject,
          department: newTicket[0].departmentName || department,
          type: newTicket[0].typeName || type,
          priority: (newTicket[0].priorityName || priority).toUpperCase(),
          status: newTicket[0].statusName || newTicket[0].status,
          created_at: newTicket[0].createdAt,
          assigned_to: assignedTo ? newTicket[0].assignedToName : '',
          button_url: `${process.env.FRONTEND_URL}/tickets/${newTicket[0].id}`,
          button_text: 'View Ticket',
          sender_name: 'Suntra Support Team'
        });

        const mailOptions = {
          from: `"Support Team" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `We’ve received your ticket ${newTicket[0].key} — ${subject}`,
          html: customerHtml || ''
        };

        await transporter.sendMail(mailOptions);
        console.log(' Confirmation email sent to:', email);
      } catch (emailError) {
        console.error(' Failed to send confirmation email:', emailError.message);
        // Don't fail the ticket creation if email fails
      }
    }

    res.status(201).json(newTicket[0]);

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update ticket status and assignment
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      status,
      assigned_to,
      priority,
      notes,
      resolution_comment
    } = req.body;

    // Get current ticket info
    const [currentTicket] = await db.execute(`
      SELECT t.*, u.email as customerEmail, u.first_name as customerFirstName, u.last_name as customerLastName,
             assigned_user.email as currentAssignedEmail, assigned_user.first_name as currentAssignedName
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      WHERE t.id = ?
    `, [id]);

    if (currentTicket.length === 0) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    const ticket = currentTicket[0];
    const updates = [];
    const values = [];

    // Build dynamic update query
    if (status && status !== ticket.status) {
      updates.push('status = ?');
      values.push(status);

      // If resolving or closing, add resolution comment
      if (['resolved', 'closed'].includes(status) && resolution_comment) {
        updates.push('resolution_comment = ?');
        values.push(resolution_comment);
      }
    }
    if (assigned_to !== undefined && assigned_to !== ticket.assigned_to) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }
    if (priority && priority !== ticket.priority) {
      updates.push('priority = ?');
      values.push(priority);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(id);

      await db.execute(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, values);

      // Get updated ticket info with readable names
      const [updatedTicket] = await db.execute(`
        SELECT t.*, 
               CONCAT(u.first_name, ' ', u.last_name) as customerName,
               u.email as customerEmail,
               CONCAT(assigned_user.first_name, ' ', assigned_user.last_name) as assignedToName,
               assigned_user.email as assignedToEmail,
               
               -- Get readable names for email notifications
               COALESCE(dept.name, t.department) as departmentName,
               COALESCE(tt.name, t.type) as typeName,
               COALESCE(p.label, t.priority) as priorityName,
               COALESCE(ts.label, t.status) as statusName
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
        LEFT JOIN departments dept ON dept.name = t.department OR dept.id = t.department
        LEFT JOIN ticket_types tt ON tt.name = t.type OR tt.id = t.type  
        LEFT JOIN priorities p ON p.value = t.priority OR p.id = t.priority
        LEFT JOIN ticket_statuses ts ON ts.value = t.status OR ts.id = t.status
        WHERE t.id = ?
      `, [id]);

      // Send email notification for assignment changes
      if (assigned_to !== undefined && assigned_to !== ticket.assigned_to && assigned_to && transporter && updatedTicket[0].assignedToEmail) {
        try {
          console.log(` Sending assignment notification to ${updatedTicket[0].assignedToEmail}`);

          const staffMailOptions = {
            from: `"HelpDesk System" <${process.env.EMAIL_USER}>`,
            to: updatedTicket[0].assignedToEmail,
            subject: `Ticket Assigned: ${updatedTicket[0].key || '#' + String(id).padStart(6, '0')} - ${ticket.subject}`,
            html: await renderEmailTemplate('assigned_ticket', {
              name: updatedTicket[0].assignedToName,
              uid: updatedTicket[0].key || '#' + String(id).padStart(6, '0'),
              title: ticket.subject,
              priority: (updatedTicket[0].priorityName || updatedTicket[0].priority || 'medium').toUpperCase(),
              button_url: `${process.env.FRONTEND_URL}/tickets/${id}`,
              button_text: 'View Ticket',
              sender_name: 'HelpDesk Support Team'
            })
          };

          await transporter.sendMail(staffMailOptions);
          console.log(` Assignment notification sent to staff: ${updatedTicket[0].assignedToEmail}`);
        } catch (emailError) {
          console.error(' Failed to send assignment notification:', emailError.message);
        }
      }

      // Send notification emails for significant status changes
      if (status && ['resolved', 'closed'].includes(status) && transporter) {
        try {
          const statusColor = status === 'resolved' ? '#059669' : '#6B7280';
          const statusIcon = status === 'resolved' ? '[RESOLVED]' : '[CLOSED]';

          const customerMailOptions = {
            from: `"Support Team" <${process.env.EMAIL_USER}>`,
            to: ticket.customerEmail,
            subject: `${statusIcon} Ticket ${status === 'resolved' ? 'Resolved' : 'Closed'}: #${String(id).padStart(6, '0')} - ${ticket.subject}`,
            html: await renderEmailTemplate('ticket_updated', {
              name: `${ticket.customerFirstName} ${ticket.customerLastName}`,
              uid: String(id).padStart(6, '0'),
              title: ticket.subject,
              status: (updatedTicket[0].statusName || status).toUpperCase(),
              public_note: resolution_comment || '',
              button_url: `${process.env.FRONTEND_URL}/tickets/${id}`,
              button_text: 'View Ticket',
              sender_name: 'HelpDesk Support Team'
            })
          };

          await transporter.sendMail(customerMailOptions);
          console.log(` ${status} notification sent to customer:`, ticket.customerEmail);
        } catch (emailError) {
          console.error(' Failed to send status update email:', emailError.message);
        }
      }

      res.json(updatedTicket[0]);
    } else {
      res.json(ticket);
    }

  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Assign ticket to staff member
app.post('/api/tickets/:id/assign', async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      staffId
    } = req.body;

    // Verify staff member exists and has proper role (only staff can be assigned tickets)
    const [staff] = await db.execute(`
      SELECT id, first_name, last_name, email, role 
      FROM users 
      WHERE id = ? AND role = 'staff'
    `, [staffId]);

    if (staff.length === 0) {
      return res.status(400).json({
        error: 'Invalid staff member selected. Only staff members can be assigned tickets.'
      });
    }

    // Update ticket assignment
    await db.execute(`
      UPDATE tickets 
      SET assigned_to = ?, status = CASE WHEN status = 'new' THEN 'open' ELSE status END, updated_at = NOW()
      WHERE id = ?
    `, [staffId, id]);

    // Get updated ticket with readable names
    const [ticket] = await db.execute(`
      SELECT t.*, 
             u.email as customerEmail, 
             u.first_name as customerFirstName, 
             u.last_name as customerLastName,
             
             -- Get readable names
             COALESCE(dept.name, t.department) as departmentName,
             COALESCE(tt.name, t.type) as typeName,
             COALESCE(p.label, t.priority) as priorityName,
             COALESCE(ts.label, t.status) as statusName
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN departments dept ON dept.name = t.department OR dept.id = t.department
      LEFT JOIN ticket_types tt ON tt.name = t.type OR tt.id = t.type  
      LEFT JOIN priorities p ON p.value = t.priority OR p.id = t.priority
      LEFT JOIN ticket_statuses ts ON ts.value = t.status OR ts.id = t.status
      WHERE t.id = ?
    `, [id]);

    if (ticket.length === 0) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Send assignment notification to new staff member
    if (transporter) {
      try {
        const mailOptions = {
          from: `"Support System" <${process.env.EMAIL_USER}>`,
          to: staff[0].email,
          subject: `Ticket Assigned: #${String(id).padStart(6, '0')} - ${ticket[0].subject}`,
          html: await renderEmailTemplate('assigned_ticket', {
            name: staff[0].first_name,
            uid: String(id).padStart(6, '0'),
            title: ticket[0].subject,
            priority: (ticket[0].priorityName || ticket[0].priority || 'medium').toUpperCase(),
            button_url: `${process.env.FRONTEND_URL}/tickets/${id}`,
            button_text: 'View Ticket',
            sender_name: 'HelpDesk Support Team'
          })
        };

        await transporter.sendMail(mailOptions);
        console.log(' Assignment notification sent to:', staff[0].email);
      } catch (emailError) {
        console.error(' Failed to send assignment notification:', emailError.message);
      }
    }

    res.json({
      message: 'Ticket assigned successfully',
      assignedTo: staff[0],
      ticket: ticket[0]
    });

  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get staff workload
app.get('/api/staff/workload', async (req, res) => {
  try {
    const [workload] = await db.execute(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.role,
        COUNT(CASE WHEN t.status IN ('new', 'open', 'in_progress') THEN 1 END) as active_tickets,
        COUNT(t.id) as total_tickets,
        COALESCE(AVG(CASE WHEN t.status = 'closed' THEN 
          TIMESTAMPDIFF(HOUR, t.created_at, t.updated_at) 
        END), 0) as avg_resolution_hours
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      WHERE u.role IN ('staff', 'admin')
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.role
      ORDER BY active_tickets ASC, u.first_name ASC
    `);

    res.json(workload);
  } catch (error) {
    console.error('Get staff workload error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get ticket statistics (Enhanced) - MUST be before /:id route
app.get('/api/tickets/stats', async (req, res) => {
  try {
    const created_by = req.query.created_by || '';

    let whereClause = '';
    let queryParams = [];

    if (created_by) {
      whereClause = 'WHERE user_id = ?';
      queryParams.push(created_by);
    }

    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) as new,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as inProgress,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) as closed,
        COALESCE(SUM(CASE WHEN assigned_to IS NOT NULL THEN 1 ELSE 0 END), 0) as assigned,
        COALESCE(SUM(CASE WHEN assigned_to IS NULL THEN 1 ELSE 0 END), 0) as unassigned,
        COALESCE(SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END), 0) as urgent,
        COALESCE(SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END), 0) as high,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) as today
      FROM tickets ${whereClause}
    `, queryParams);

    const result = stats[0];

    // Add calculated fields
    result.pending = result.new; // Alias for consistency
    result.active = result.open + result.inProgress;
    result.completed = result.resolved + result.closed;

    console.log(' Enhanced Ticket Stats:', result);

    res.json(result);
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get ticket assignment distribution
app.get('/api/tickets/assignment-stats', async (req, res) => {
  try {
    const [assignmentStats] = await db.execute(`
      SELECT 
        u.id as staff_id,
        CONCAT(u.first_name, ' ', u.last_name) as staff_name,
        u.email,
        d.name as department,
        COUNT(t.id) as total_assigned,
        SUM(CASE WHEN t.status IN ('new', 'open', 'in_progress') THEN 1 ELSE 0 END) as active_tickets,
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as closed_tickets,
        MAX(t.created_at) as last_assigned
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tickets t ON u.id = t.assigned_to
      WHERE u.role IN ('staff', 'admin')
      GROUP BY u.id, u.first_name, u.last_name, u.email, d.name
      ORDER BY total_assigned DESC, u.first_name
    `);

    // Get unassigned tickets
    const [unassigned] = await db.execute(`
      SELECT COUNT(*) as unassigned_count
      FROM tickets
      WHERE assigned_to IS NULL
    `);

    console.log(' Assignment Distribution:', assignmentStats);

    res.json({
      staff_assignments: assignmentStats,
      unassigned_tickets: unassigned[0].unassigned_count
    });
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// =====================
// Tickets Import/Export
// =====================

// Helper to build WHERE clause for export based on filters
function buildTicketWhereFromQuery(query) {
  let whereClause = 'WHERE 1=1';
  const params = [];

  const {
    search,
    status,
    priority,
    department,
    type,
    created_by
  } = query;

  if (search) {
    whereClause += ' AND (t.subject LIKE ? OR t.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      whereClause += ' AND t.status = ?';
      params.push(statuses[0]);
    } else if (statuses.length > 1) {
      whereClause += ` AND t.status IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }
  }
  if (priority) {
    const priorities = String(priority).split(',').map(s => s.trim()).filter(Boolean);
    if (priorities.length === 1) {
      whereClause += ' AND t.priority = ?';
      params.push(priorities[0]);
    } else if (priorities.length > 1) {
      whereClause += ` AND t.priority IN (${priorities.map(() => '?').join(',')})`;
      params.push(...priorities);
    }
  }
  if (department) {
    const departments = String(department).split(',').map(s => s.trim()).filter(Boolean);
    if (departments.length === 1) {
      whereClause += ' AND t.department = ?';
      params.push(departments[0]);
    } else if (departments.length > 1) {
      whereClause += ` AND t.department IN (${departments.map(() => '?').join(',')})`;
      params.push(...departments);
    }
  }
  if (type) {
    const types = String(type).split(',').map(s => s.trim()).filter(Boolean);
    if (types.length === 1) {
      whereClause += ' AND t.type = ?';
      params.push(types[0]);
    } else if (types.length > 1) {
      whereClause += ` AND t.type IN (${types.map(() => '?').join(',')})`;
      params.push(...types);
    }
  }
  if (created_by) {
    whereClause += ' AND t.user_id = ?';
    params.push(created_by);
  }

  return {
    whereClause,
    params
  };
}

function buildCsvRow(values) {
  return values
    .map(v => {
      const value = v == null ? '' : String(v);
      return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    })
    .join(',');
}

// Export tickets (CSV or JSON)
app.get('/api/tickets/export', async (req, res) => {
  try {
    const format = (req.query.format || 'csv').toString().toLowerCase();
    const fields = (req.query.fields || 'key,subject,type,department,priority,status,customerName,customerEmail,assignedToName,createdAt,updatedAt')
      .toString()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const {
      whereClause,
      params
    } = buildTicketWhereFromQuery(req.query);

    const [rows] = await db.execute(
      `SELECT 
        t.id,
        CONCAT('#', LPAD(t.id, 6, '0')) as \`key\`,
        t.subject,
        t.description,
        t.type,
        t.department,
        t.priority,
        t.status,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        u.email as customerEmail,
        t.assigned_to as assignedTo,
        assigned_user.first_name as assignedToName,
        DATE_FORMAT(t.created_at, '%Y-%m-%dT%H:%i:%sZ') as createdAt,
        DATE_FORMAT(t.updated_at, '%Y-%m-%dT%H:%i:%sZ') as updatedAt,
        t.resolution_comment as resolution_comment
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      ${whereClause}
      ORDER BY t.created_at DESC`,
      params
    );

    if (format === 'json') {
      const payload = rows.map(r => {
        const obj = {};
        fields.forEach(f => (obj[f] = r[f] ?? ''));
        return obj;
      });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(JSON.stringify(payload, null, 2));
    }

    // default CSV
    const headerLabels = fields;
    const lines = [buildCsvRow(headerLabels)];
    rows.forEach(r => {
      const line = buildCsvRow(fields.map(f => r[f] ?? ''));
      lines.push(line);
    });
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets-export.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export tickets error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Export template (CSV headers only)
app.get('/api/tickets/export-template', async (_req, res) => {
  const headers = [
    'key', 'subject', 'description', 'type', 'department', 'priority', 'status', 'customerName', 'customerEmail', 'assignedToName', 'createdAt', 'updatedAt', 'resolvedAt', 'resolution_comment'
  ];
  const csv = buildCsvRow(headers) + '\n';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tickets-template.csv"');
  res.status(200).send(csv);
});

// Bulk create tickets
app.post('/api/tickets/bulk', async (req, res) => {
  try {
    const tickets = Array.isArray(req.body.tickets) ? req.body.tickets : [];
    if (tickets.length === 0) {
      return res.status(400).json({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          message: 'No tickets provided'
        }],
        warnings: []
      });
    }

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (const ticket of tickets) {
      try {
        const subject = (ticket.subject || '').toString().trim();
        const description = (ticket.description || '').toString().trim();
        const customerEmail = (ticket.customerEmail || '').toString().trim().toLowerCase();
        if (!subject || !description || !customerEmail) {
          failed++;
          errors.push({
            message: 'Missing required fields (subject, description, customerEmail)',
            data: ticket
          });
          continue;
        }

        // Ensure user exists
        let userId = null;
        let isNewUser = false;
        const tempPassword = 'TempPass123!';

        const [existingUsers] = await db.execute('SELECT id, first_name, last_name FROM users WHERE email = ?', [customerEmail]);
        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
        } else {
          const fullName = (ticket.customerName || '').toString().trim();
          const [firstName, ...rest] = fullName.split(' ');
          const lastName = rest.join(' ') || '-';

          // Generate a temporary password for bulk imported users
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          const [userInsert] = await db.execute(
            'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [firstName || '-', lastName, customerEmail, hashedPassword, 'customer']
          );
          userId = userInsert.insertId;
          isNewUser = true;

          // Send welcome email with temporary password to new users
          if (transporter && process.env.EMAIL_USER) {
            try {
              const welcomeEmail = {
                from: `"HelpDesk Support" <${process.env.EMAIL_USER}>`,
                to: customerEmail,
                subject: 'Welcome to HelpDesk - Your Account Has Been Created',
                html: await renderEmailTemplate('user_created', {
                  name: `${firstName} ${lastName}`,
                  username: customerEmail,
                  email: customerEmail,
                  sender_name: 'HelpDesk Support Team'
                })
              };

              await transporter.sendMail(welcomeEmail);
              console.log(`Welcome email sent to new user: ${customerEmail}`);
            } catch (emailError) {
              console.error(`Failed to send welcome email to ${customerEmail}:`, emailError.message);
              // Don't fail the import if email fails
            }
          }
        }

        // Auto-assign ticket to available staff in the department (if not manually assigned)
        let assignedTo = null;
        if (ticket.assignedToName) {
          // If assignedToName is provided, try to find that user
          const [assignedUser] = await db.execute(
            'SELECT id FROM users WHERE CONCAT(first_name, " ", last_name) LIKE ? AND role IN ("staff", "admin") LIMIT 1',
            [`%${ticket.assignedToName}%`]
          );
          if (assignedUser.length > 0) {
            assignedTo = assignedUser[0].id;
          }
        }

        // If no manual assignment, use smart auto-assignment logic
        if (!assignedTo) {
          const department = ticket.department || 'Support';

          // First, try to find staff from the same department
          const [deptStaff] = await db.execute(`
            SELECT u.id, u.first_name, u.last_name, u.email, d.name as department,
                   COUNT(t.id) as current_tickets
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN tickets t ON u.id = t.assigned_to AND t.status IN ('new', 'open', 'in_progress')
            WHERE u.role = 'staff' AND d.name = ?
            GROUP BY u.id
            ORDER BY current_tickets ASC, RAND()
            LIMIT 3
          `, [department]);

          // If no department-specific staff, get any available staff
          if (deptStaff.length === 0) {
            const [availableStaff] = await db.execute(`
              SELECT u.id, u.first_name, u.last_name, u.email, d.name as department,
                     COUNT(t.id) as current_tickets
              FROM users u
              LEFT JOIN departments d ON u.department_id = d.id
              LEFT JOIN tickets t ON u.id = t.assigned_to AND t.status IN ('new', 'open', 'in_progress')
              WHERE u.role = 'staff'
              GROUP BY u.id
              ORDER BY current_tickets ASC, RAND()
              LIMIT 3
            `);

            if (availableStaff.length > 0) {
              const selectedStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];
              assignedTo = selectedStaff.id;
              console.log(` Bulk import: Auto-assigned to ${selectedStaff.first_name} ${selectedStaff.last_name} (${selectedStaff.current_tickets} tickets) - General pool`);
            }
          } else {
            const selectedStaff = deptStaff[Math.floor(Math.random() * deptStaff.length)];
            assignedTo = selectedStaff.id;
            console.log(` Bulk import: Auto-assigned to ${selectedStaff.first_name} ${selectedStaff.last_name} from ${selectedStaff.department} (${selectedStaff.current_tickets} tickets) - Department match`);
          }
        }

        const now = new Date();
        const initialStatus = assignedTo ? 'open' : 'new';
        const [ticketResult] = await db.execute(
          `INSERT INTO tickets (user_id, subject, description, type, department, priority, status, assigned_to, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            subject,
            description,
            ticket.type || 'General Inquiry',
            ticket.department || 'Customer Service',
            (ticket.priority || 'medium').toLowerCase(),
            initialStatus,
            assignedTo,
            now,
            now
          ]
        );

        const ticketId = ticketResult.insertId;
        const ticketKey = `#${String(ticketId).padStart(6, '0')}`;

        // Send ticket creation notification to EXISTING users (new users already got welcome email)
        if (!isNewUser && transporter && process.env.EMAIL_USER) {
          try {
            const [userInfo] = await db.execute('SELECT first_name, last_name FROM users WHERE id = ?', [userId]);
            const firstName = userInfo.length > 0 ? userInfo[0].first_name : 'Customer';
            const lastName = userInfo.length > 0 ? userInfo[0].last_name : '';

            const ticketNotification = {
              from: `"HelpDesk Support" <${process.env.EMAIL_USER}>`,
              to: customerEmail,
              subject: `Ticket Created: ${ticketKey} - ${subject}`,
              html: await renderEmailTemplate('create_ticket_new_customer', {
                name: `${firstName} ${lastName}`,
                uid: ticketKey,
                title: subject,
                status: (ticket.status || 'new').toUpperCase(),
                button_url: `${process.env.FRONTEND_URL}/tickets/${ticketId}`,
                button_text: 'View Ticket',
                sender_name: 'HelpDesk Support Team'
              })
            };

            await transporter.sendMail(ticketNotification);
            console.log(`Ticket notification sent to existing user: ${customerEmail}`);
          } catch (emailError) {
            console.error(`Failed to send ticket notification to ${customerEmail}:`, emailError.message);
            // Don't fail the import if email fails
          }
        }

        // Send assignment notification to staff member
        if (assignedTo && transporter && process.env.EMAIL_USER) {
          try {
            const [staffInfo] = await db.execute(
              'SELECT first_name, last_name, email FROM users WHERE id = ?',
              [assignedTo]
            );

            if (staffInfo.length > 0) {
              const staff = staffInfo[0];
              const assignmentEmail = {
                from: `"HelpDesk Support" <${process.env.EMAIL_USER}>`,
                to: staff.email,
                subject: `New Ticket Assigned: ${ticketKey} - ${subject}`,
                html: await renderEmailTemplate('assigned_ticket', {
                  name: `${staff.first_name} ${staff.last_name}`,
                  uid: ticketKey,
                  title: subject,
                  priority: (ticket.priority || 'medium').toUpperCase(),
                  button_url: `${process.env.FRONTEND_URL}/tickets/${ticketId}`,
                  button_text: 'View Ticket',
                  sender_name: 'HelpDesk Support Team'
                })
              };

              const emailResult = await transporter.sendMail(assignmentEmail);
              console.log(` Assignment notification sent to staff: ${staff.email}`);
              console.log(`    Email details - MessageID: ${emailResult.messageId}, Response: ${emailResult.response}`);
            }
          } catch (emailError) {
            console.error(`Failed to send assignment notification:`, emailError.message);
            // Don't fail the import if email fails
          }
        }

        imported++;
      } catch (e) {
        console.error('Bulk insert ticket error:', e);
        failed++;
        errors.push({
          message: e.message,
          data: ticket
        });
      }
    }

    return res.json({
      success: failed === 0,
      imported,
      failed,
      errors,
      warnings: []
    });
  } catch (error) {
    console.error('Bulk create tickets error:', error);
    return res.status(500).json({
      success: false,
      imported: 0,
      failed: 0,
      errors: [{
        message: 'Internal server error'
      }],
      warnings: []
    });
  }
});

// Import tickets via file upload (CSV or JSON)
app.post('/api/tickets/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          message: 'No file uploaded'
        }],
        warnings: []
      });
    }

    const buffer = req.file.buffer;
    const content = buffer.toString('utf-8');
    const filename = (req.file.originalname || '').toLowerCase();

    let rows = [];
    if (filename.endsWith('.json') || req.file.mimetype === 'application/json') {
      try {
        const parsed = JSON.parse(content);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return res.status(400).json({
          success: false,
          imported: 0,
          failed: 0,
          errors: [{
            message: 'Invalid JSON file'
          }],
          warnings: []
        });
      }
    } else {
      // Parse CSV
      const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          imported: 0,
          failed: 0,
          errors: [{
            message: 'CSV has no data'
          }],
          warnings: []
        });
      }
      const headers = lines[0].split(',').map(h => h.replace(/^\"|\"$/g, '').trim());
      rows = lines.slice(1).map(line => {
        const values = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            values.push(cur);
            cur = '';
          } else {
            cur += ch;
          }
        }
        values.push(cur);
        const obj = {};
        headers.forEach((h, idx) => obj[h] = (values[idx] || '').replace(/^\"|\"$/g, ''));
        return obj;
      });
    }

    // Reuse bulk endpoint logic by calling DB directly here
    let imported = 0;
    let failed = 0;
    const errors = [];

    for (const row of rows) {
      try {
        const subject = (row.subject || '').toString().trim();
        const description = (row.description || '').toString().trim();
        const customerEmail = (row.customerEmail || row.email || '').toString().trim().toLowerCase();
        if (!subject || !description || !customerEmail) {
          failed++;
          errors.push({
            message: 'Missing required fields (subject, description, customerEmail)',
            data: row
          });
          continue;
        }

        // Ensure user exists
        let userId = null;
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [customerEmail]);
        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
        } else {
          const fullName = (row.customerName || '').toString().trim();
          const [firstName, ...rest] = fullName.split(' ');
          const lastName = rest.join(' ') || '-';
          const [userInsert] = await db.execute(
            'INSERT INTO users (first_name, last_name, email, role) VALUES (?, ?, ?, ?)',
            [firstName || '-', lastName, customerEmail, 'customer']
          );
          userId = userInsert.insertId;
        }

        const now = new Date();
        await db.execute(
          `INSERT INTO tickets (user_id, subject, description, type, department, priority, status, created_at, updated_at, resolution_comment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            subject,
            row.type || 'General',
            row.department || 'Support',
            (row.priority || 'medium').toLowerCase(),
            (row.status || 'new').toLowerCase(),
            now,
            now,
            row.resolution_comment || null
          ]
        );

        imported++;
      } catch (e) {
        console.error('Import ticket row error:', e);
        failed++;
        errors.push({
          message: e.message,
          data: row
        });
      }
    }

    return res.json({
      success: failed === 0,
      imported,
      failed,
      errors,
      warnings: []
    });
  } catch (error) {
    console.error('Import tickets error:', error);
    return res.status(500).json({
      success: false,
      imported: 0,
      failed: 0,
      errors: [{
        message: 'Internal server error'
      }],
      warnings: []
    });
  }
});

// Get ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [ticket] = await db.execute(`
      SELECT 
        t.id,
        CONCAT('#', LPAD(t.id, 6, '0')) as \`key\`,
        t.subject,
        t.description,
        COALESCE(tt.name, t.type) as type,
        COALESCE(d.name, t.department) as department,
        t.priority,
        t.status,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        u.email as customerEmail,
        t.assigned_to as assignedTo,
        assigned_user.first_name as assignedToName,
        DATE_FORMAT(t.created_at, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(t.updated_at, '%Y-%m-%dT%H:%i:%s') as updatedAt
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN ticket_types tt ON t.type = tt.id OR t.type = tt.name
      LEFT JOIN departments d ON t.department = d.id OR t.department = d.name
      WHERE t.id = ?
    `, [id]);

    if (ticket.length === 0) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    res.json(ticket[0]);
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// ==================== TICKET NOTES API ====================

// Get notes for a ticket
app.get('/api/tickets/:ticketId/notes', async (req, res) => {
  try {
    const {
      ticketId
    } = req.params;
    const userRole = req.user?.role || 'customer'; // Assuming you have auth middleware

    // Only return internal notes to staff/admin
    let query = `
      SELECT 
        tn.id,
        tn.ticket_id,
        tn.note,
        tn.is_internal,
        tn.created_at,
        tn.updated_at,
        u.id as user_id,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.role as author_role
      FROM ticket_notes tn
      LEFT JOIN users u ON tn.user_id = u.id
      WHERE tn.ticket_id = ?
    `;

    // Customers can only see non-internal notes (if any)
    if (userRole === 'customer') {
      query += ' AND tn.is_internal = FALSE';
    }

    query += ' ORDER BY tn.created_at DESC';

    const [notes] = await db.execute(query, [ticketId]);
    res.json(notes);
  } catch (error) {
    console.error(' Error fetching ticket notes:', error);
    res.status(500).json({
      error: 'Failed to fetch notes'
    });
  }
});

// Add a note to a ticket
app.post('/api/tickets/:ticketId/notes', async (req, res) => {
  try {
    const {
      ticketId
    } = req.params;
    const {
      note,
      is_internal = true
    } = req.body;
    const userId = req.user?.id || 1; // Get from auth middleware

    if (!note || !note.trim()) {
      return res.status(400).json({
        error: 'Note content is required'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO ticket_notes (ticket_id, user_id, note, is_internal) VALUES (?, ?, ?, ?)',
      [ticketId, userId, note.trim(), is_internal]
    );

    // Get the created note with user info
    const [createdNote] = await db.execute(`
      SELECT 
        tn.id,
        tn.ticket_id,
        tn.note,
        tn.is_internal,
        tn.created_at,
        tn.updated_at,
        u.id as user_id,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.role as author_role
      FROM ticket_notes tn
      LEFT JOIN users u ON tn.user_id = u.id
      WHERE tn.id = ?
    `, [result.insertId]);

    console.log(' Note added to ticket:', ticketId);

    // Send email notification for new ticket note (if not internal)
    if (transporter && !is_internal) {
      try {
        // Get ticket and customer info
        const [ticketInfo] = await db.execute(`
          SELECT t.*, u.email as customerEmail, u.first_name as customerFirstName, u.last_name as customerLastName
          FROM tickets t
          LEFT JOIN users u ON t.user_id = u.id
          WHERE t.id = ?
        `, [ticketId]);

        if (ticketInfo.length > 0) {
          const ticket = ticketInfo[0];
          const htmlContent = await renderEmailTemplate('ticket_new_comment', {
            name: `${ticket.customerFirstName} ${ticket.customerLastName}`,
            ticket_id: ticketId,
            ticket_subject: ticket.subject,
            note_content: note.trim(),
            author_name: createdNote[0].author_name,
            author_role: createdNote[0].author_role,
            button_url: `${process.env.FRONTEND_URL}/tickets/${ticketId}`,
            button_text: 'View Ticket',
            sender_name: 'HelpDesk Support Team'
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ticket.customerEmail,
            subject: `New Comment on Ticket #${String(ticketId).padStart(6, '0')} - ${ticket.subject}`,
            html: htmlContent
          };

          await transporter.sendMail(mailOptions);
          console.log(' Comment notification sent to customer:', ticket.customerEmail);
        }
      } catch (emailError) {
        console.error(' Failed to send comment notification:', emailError.message);
      }
    }

    res.status(201).json(createdNote[0]);
  } catch (error) {
    console.error(' Error adding note:', error);
    res.status(500).json({
      error: 'Failed to add note'
    });
  }
});

// Delete a note
app.delete('/api/tickets/:ticketId/notes/:noteId', async (req, res) => {
  try {
    const {
      noteId
    } = req.params;
    const userId = req.user?.id || 1;
    const userRole = req.user?.role || 'staff';

    // Check if note exists and user has permission
    const [note] = await db.execute('SELECT * FROM ticket_notes WHERE id = ?', [noteId]);

    if (note.length === 0) {
      return res.status(404).json({
        error: 'Note not found'
      });
    }

    // Only allow deletion by note author or admin
    if (note[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Not authorized to delete this note'
      });
    }

    await db.execute('DELETE FROM ticket_notes WHERE id = ?', [noteId]);
    console.log(' Note deleted:', noteId);
    res.json({
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error(' Error deleting note:', error);
    res.status(500).json({
      error: 'Failed to delete note'
    });
  }
});

// Enhanced Dashboard Statistics
app.get('/api/dashboard/ticket-stats', async (req, res) => {
  try {
    // Get comprehensive ticket statistics
    const [ticketStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_tickets,
        COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) as new_tickets,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open_tickets,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_tickets,
        COALESCE(SUM(CASE WHEN status = 'pending_assignment' THEN 1 ELSE 0 END), 0) as pending_assignment_tickets,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved_tickets,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) as closed_tickets,
        COALESCE(SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END), 0) as urgent_tickets,
        COALESCE(SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END), 0) as high_priority_tickets,
        COALESCE(SUM(CASE WHEN assigned_to IS NOT NULL AND status IN ('open', 'in_progress') THEN 1 ELSE 0 END), 0) as assigned_active_tickets,
        COALESCE(SUM(CASE WHEN assigned_to IS NULL AND status = 'new' THEN 1 ELSE 0 END), 0) as unassigned_tickets
      FROM tickets
    `);

    // Get tickets created today
    const [todayStats] = await db.execute(`
      SELECT 
        COUNT(*) as tickets_today,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved_today,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) as closed_today
      FROM tickets 
      WHERE DATE(created_at) = CURDATE()
    `);

    // Get average resolution time (in hours)
    const [resolutionStats] = await db.execute(`
      SELECT 
        COALESCE(AVG(CASE WHEN status IN ('resolved', 'closed') THEN 
          TIMESTAMPDIFF(HOUR, created_at, updated_at) 
        END), 0) as avg_resolution_hours
      FROM tickets
    `);

    // Get staff count
    const [staffStats] = await db.execute(`
      SELECT COUNT(*) as active_staff
      FROM users 
      WHERE role IN ('staff', 'admin')
    `);

    const result = {
      // Core ticket counts
      total_tickets: ticketStats[0].total_tickets,
      new_tickets: ticketStats[0].new_tickets,
      open_tickets: ticketStats[0].open_tickets,
      in_progress_tickets: ticketStats[0].in_progress_tickets,
      pending_assignment_tickets: ticketStats[0].pending_assignment_tickets,
      resolved_tickets: ticketStats[0].resolved_tickets,
      closed_tickets: ticketStats[0].closed_tickets,

      // Priority breakdown
      urgent_tickets: ticketStats[0].urgent_tickets,
      high_priority_tickets: ticketStats[0].high_priority_tickets,

      // Assignment status
      assigned_active_tickets: ticketStats[0].assigned_active_tickets,
      unassigned_tickets: ticketStats[0].unassigned_tickets,

      // Today's activity
      tickets_today: todayStats[0].tickets_today,
      resolved_today: todayStats[0].resolved_today,
      closed_today: todayStats[0].closed_today,

      // Performance metrics
      avg_resolution_hours: Math.round(resolutionStats[0].avg_resolution_hours * 10) / 10,

      // Staff metrics
      active_staff: staffStats[0].active_staff,

      // Calculated percentages
      resolution_rate: ticketStats[0].total_tickets > 0 ?
        Math.round(((ticketStats[0].resolved_tickets + ticketStats[0].closed_tickets) / ticketStats[0].total_tickets) * 100) : 0,

      assignment_rate: ticketStats[0].total_tickets > 0 ?
        Math.round(((ticketStats[0].total_tickets - ticketStats[0].unassigned_tickets) / ticketStats[0].total_tickets) * 100) : 0
    };

    console.log(' Enhanced Dashboard Stats:', result);
    res.json(result);

  } catch (error) {
    console.error(' Dashboard ticket stats error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard ticket statistics',
      details: error.message
    });
  }
});

// Phase 2: Worker monitoring and control endpoints
app.get('/api/worker/stats', async (req, res) => {
  try {
    // Check if auto-assignment is enabled
    const [autoAssignSetting] = await db.execute(`
      SELECT value FROM system_settings WHERE \`key\` = 'auto_assign_tickets'
    `);
    const autoAssignEnabled = autoAssignSetting.length > 0 && autoAssignSetting[0].value === 'true';

    const stats = deferredAssignmentWorker.getStats();
    res.json({
      success: true,
      worker: {
        ...stats,
        autoAssignmentEnabled: autoAssignEnabled
      }
    });
  } catch (error) {
    console.error(' Worker stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get worker statistics'
    });
  }
});

app.post('/api/worker/trigger', async (req, res) => {
  try {
    // Check if auto-assignment is enabled
    const [autoAssignSetting] = await db.execute(`
      SELECT value FROM system_settings WHERE \`key\` = 'auto_assign_tickets'
    `);
    const autoAssignEnabled = autoAssignSetting.length > 0 && autoAssignSetting[0].value === 'true';

    if (!autoAssignEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Auto-assignment is disabled. Worker cannot be triggered.'
      });
    }

    console.log('🔄 [API] Manual worker trigger requested');
    await deferredAssignmentWorker.processQueue();
    res.json({
      success: true,
      message: 'Worker processing triggered successfully'
    });
  } catch (error) {
    console.error(' Worker trigger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger worker'
    });
  }
});

// Real-time ticket status summary
app.get('/api/dashboard/status-summary', async (req, res) => {
  try {
    const [statusData] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tickets)), 1) as percentage
      FROM tickets 
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'new' THEN 1
          WHEN 'open' THEN 2
          WHEN 'in_progress' THEN 3
          WHEN 'resolved' THEN 4
          WHEN 'closed' THEN 5
          ELSE 6
        END
    `);

    res.json(statusData);
  } catch (error) {
    console.error(' Status summary error:', error);
    res.status(500).json({
      error: 'Failed to load status summary'
    });
  }
});

// Priority breakdown
app.get('/api/dashboard/priority-breakdown', async (req, res) => {
  try {
    const [priorityData] = await db.execute(`
      SELECT 
        priority,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END), 0) as active_count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tickets)), 1) as percentage
      FROM tickets 
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END
    `);

    res.json(priorityData);
  } catch (error) {
    console.error(' Priority breakdown error:', error);
    res.status(500).json({
      error: 'Failed to load priority breakdown'
    });
  }
});

// Dashboard routes
app.get('/api/dashboard/tickets-by-department', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        department, 
        COUNT(*) as total_tickets,
        COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) as new_tickets,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open_tickets,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_tickets,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved_tickets,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) as closed_tickets,
        COALESCE(SUM(CASE WHEN assigned_to IS NOT NULL THEN 1 ELSE 0 END), 0) as assigned_tickets,
        ROUND(AVG(CASE WHEN status IN ('resolved', 'closed') THEN 
          TIMESTAMPDIFF(HOUR, created_at, updated_at) 
        END), 1) as avg_resolution_hours
      FROM tickets 
      GROUP BY department 
      ORDER BY total_tickets DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(' Tickets by department error:', err);
    res.status(500).json({
      error: 'Failed to load tickets by department'
    });
  }
});

app.get('/api/dashboard/tickets-by-type', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT type, COUNT(*) as count 
      FROM tickets 
      GROUP BY type 
      ORDER BY count DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(' Tickets by type error:', err);
    res.status(500).json({
      error: 'Failed to load tickets by type'
    });
  }
});

app.get('/api/dashboard/top-creators', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        CONCAT(u.first_name, ' ', u.last_name) as creator,
        COUNT(t.id) as tickets_created
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      GROUP BY t.user_id, u.first_name, u.last_name
      ORDER BY tickets_created DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    console.error(' Top creators error:', err);
    res.status(500).json({
      error: 'Failed to load top creators'
    });
  }
});

app.get('/api/dashboard/ticket-history', async (req, res) => {
  try {
    // Get ticket counts by month for the last 12 months
    const [rows] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM tickets 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    console.log(' Ticket history data:', rows);
    res.json(rows);

  } catch (error) {
    console.error(' Ticket history error:', error);
    res.status(500).json({
      error: 'Failed to load ticket history',
      details: error.message
    });
  }
});

app.get('/api/dashboard/crm-stats', async (req, res) => {
  try {
    // Updated to use unified user system
    const [customerRows] = await db.execute('SELECT COUNT(*) as active_customers FROM users WHERE role = "customer"');
    const [contactRows] = await db.execute('SELECT COUNT(*) as total_contacts FROM users WHERE role IN ("admin", "staff")');
    const [organizationRows] = await db.execute('SELECT COUNT(*) as total_organizations FROM organizations WHERE status = "active"');
    const [userRows] = await db.execute('SELECT COUNT(*) as total_users FROM users');
    const [departmentRows] = await db.execute('SELECT COUNT(*) as total_departments FROM departments WHERE status = "active"');

    console.log(' Updated CRM Stats:');
    console.log('� Customers (role=customer):', customerRows[0].active_customers);
    console.log('� Contacts (role=admin/staff):', contactRows[0].total_contacts);
    console.log('� Organizations:', organizationRows[0].total_organizations);
    console.log('� Total Users:', userRows[0].total_users);
    console.log('� Departments:', departmentRows[0].total_departments);

    res.json({
      active_customers: customerRows[0].active_customers,
      total_contacts: contactRows[0].total_contacts,
      total_organizations: organizationRows[0].total_organizations,
      total_users: userRows[0].total_users,
      total_departments: departmentRows[0].total_departments
    });
  } catch (err) {
    console.error(' CRM stats error:', err);
    res.status(500).json({
      error: 'Failed to load CRM stats'
    });
  }
});

// CRUD Routes for Customers
app.get('/api/customers', async (req, res) => {
  console.log('� Customers API called with params:', req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    console.log(' Customers query params:', {
      page,
      limit,
      search,
      offset
    });

    let whereClause = 'WHERE u.role = ?';
    let queryParams = ['customer'];

    if (search) {
      whereClause = 'WHERE u.role = ? AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.city LIKE ?)';
      queryParams = ['customer', `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    console.log(' Customers where clause:', whereClause);
    console.log(' Customers query params:', queryParams);

    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    console.log(' Customers count query:', countQuery);

    const [countResult] = await db.execute(countQuery, queryParams);
    console.log(' Customers count result:', countResult);
    const total = countResult[0].total;

    const customersQuery = `
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.phone,
        u.city,
        u.created_at as createdAt
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    console.log(' Customers main query:', customersQuery);
    const [customers] = await db.execute(customersQuery, queryParams);
    console.log(' Customers fetched:', customers.length);

    res.json({
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('� Error fetching customers:', error);
    console.error('� Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

app.post('/api/customers', async (req, res) => {
  console.log('� Creating customer with data:', req.body);
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      address,
      country,
      photo,
      password = 'defaultpassword123'
    } = req.body;

    console.log(' Parsed customer data:', {
      firstName,
      lastName,
      email,
      phone,
      city,
      address,
      country,
      photo
    });

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'First name, last name, and email are required'
      });
    }

    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Hash the password using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (first_name, last_name, email, phone, city, address, country, photo, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'customer', NOW(), NOW())
    `;

    console.log(' Executing user insert query for customer...');
    const [result] = await db.execute(query, [firstName, lastName, email, phone || null, city || null, address || null, country || null, photo || null, hashedPassword]);

    console.log(' Customer created as user with ID:', result.insertId);
    console.log('� Customer will appear in both Customers and Manage Users sections!');

    const [newCustomer] = await db.execute(`
      SELECT 
        id,
        first_name as firstName,
        last_name as lastName,
        email,
        phone,
        city,
        address,
        country,
        photo,
        role,
        'active' as status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users WHERE id = ?`, [result.insertId]);

    console.log(' Customer created successfully with role=customer:', newCustomer[0]);
    console.log('� Real-time sync: Customer now available in Manage Users!');
    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('� Error creating customer:', error);
    console.error('� Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to create customer',
      details: error.message
    });
  }
});

// Get customer stats (must be before :id route)
app.get('/api/customers/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) as active,
        0 as inactive,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as newThisMonth
      FROM users WHERE role = 'customer'
    `;

    const [stats] = await db.execute(statsQuery);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      error: 'Failed to fetch customer statistics'
    });
  }
});

// Get customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [customer] = await db.execute(`
      SELECT 
        id,
        first_name as firstName,
        last_name as lastName,
        email,
        phone,
        city,
        address,
        country,
        role,
        'active' as status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users WHERE id = ? AND role = 'customer'`, [id]);

    if (customer.length === 0) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }

    res.json(customer[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      error: 'Failed to fetch customer'
    });
  }
});

// Update customer
app.patch('/api/customers/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      address,
      country
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'First name, last name, and email are required'
      });
    }

    // Check if customer exists and has role 'customer'
    const [existing] = await db.execute('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'customer']);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }

    // Check if email is already taken by another user
    const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existingEmail.length > 0) {
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    const query = `
      UPDATE users SET 
        first_name = ?, last_name = ?, email = ?, phone = ?, city = ?, address = ?, country = ?, updated_at = NOW()
      WHERE id = ? AND role = 'customer'
    `;

    await db.execute(query, [firstName, lastName, email, phone, city, address, country, id]);

    const [updatedCustomer] = await db.execute(`
      SELECT 
        id,
        first_name as firstName,
        last_name as lastName,
        email,
        phone,
        city,
        address,
        country,
        role,
        'active' as status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users WHERE id = ?`, [id]);

    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      error: 'Failed to update customer'
    });
  }
});

// CRUD Routes for Contacts
app.get('/api/contacts', async (req, res) => {
  console.log('� Contacts API called with params:', req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE u.role IN (?, ?)';
    let queryParams = ['admin', 'staff'];

    if (search) {
      whereClause = 'WHERE u.role IN (?, ?) AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.city LIKE ? OR d.name LIKE ?)';
      queryParams = ['admin', 'staff', `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    console.log(' Contacts where clause:', whereClause);
    console.log(' Contacts query params:', queryParams);

    const countQuery = `SELECT COUNT(*) as total FROM users u LEFT JOIN departments d ON u.department_id = d.id ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    const contactsQuery = `
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.phone,
        u.role as jobTitle,
        d.name as department,
        u.city,
        u.country,
        u.address,
        u.role,
        'active' as status,
        'email' as preferredContactMethod,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        d.name as departmentName
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    console.log(' Contacts main query:', contactsQuery);
    const [contacts] = await db.execute(contactsQuery, queryParams);

    console.log('� Contacts query result:', {
      total,
      contactsCount: contacts.length
    });

    res.json({
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      error: 'Failed to fetch contacts'
    });
  }
});

// Test endpoint to verify server is working
app.get('/api/test-server', (req, res) => {
  console.log('🧪 Test endpoint hit - server is working');
  res.json({
    message: 'Server is working',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

// Test endpoint to check users and roles
app.get('/api/test-users', async (req, res) => {
  try {
    console.log('🧪 Testing users table...');

    const [users] = await db.execute(`
      SELECT id, first_name, last_name, email, role, 
             created_at, updated_at 
      FROM users 
      ORDER BY role, first_name
    `);

    const roleStats = {
      admin: users.filter(u => u.role === 'admin').length,
      staff: users.filter(u => u.role === 'staff').length,
      customer: users.filter(u => u.role === 'customer').length
    };

    console.log(' Users found:', users.length, 'Role stats:', roleStats);

    res.json({
      message: 'Users table working',
      totalUsers: users.length,
      roleStats,
      users: users.map(u => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        role: u.role
      }))
    });
  } catch (error) {
    console.error(' Users test error:', error);
    res.status(500).json({
      error: 'Users table issue',
      details: error.message
    });
  }
});

// Test endpoint to verify server is working
app.get('/api/test-server', (req, res) => {
  console.log('🧪 Test endpoint hit - server is working');
  res.json({
    message: 'Server is working',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

// Test organizations table
app.get('/api/test-organizations-table', async (req, res) => {
  try {
    console.log('🧪 Testing organizations table...');

    // Test 1: Check if table exists
    const [tableCheck] = await db.execute("SHOW TABLES LIKE 'organizations'");
    console.log(' Table exists check:', tableCheck);

    if (tableCheck.length === 0) {
      return res.status(404).json({
        error: 'Organizations table does not exist',
        suggestion: 'Run database setup to create tables'
      });
    }

    // Test 2: Check table structure
    const [structure] = await db.execute('DESCRIBE organizations');
    console.log(' Organizations table structure:', structure);

    // Test 3: Count records
    const [count] = await db.execute('SELECT COUNT(*) as total FROM organizations');
    console.log(' Organizations count:', count[0].total);

    // Test 4: Get sample records
    const [sample] = await db.execute('SELECT * FROM organizations LIMIT 3');
    console.log(' Sample organizations:', sample);

    res.json({
      message: 'Organizations table is working',
      tableExists: true,
      structure: structure,
      totalRecords: count[0].total,
      sampleRecords: sample
    });
  } catch (error) {
    console.error(' Organizations table error:', error);
    res.status(500).json({
      error: 'Organizations table issue',
      details: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  }
});

// Create organizations table if it doesn't exist (GET version for easy testing)
app.get('/api/setup-organizations-table', async (req, res) => {
  try {
    console.log(' Setting up organizations table...');

    // Get current table structure
    const [currentStructure] = await db.execute('DESCRIBE organizations');
    const existingColumns = currentStructure.map(col => col.Field);
    console.log(' Existing columns:', existingColumns);

    // Define columns we need
    const requiredColumns = {
      phone: "VARCHAR(50)",
      email: "VARCHAR(255)",
      website: "VARCHAR(255)",
      address: "TEXT",
      status: "ENUM('active', 'inactive') DEFAULT 'active'"
    };

    // Add missing columns one by one
    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      if (!existingColumns.includes(columnName)) {
        try {
          const alterQuery = `ALTER TABLE organizations ADD COLUMN ${columnName} ${columnDef}`;
          await db.execute(alterQuery);
          console.log(` Added column: ${columnName}`);
        } catch (error) {
          console.error(` Error adding column ${columnName}:`, error.message);
        }
      } else {
        console.log(`⏭ Column ${columnName} already exists`);
      }
    }

    // Insert sample organization if none exist
    const [count] = await db.execute('SELECT COUNT(*) as total FROM organizations');
    if (count[0].total === 0) {
      const insertSampleQuery = `
        INSERT INTO organizations (name, description, email, status) 
        VALUES ('Default Organization', 'Default organization for contacts', 'admin@company.com', 'active')
      `;

      await db.execute(insertSampleQuery);
      console.log(' Sample organization inserted');
    }

    // Verify final structure
    const [finalStructure] = await db.execute('DESCRIBE organizations');
    console.log(' Final table structure:', finalStructure);

    res.json({
      success: true,
      message: 'Organizations table setup completed successfully',
      tableUpdated: true,
      finalStructure: finalStructure
    });

  } catch (error) {
    console.error(' Error setting up organizations table:', error);
    res.status(500).json({
      error: 'Failed to setup organizations table',
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// Create organizations table if it doesn't exist
app.post('/api/setup-organizations-table', async (req, res) => {
  try {
    console.log(' Setting up organizations table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS organizations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await db.execute(createTableQuery);
    console.log(' Organizations table created successfully');

    // Insert sample organization
    const insertSampleQuery = `
      INSERT IGNORE INTO organizations (name, description, email, status) 
      VALUES ('Default Organization', 'Default organization for contacts', 'admin@company.com', 'active')
    `;

    await db.execute(insertSampleQuery);
    console.log(' Sample organization inserted');

    res.json({
      success: true,
      message: 'Organizations table setup completed successfully',
      tableCreated: true
    });

  } catch (error) {
    console.error(' Error setting up organizations table:', error);
    res.status(500).json({
      error: 'Failed to setup organizations table',
      details: error.message
    });
  }
});

// Test customers table
app.get('/api/test-customers-table', async (req, res) => {
  try {
    console.log('🧪 Testing customers table...');

    // Test 1: Check if table exists
    const [tableCheck] = await db.execute("SHOW TABLES LIKE 'customers'");
    console.log(' Customers table exists check:', tableCheck);

    if (tableCheck.length === 0) {
      return res.status(404).json({
        error: 'Customers table does not exist',
        suggestion: 'Run database setup to create tables'
      });
    }

    // Test 2: Check table structure
    const [structure] = await db.execute('DESCRIBE customers');
    console.log(' Customers table structure:', structure);

    // Test 3: Count records
    const [count] = await db.execute('SELECT COUNT(*) as total FROM customers');
    console.log(' Customers count:', count[0].total);

    // Test 4: Get sample records
    const [sample] = await db.execute('SELECT * FROM customers LIMIT 3');
    console.log(' Sample customers:', sample);

    res.json({
      message: 'Customers table is working',
      tableExists: true,
      structure: structure,
      totalRecords: count[0].total,
      sampleRecords: sample
    });
  } catch (error) {
    console.error(' Customers table error:', error);
    res.status(500).json({
      error: 'Customers table issue',
      details: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  }
});

// Setup customers table
app.get('/api/setup-customers-table', async (req, res) => {
  try {
    console.log(' Setting up customers table...');

    // Get current table structure if it exists
    try {
      const [currentStructure] = await db.execute('DESCRIBE customers');
      const existingColumns = currentStructure.map(col => col.Field);
      console.log(' Existing customers columns:', existingColumns);

      // Insert sample customer if none exist
      const [count] = await db.execute('SELECT COUNT(*) as total FROM customers');
      if (count[0].total === 0) {
        const insertSampleQuery = `
          INSERT INTO customers (first_name, last_name, email, phone, company, status) 
          VALUES ('John', 'Doe', 'john.doe@example.com', '+1234567890', 'Sample Company', 'active')
        `;

        await db.execute(insertSampleQuery);
        console.log(' Sample customer inserted');
      }

      res.json({
        success: true,
        message: 'Customers table setup completed successfully',
        tableExists: true,
        structure: currentStructure
      });

    } catch (error) {
      // Table might not exist, create it
      console.log(' Creating customers table...');

      const createTableQuery = `
        CREATE TABLE customers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(50),
          company VARCHAR(255),
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;

      await db.execute(createTableQuery);
      console.log(' Customers table created successfully');

      // Insert sample customer
      const insertSampleQuery = `
        INSERT INTO customers (first_name, last_name, email, phone, company, status) 
        VALUES ('John', 'Doe', 'john.doe@example.com', '+1234567890', 'Sample Company', 'active')
      `;

      await db.execute(insertSampleQuery);
      console.log(' Sample customer inserted');

      res.json({
        success: true,
        message: 'Customers table created and setup completed successfully',
        tableCreated: true
      });
    }

  } catch (error) {
    console.error(' Error setting up customers table:', error);
    res.status(500).json({
      error: 'Failed to setup customers table',
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// Contact creation endpoint with enhanced debugging
app.post('/api/contacts', async (req, res) => {
  console.log(' === CONTACT CREATION ENDPOINT HIT ===');
  console.log(' Request method:', req.method);
  console.log(' Request URL:', req.url);
  console.log(' Raw request body:', req.body);

  try {
    console.log(' Contact creation request received:', req.body);

    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department, // This is the department NAME from dropdown
      city,
      country,
      address,
      password = 'defaultpassword123'
    } = req.body;

    console.log(' Parsed contact data:', {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department,
      city,
      country,
      address
    });

    if (!firstName || !lastName || !email) {
      console.log(' Missing required fields');
      return res.status(400).json({
        error: 'First name, last name, and email are required'
      });
    }

    if (!department) {
      console.log(' Department is required for contacts');
      return res.status(400).json({
        error: 'Department is required for internal contacts'
      });
    }

    console.log(' Checking for existing user with email:', email);
    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      console.log(' User already exists with email:', email);
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    //  SMART ROLE ASSIGNMENT LOGIC
    let role;
    let departmentId = null;

    console.log('🧠 Determining role based on department:', department);

    if (department === 'Admin') {
      role = 'admin';
      console.log(' Department is Admin -> Setting role to admin');

      // Get Admin department ID
      const [adminDept] = await db.execute('SELECT id FROM departments WHERE name = ?', ['Admin']);
      if (adminDept.length > 0) {
        departmentId = adminDept[0].id;
        console.log(' Found Admin department with ID:', departmentId);
      }
    } else {
      role = 'staff';
      console.log(' Department is not Admin -> Setting role to staff');

      // Get the selected department ID
      const [selectedDept] = await db.execute('SELECT id FROM departments WHERE name = ?', [department]);
      if (selectedDept.length > 0) {
        departmentId = selectedDept[0].id;
        console.log(' Found selected department with ID:', departmentId);
      } else {
        console.log(' Department not found:', department);
        return res.status(400).json({
          error: `Department '${department}' not found`
        });
      }
    }

    console.log(' Final role assignment:', {
      role,
      departmentId,
      department
    });

    // Hash the password using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(' Inserting new user as contact...');
    const query = `
      INSERT INTO users (
        first_name, last_name, email, phone, role, department_id,
        city, country, address, password, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const insertValues = [
      firstName, lastName, email, phone || null, role, departmentId,
      city || null, country || null, address || null, hashedPassword
    ];

    console.log(' Insert values:', insertValues);

    const [result] = await db.execute(query, insertValues);
    console.log(' Contact created as user with ID:', result.insertId);

    console.log(' Fetching created contact...');
    const [newContact] = await db.execute(`
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.phone,
        u.role as jobTitle,
        d.name as department,
        u.city,
        u.country,
        u.address,
        u.role,
        'active' as status,
        'email' as preferredContactMethod,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        d.name as departmentName
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?`, [result.insertId]);

    console.log(' Contact created successfully with smart role assignment:', newContact[0]);
    console.log('� Role assigned:', role, '| Department:', department, '| Will appear in Manage Users!');

    res.status(201).json(newContact[0]);
  } catch (error) {
    console.error('� === CRITICAL ERROR IN CONTACT CREATION ===');
    console.error('� Error message:', error.message);
    console.error('� Error stack:', error.stack);
    console.error(' Error creating contact:', error);
    res.status(500).json({
      error: 'Failed to create contact',
      details: error.message
    });
  }
});

// Get contact stats (must be before :id route)
app.get('/api/contacts/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) as active,
        0 as inactive,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as newThisMonth
      FROM users WHERE role IN ('admin', 'staff')
    `;

    const [stats] = await db.execute(statsQuery);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({
      error: 'Failed to fetch contact statistics'
    });
  }
});

// Get contact by ID
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [contact] = await db.execute(`
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.phone,
        u.role as jobTitle,
        d.name as department,
        u.city,
        u.country,
        u.address,
        u.role,
        'active' as status,
        'email' as preferredContactMethod,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        d.name as departmentName
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.role IN ('admin', 'staff')`, [id]);

    if (contact.length === 0) {
      return res.status(404).json({
        error: 'Contact not found'
      });
    }

    res.json(contact[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      error: 'Failed to fetch contact'
    });
  }
});

// Update contact
app.patch('/api/contacts/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      address,
      country,
      department // Support department changes
    } = req.body;

    console.log('� Updating contact ID:', id, 'with data:', req.body);
    console.log(' Extracted fields:', {
      firstName,
      lastName,
      email,
      phone,
      city,
      address,
      country,
      department
    });

    // Validate and sanitize all inputs
    const sanitizedFirstName = firstName ? String(firstName).trim() : null;
    const sanitizedLastName = lastName ? String(lastName).trim() : null;
    const sanitizedEmail = email ? String(email).trim() : null;

    if (!sanitizedFirstName || !sanitizedLastName || !sanitizedEmail) {
      console.log(' Validation failed: Missing required fields after sanitization');
      console.log(' sanitizedFirstName:', sanitizedFirstName, 'sanitizedLastName:', sanitizedLastName, 'sanitizedEmail:', sanitizedEmail);
      return res.status(400).json({
        error: 'First name, last name, and email are required'
      });
    }

    // Check if contact exists and has role 'admin' or 'staff'
    console.log(' Checking if contact exists with ID:', id);
    const [existing] = await db.execute('SELECT id, role FROM users WHERE id = ? AND role IN (?, ?)', [id, 'admin', 'staff']);
    if (existing.length === 0) {
      console.log(' Contact not found or not admin/staff role');
      console.log(' Query result:', existing);
      return res.status(404).json({
        error: 'Contact not found'
      });
    }

    const currentRole = existing[0].role;
    console.log(' Current contact role:', currentRole);

    // Check if email is already taken by another user
    console.log(' Checking email uniqueness for:', sanitizedEmail, 'excluding ID:', id);
    const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [sanitizedEmail, id]);
    if (existingEmail.length > 0) {
      console.log(' Email already exists for user ID:', existingEmail[0].id);
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    let departmentId = null;
    let newRole = currentRole; // Keep current role by default

    // Handle department change and role implications
    if (department) {
      console.log('� Processing department change to:', department);

      // Get department ID
      const [dept] = await db.execute('SELECT id FROM departments WHERE name = ?', [department]);
      if (dept.length === 0) {
        return res.status(400).json({
          error: `Department '${department}' not found`
        });
      }

      departmentId = dept[0].id;

      // Apply smart role logic for department changes
      if (department === 'Admin' && currentRole !== 'admin') {
        newRole = 'admin';
        console.log(' Department changed to Admin - promoting to admin role');
      } else if (department !== 'Admin' && currentRole === 'admin') {
        // Prevent demoting admin through department change for security
        console.log(' Admin user cannot be demoted through department change');
        return res.status(400).json({
          error: 'Admin users cannot change departments. Use user management to change roles.'
        });
      } else if (department !== 'Admin' && currentRole === 'staff') {
        // Staff can change between non-admin departments
        newRole = 'staff';
        console.log(' Staff user changing to different department');
      }
    }

    const query = `
      UPDATE users SET 
        first_name = ?, last_name = ?, email = ?, phone = ?, city = ?, address = ?, country = ?, 
        department_id = COALESCE(?, department_id), role = ?, updated_at = NOW()
      WHERE id = ? AND role IN ('admin', 'staff')
    `;

    // Convert undefined to null for database parameters
    const params = [
      sanitizedFirstName,
      sanitizedLastName,
      sanitizedEmail,
      phone || null,
      city || null,
      address || null,
      country || null,
      departmentId || null,
      newRole || null,
      id
    ];

    console.log(' Executing update with params:', params);
    console.log(' Parameter types:', params.map(p => typeof p));
    await db.execute(query, params);

    console.log(' Contact updated with role:', newRole, 'and department ID:', departmentId);

    const [updatedContact] = await db.execute(`
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.phone,
        u.role as jobTitle,
        d.name as department,
        u.city,
        u.country,
        u.address,
        u.role,
        'active' as status,
        'email' as preferredContactMethod,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        d.name as departmentName
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?`, [id]);

    res.json(updatedContact[0]);
  } catch (error) {
    console.error(' Error updating contact:', error);
    res.status(500).json({
      error: 'Failed to update contact',
      details: error.message
    });
  }
});

// CRUD Routes for Organizations
app.get('/api/organizations', async (req, res) => {
  console.log(' Organizations GET request received');
  console.log(' Query params:', req.query);

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    console.log(' Parsed params:', {
      page,
      limit,
      search,
      offset
    });

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = 'WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      queryParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    console.log(' Where clause:', whereClause);
    console.log(' Query params:', queryParams);

    const countQuery = `SELECT COUNT(*) as total FROM organizations ${whereClause}`;
    console.log(' Count query:', countQuery);

    const [countResult] = await db.execute(countQuery, queryParams);
    console.log(' Count result:', countResult);
    const total = countResult[0].total;

    const organizationsQuery = `
      SELECT 
        id,
        name,
        description,
        address,
        phone,
        email,
        website,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM organizations
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [organizations] = await db.execute(organizationsQuery, queryParams);
    console.log(' Organizations fetched:', organizations.length);

    res.json({
      organizations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('� Error fetching organizations:', error);
    console.error('� Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      error: 'Failed to fetch organizations'
    });
  }
});

app.post('/api/organizations', async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      phone,
      email,
      website,
      status = 'active'
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Organization name is required'
      });
    }

    const [existingOrg] = await db.execute('SELECT id FROM organizations WHERE name = ?', [name]);
    if (existingOrg.length > 0) {
      return res.status(400).json({
        error: 'Organization with this name already exists'
      });
    }

    const query = `
      INSERT INTO organizations (
        name, description, address, phone, email, website, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await db.execute(query, [name, description, address, phone, email, website, status]);
    const [newOrganization] = await db.execute(`
      SELECT 
        id,
        name,
        description,
        address,
        phone,
        email,
        website,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM organizations WHERE id = ?`, [result.insertId]);

    res.status(201).json(newOrganization[0]);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      error: 'Failed to create organization'
    });
  }
});

// Get organization stats (must be before :id route)
app.get('/api/organizations/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as newThisMonth
      FROM organizations
    `;

    const [stats] = await db.execute(statsQuery);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({
      error: 'Failed to fetch organization statistics'
    });
  }
});

// Get organization by ID
app.get('/api/organizations/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [organization] = await db.execute(`
      SELECT 
        id,
        name,
        description,
        address,
        phone,
        email,
        website,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM organizations WHERE id = ?`, [id]);

    if (organization.length === 0) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    res.json(organization[0]);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      error: 'Failed to fetch organization'
    });
  }
});

// Update organization
app.patch('/api/organizations/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      name,
      description,
      address,
      phone,
      email,
      website,
      status
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Organization name is required'
      });
    }

    // Check if organization exists
    const [existing] = await db.execute('SELECT id FROM organizations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    // Check if name is already taken by another organization
    const [existingName] = await db.execute('SELECT id FROM organizations WHERE name = ? AND id != ?', [name, id]);
    if (existingName.length > 0) {
      return res.status(400).json({
        error: 'Organization with this name already exists'
      });
    }

    const query = `
      UPDATE organizations SET 
        name = ?, description = ?, address = ?, phone = ?, email = ?, website = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [name, description, address, phone, email, website, status, id]);

    const [updatedOrganization] = await db.execute(`
      SELECT 
        id,
        name,
        description,
        address,
        phone,
        email,
        website,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM organizations WHERE id = ?`, [id]);

    res.json(updatedOrganization[0]);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      error: 'Failed to update organization'
    });
  }
});

// CRUD Routes for Notes
app.get('/api/notes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = 'WHERE n.title LIKE ? OR n.content LIKE ?';
      queryParams = [`%${search}%`, `%${search}%`];
    }

    const countQuery = `SELECT COUNT(*) as total FROM notes n ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    const notesQuery = `
      SELECT 
        n.id,
        n.title,
        n.content,
        n.category,
        n.user_id,
        n.created_at as createdAt,
        n.updated_at as updatedAt,
        CONCAT(u.first_name, ' ', u.last_name) as author_name
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [notes] = await db.execute(notesQuery, queryParams);

    res.json({
      notes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      error: 'Failed to fetch notes'
    });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const {
      title,
      content,
      category = 'general',
      user_id = 1
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }

    const query = `
      INSERT INTO notes (title, content, category, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await db.execute(query, [title, content, category, user_id]);

    const [newNote] = await db.execute(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.category,
        n.user_id,
        n.created_at as createdAt,
        n.updated_at as updatedAt,
        CONCAT(u.first_name, ' ', u.last_name) as author_name
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [result.insertId]);

    res.status(201).json(newNote[0]);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      error: 'Failed to create note'
    });
  }
});

// Get notes stats (must be before :id route)
app.get('/api/notes/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN category = 'general' THEN 1 END) as general,
        COUNT(CASE WHEN category = 'important' THEN 1 END) as important,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as newThisMonth
      FROM notes
    `;

    const [stats] = await db.execute(statsQuery);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching notes stats:', error);
    res.status(500).json({
      error: 'Failed to fetch notes statistics'
    });
  }
});

// Get note by ID
app.get('/api/notes/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [note] = await db.execute(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.category,
        n.user_id,
        n.created_at as createdAt,
        n.updated_at as updatedAt,
        CONCAT(u.first_name, ' ', u.last_name) as author_name
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?`, [id]);

    if (note.length === 0) {
      return res.status(404).json({
        error: 'Note not found'
      });
    }

    res.json(note[0]);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      error: 'Failed to fetch note'
    });
  }
});

// Update note
app.patch('/api/notes/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      title,
      content,
      category,
      priority
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }

    // Check if note exists
    const [existing] = await db.execute('SELECT id FROM notes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Note not found'
      });
    }

    const query = `
      UPDATE notes SET 
        title = ?, content = ?, category = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [title, content, category || 'general', id]);

    const [updatedNote] = await db.execute(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.category,
        n.user_id,
        n.created_at as createdAt,
        n.updated_at as updatedAt,
        CONCAT(u.first_name, ' ', u.last_name) as author_name
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?`, [id]);

    res.json(updatedNote[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      error: 'Failed to update note'
    });
  }
});

// CRUD Routes for Users
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = 'WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.role LIKE ?';
      queryParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    const usersQuery = `
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.role,
        u.department_id as departmentId,
        d.name as departmentName,
        u.phone,
        u.city,
        u.country,
        u.address,
        u.photo,
        u.is_active as isActive,
        u.created_at as createdAt,
        u.updated_at as updatedAt
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [users] = await db.execute(usersQuery, queryParams);

    res.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    console.log(' Create user request received:', {
      body: req.body,
      departmentId: req.body.departmentId,
      role: req.body.role,
      headers: req.headers['content-type']
    });

    const {
      firstName,
      lastName,
      email,
      password,
      role = 'customer',
      departmentId,
      phone,
      city,
      country,
      address
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      console.log(' Validation failed: Missing required fields');
      return res.status(400).json({
        error: 'First name, last name, email, and password are required'
      });
    }

    // Auto-assign department based on role
    let finalDepartmentId = departmentId;

    if (role === 'admin') {
      // Auto-assign admin to Admin department
      const [adminDept] = await db.execute('SELECT id FROM departments WHERE name = "Admin"');
      if (adminDept.length > 0) {
        finalDepartmentId = adminDept[0].id;
        console.log('� Auto-assigned Admin role to Admin department:', finalDepartmentId);
      }
    } else if (role === 'staff' && !departmentId) {
      console.log(' Validation failed: Department required for staff role');
      return res.status(400).json({
        error: 'Department is required for staff members'
      });
    }

    // Validate department exists if provided (for staff role)
    if (role === 'staff' && departmentId) {
      const [deptExists] = await db.execute('SELECT id FROM departments WHERE id = ?', [departmentId]);
      if (deptExists.length === 0) {
        console.log(' Validation failed: Invalid department ID');
        return res.status(400).json({
          error: 'Invalid department selected'
        });
      }
      finalDepartmentId = departmentId;
    }

    // Check for existing user
    console.log(' Checking for existing user with email:', email);
    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      console.log(' User already exists with email:', email);
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    console.log('� Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (
        first_name, last_name, email, password, role, department_id, phone, city, country, address, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    console.log('� Inserting user into database...');
    const [result] = await db.execute(query, [
      firstName, lastName, email, hashedPassword, role, finalDepartmentId || null, phone || null, city || null, country || null, address || null
    ]);

    console.log(' User inserted with ID:', result.insertId);

    const [newUser] = await db.execute(`
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.role,
        u.department_id as departmentId,
        d.name as departmentName,
        u.phone,
        u.city,
        u.country,
        u.address,
        u.is_active as isActive,
        u.created_at as createdAt
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?`, [result.insertId]);

    console.log(' User created successfully:', newUser[0]);

    // Send welcome email to new user
    if (transporter && newUser[0].role !== 'admin') {
      try {
        const welcomeUrl = `${process.env.FRONTEND_URL}/login`;
        const htmlContent = await renderEmailTemplate('user_created', {
          name: `${newUser[0].firstName} ${newUser[0].lastName}`,
          email: newUser[0].email,
          role: newUser[0].role,
          department: newUser[0].departmentName || 'Not Assigned',
          login_url: welcomeUrl,
          button_url: welcomeUrl,
          button_text: 'Login to System',
          sender_name: 'HelpDesk Support Team'
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: newUser[0].email,
          subject: 'Welcome to HelpDesk - Account Created',
          html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(' Welcome email sent to new user:', newUser[0].email);
      } catch (emailError) {
        console.error(' Failed to send welcome email:', emailError.message);
      }
    }

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error(' Error creating user:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql
    });
    res.status(500).json({
      error: 'Failed to create user',
      details: error.message
    });
  }
});

// Get users stats (must be before :id route)
app.get('/api/users/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff,
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as newThisMonth
      FROM users
    `;

    const [stats] = await db.execute(statsQuery);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching users stats:', error);
    res.status(500).json({
      error: 'Failed to fetch users statistics'
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [user] = await db.execute(`
      SELECT 
        id,
        first_name as firstName,
        last_name as lastName,
        email,
        role,
        phone,
        city,
        country,
        address,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users WHERE id = ?`, [id]);

    if (user.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user'
    });
  }
});

// Update user
app.patch('/api/users/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      status
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'First name, last name, and email are required'
      });
    }

    // Check if user exists
    const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if email is already taken by another user
    const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existingEmail.length > 0) {
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    const query = `
      UPDATE users SET 
        first_name = ?, last_name = ?, email = ?, role = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [firstName, lastName, email, role, id]);

    const [updatedUser] = await db.execute(`
      SELECT 
        id,
        first_name as firstName,
        last_name as lastName,
        email,
        role,
        phone,
        city,
        country,
        address,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users WHERE id = ?`, [id]);

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user'
    });
  }
});

// DELETE endpoints for all entities

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    console.log(' Attempting to delete customer with ID:', id);

    // Check if customer exists and has role 'customer'
    const [existing] = await db.execute('SELECT id, first_name, last_name FROM users WHERE id = ? AND role = ?', [id, 'customer']);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }

    const customer = existing[0];
    console.log(' Found customer to delete:', customer);

    // Check if customer has any tickets (data integrity check)
    const [tickets] = await db.execute('SELECT COUNT(*) as ticket_count FROM tickets WHERE user_id = ?', [id]);
    const ticketCount = tickets[0].ticket_count;

    if (ticketCount > 0) {
      console.log(' Customer has', ticketCount, 'tickets, preventing deletion');
      return res.status(400).json({
        error: `Cannot delete customer with ${ticketCount} ticket(s). Archive the tickets first or transfer them to another user.`
      });
    }

    // Safe to delete - no tickets associated
    const [result] = await db.execute('DELETE FROM users WHERE id = ? AND role = ?', [id, 'customer']);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Customer not found or could not be deleted'
      });
    }

    console.log(' Customer deleted successfully:', customer.first_name, customer.last_name);
    res.json({
      message: `Customer ${customer.first_name} ${customer.last_name} deleted successfully`,
      deletedCustomer: customer
    });

  } catch (error) {
    console.error(' Error deleting customer:', error);
    res.status(500).json({
      error: 'Failed to delete customer',
      details: error.message
    });
  }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    console.log(' Attempting to delete contact with ID:', id);

    // Check if contact exists and has role 'admin' or 'staff'
    const [existing] = await db.execute('SELECT id, first_name, last_name, role FROM users WHERE id = ? AND role IN (?, ?)', [id, 'admin', 'staff']);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Contact not found'
      });
    }

    const contact = existing[0];
    console.log(' Found contact to delete:', contact);

    // Check if contact has assigned tickets (data integrity check)
    const [assignedTickets] = await db.execute('SELECT COUNT(*) as ticket_count FROM tickets WHERE assigned_to = ?', [id]);
    const assignedCount = assignedTickets[0].ticket_count;

    if (assignedCount > 0) {
      console.log(' Contact has', assignedCount, 'assigned tickets, preventing deletion');
      return res.status(400).json({
        error: `Cannot delete ${contact.role} with ${assignedCount} assigned ticket(s). Reassign tickets first or transfer them to another staff member.`
      });
    }

    // Check if this is the only admin (prevent system lockout)
    if (contact.role === 'admin') {
      const [adminCount] = await db.execute('SELECT COUNT(*) as admin_count FROM users WHERE role = ?', ['admin']);
      if (adminCount[0].admin_count <= 1) {
        console.log(' Cannot delete the last admin user');
        return res.status(400).json({
          error: 'Cannot delete the last admin user. System must have at least one administrator.'
        });
      }
    }

    // Safe to delete - no assigned tickets and won't lock system
    const [result] = await db.execute('DELETE FROM users WHERE id = ? AND role IN (?, ?)', [id, 'admin', 'staff']);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Contact not found or could not be deleted'
      });
    }

    console.log(' Contact deleted successfully:', contact.first_name, contact.last_name, contact.role);
    res.json({
      message: `${contact.role.charAt(0).toUpperCase() + contact.role.slice(1)} ${contact.first_name} ${contact.last_name} deleted successfully`,
      deletedContact: contact
    });

  } catch (error) {
    console.error(' Error deleting contact:', error);
    res.status(500).json({
      error: 'Failed to delete contact',
      details: error.message
    });
  }
});

// Delete organization
app.delete('/api/organizations/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [result] = await db.execute('DELETE FROM organizations WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    res.json({
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({
      error: 'Failed to delete organization'
    });
  }
});

// Delete note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [result] = await db.execute('DELETE FROM notes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Note not found'
      });
    }

    res.json({
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      error: 'Failed to delete note'
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Failed to delete user'
    });
  }
});

// DEBUG: Check default user existence and password hash
app.get('/api/debug-user', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, email, password, role FROM users WHERE email = ?', ['user@presidentsaward.ke']);
    if (users.length === 0) {
      return res.json({
        exists: false
      });
    }
    res.json({
      exists: true,
      user: users[0]
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// DEBUG: List all users (for troubleshooting)
app.get('/api/debug-users', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, email, first_name, last_name, role FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =============================================================================
// SETTINGS API ROUTES (Brian's additions)
// =============================================================================

// Role routes
app.get('/api/roles', roleController.getRoles);
app.post('/api/roles', roleController.createRole);
app.put('/api/roles/:id', roleController.updateRole);
app.delete('/api/roles/:id', roleController.deleteRole);

// Department routes
app.get('/api/departments', departmentController.getDepartments);
app.get('/api/departments/all', departmentController.getAllDepartments);
app.post('/api/departments', departmentController.createDepartment);
app.put('/api/departments/:id', departmentController.updateDepartment);
app.delete('/api/departments/:id', departmentController.deleteDepartment);

// Ticket Type routes
app.get('/api/ticket-types', ticketTypeController.getTicketTypes);
app.post('/api/ticket-types', ticketTypeController.createTicketType);
app.put('/api/ticket-types/:id', ticketTypeController.updateTicketType);
app.delete('/api/ticket-types/:id', ticketTypeController.deleteTicketType);

// User management routes
app.get('/api/users', userController.getUsers);

// Get staff members for ticket assignment (only staff role)
app.get('/api/staff', async (req, res) => {
  try {
    console.log('� Getting staff members for ticket assignment...');

    const [staff] = await db.execute(`
      SELECT 
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        d.name as department,
        COUNT(t.id) as activeTickets
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tickets t ON u.id = t.assigned_to AND t.status IN ('new', 'open', 'in_progress')
      WHERE u.role = 'staff'
      GROUP BY u.id, u.first_name, u.last_name, u.email, d.name
      ORDER BY d.name, u.first_name, u.last_name
    `);

    console.log(' Found', staff.length, 'staff members for assignment');
    res.json(staff);
  } catch (error) {
    console.error(' Error fetching staff members:', error);
    res.status(500).json({
      error: 'Failed to fetch staff members'
    });
  }
});

app.put('/api/users/:id/assign-role', userController.assignRole);
app.put('/api/users/:id', userController.updateUser);

// Priority routes
app.get('/api/priorities', priorityController.getPriorities);
app.get('/api/priorities/:id', priorityController.getPriorityById);
app.post('/api/priorities', priorityController.createPriority);
app.put('/api/priorities/:id', priorityController.updatePriority);
app.delete('/api/priorities/:id', priorityController.deletePriority);

// Status routes
app.get('/api/statuses', statusController.getStatuses);
app.get('/api/statuses/:id', statusController.getStatusById);
app.post('/api/statuses', statusController.createStatus);
app.put('/api/statuses/:id', statusController.updateStatus);
app.delete('/api/statuses/:id', statusController.deleteStatus);

// System Settings routes
app.get('/api/system-settings', systemSettingsController.getSettings);
app.get('/api/system-settings/category/:category', systemSettingsController.getSettingsByCategory);
app.get('/api/system-settings/key/:key', systemSettingsController.getSettingByKey);
app.get('/api/system-settings/file-upload-config', systemSettingsController.getFileUploadConfig);
app.post('/api/system-settings', systemSettingsController.createSetting);
app.put('/api/system-settings/:id', systemSettingsController.updateSetting);
app.delete('/api/system-settings/:id', systemSettingsController.deleteSetting);

// SMTP Settings routes
app.get('/api/smtp-settings', smtpSettingsController.getSmtpSettings);
app.post('/api/smtp-settings', smtpSettingsController.saveSmtpSettings);
app.post('/api/smtp-settings/test', smtpSettingsController.testSmtpConnection);

// =============================================================================
// EMAIL TEMPLATES API ROUTES
// =============================================================================

// Get all email templates
app.get('/api/email-templates', async (req, res) => {
  try {
    const [templates] = await db.execute(`
      SELECT id, name, slug, description, content, variables, created_at, updated_at
      FROM email_templates
      ORDER BY name
    `);

    // Convert to camelCase (MySQL driver auto-parses JSON)
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      content: template.content,
      variables: Array.isArray(template.variables) ? template.variables : JSON.parse(template.variables || '[]'),
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }));

    res.json(formattedTemplates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      error: 'Failed to fetch email templates'
    });
  }
});

// Get email template by ID
app.get('/api/email-templates/:id', async (req, res) => {
  try {
    const [templates] = await db.execute(
      'SELECT id, name, slug, description, content, variables, created_at, updated_at FROM email_templates WHERE id = ?',
      [req.params.id]
    );

    if (templates.length === 0) {
      return res.status(404).json({
        error: 'Template not found'
      });
    }

    const template = {
      id: templates[0].id,
      name: templates[0].name,
      slug: templates[0].slug,
      description: templates[0].description,
      content: templates[0].content,
      variables: Array.isArray(templates[0].variables) ? templates[0].variables : JSON.parse(templates[0].variables || '[]'),
      createdAt: templates[0].created_at,
      updatedAt: templates[0].updated_at
    };

    res.json(template);
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      error: 'Failed to fetch email template'
    });
  }
});

// Update email template
app.put('/api/email-templates/:id', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      content,
      variables
    } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const variablesJson = JSON.stringify(variables || []);

    await db.execute(
      `UPDATE email_templates 
       SET name = ?, slug = ?, description = ?, content = ?, variables = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, slug, description, content, variablesJson, req.params.id]
    );

    // Fetch and return updated template
    const [templates] = await db.execute(
      'SELECT id, name, slug, description, content, variables, created_at, updated_at FROM email_templates WHERE id = ?',
      [req.params.id]
    );

    if (templates.length === 0) {
      return res.status(404).json({
        error: 'Template not found'
      });
    }

    const template = {
      id: templates[0].id,
      name: templates[0].name,
      slug: templates[0].slug,
      description: templates[0].description,
      content: templates[0].content,
      variables: Array.isArray(templates[0].variables) ? templates[0].variables : JSON.parse(templates[0].variables || '[]'),
      createdAt: templates[0].created_at,
      updatedAt: templates[0].updated_at
    };

    res.json(template);
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      error: 'Failed to update email template'
    });
  }
});

// =============================================================================
// SLA TRACKING API ENDPOINTS
// =============================================================================

const SLACalculator = require('./services/SLACalculator');

// Get SLA dashboard metrics
app.get('/api/sla/dashboard', async (req, res) => {
  try {
    console.log('[SLA-API] Fetching dashboard metrics');

    // Get overall SLA statistics - Calculate in real-time based on current state
    const [overallStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_tickets,
        -- Assignment breaches: unassigned tickets past assignment deadline
        SUM(CASE 
          WHEN assigned_to IS NULL 
            AND assignment_deadline < NOW() 
            AND status NOT IN ('resolved', 'closed')
          THEN 1 
          ELSE 0 
        END) as assignment_breaches,
        -- Resolution breaches: assigned tickets past resolution deadline and not resolved
        SUM(CASE 
          WHEN assigned_to IS NOT NULL 
            AND resolution_deadline < NOW() 
            AND status NOT IN ('resolved', 'closed')
          THEN 1 
          ELSE 0 
        END) as resolution_breaches,
        -- On-time tickets: not breaching any SLA
        SUM(CASE 
          WHEN status IN ('resolved', 'closed')
            OR (assigned_to IS NULL AND assignment_deadline >= NOW())
            OR (assigned_to IS NOT NULL AND resolution_deadline >= NOW())
          THEN 1 
          ELSE 0 
        END) as on_time_tickets,
        -- At-risk tickets: approaching deadline (within 20% of SLA time)
        SUM(CASE 
          WHEN status NOT IN ('resolved', 'closed') AND (
            (assigned_to IS NULL 
              AND assignment_deadline > NOW() 
              AND assignment_deadline <= DATE_ADD(NOW(), INTERVAL 1 HOUR))
            OR (assigned_to IS NOT NULL 
              AND resolution_deadline > NOW() 
              AND resolution_deadline <= DATE_ADD(NOW(), INTERVAL 2 HOUR))
          )
          THEN 1 
          ELSE 0 
        END) as at_risk_tickets,
        -- Compliance: percentage of tickets meeting SLA
        ROUND(
          (SUM(CASE 
            WHEN status IN ('resolved', 'closed')
              OR (assigned_to IS NULL AND assignment_deadline >= NOW())
              OR (assigned_to IS NOT NULL AND resolution_deadline >= NOW())
            THEN 1 
            ELSE 0 
          END) / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as compliance_percentage
      FROM tickets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Get SLA breaches by priority - Real-time calculation
    const [breachesByPriority] = await db.execute(`
      SELECT 
        priority,
        COUNT(*) as total,
        SUM(CASE 
          WHEN assigned_to IS NULL 
            AND assignment_deadline < NOW() 
            AND status NOT IN ('resolved', 'closed')
          THEN 1 
          ELSE 0 
        END) as assignment_breaches,
        SUM(CASE 
          WHEN assigned_to IS NOT NULL 
            AND resolution_deadline < NOW() 
            AND status NOT IN ('resolved', 'closed')
          THEN 1 
          ELSE 0 
        END) as resolution_breaches
      FROM tickets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY priority
      ORDER BY FIELD(priority, 'urgent', 'high', 'medium', 'low')
    `);

    // Get recent breaches - Show current breaches only
    const [recentBreaches] = await db.execute(`
      SELECT 
        t.id,
        t.subject,
        t.priority,
        t.department,
        t.created_at,
        t.assigned_at,
        t.assignment_deadline,
        t.resolution_deadline,
        -- Calculate if currently breaching (not historical)
        CASE 
          WHEN t.assigned_to IS NULL AND t.assignment_deadline < NOW() AND t.status NOT IN ('resolved', 'closed')
          THEN TRUE 
          ELSE FALSE 
        END as assignment_sla_breached,
        CASE 
          WHEN t.assigned_to IS NOT NULL AND t.resolution_deadline < NOW() AND t.status NOT IN ('resolved', 'closed')
          THEN TRUE 
          ELSE FALSE 
        END as resolution_sla_breached,
        -- Calculate breach duration in real-time
        CASE 
          WHEN t.assigned_to IS NULL AND t.assignment_deadline < NOW() AND t.status NOT IN ('resolved', 'closed')
          THEN TIMESTAMPDIFF(MINUTE, t.assignment_deadline, NOW())
          ELSE NULL
        END as assignment_breach_duration,
        CASE 
          WHEN t.assigned_to IS NOT NULL AND t.resolution_deadline < NOW() AND t.status NOT IN ('resolved', 'closed')
          THEN TIMESTAMPDIFF(MINUTE, t.resolution_deadline, NOW())
          ELSE NULL
        END as resolution_breach_duration,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.status NOT IN ('resolved', 'closed')
        AND (
          (t.assigned_to IS NULL AND t.assignment_deadline < NOW())
          OR (t.assigned_to IS NOT NULL AND t.resolution_deadline < NOW())
        )
        AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY 
        CASE 
          WHEN t.assigned_to IS NULL THEN TIMESTAMPDIFF(MINUTE, t.assignment_deadline, NOW())
          ELSE TIMESTAMPDIFF(MINUTE, t.resolution_deadline, NOW())
        END DESC
      LIMIT 10
    `);

    res.json({
      overall: overallStats[0],
      byPriority: breachesByPriority,
      recentBreaches: recentBreaches
    });

  } catch (error) {
    console.error('[SLA-API] Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch SLA dashboard metrics' });
  }
});

// Get staff SLA performance
app.get('/api/sla/staff-performance', async (req, res) => {
  try {
    console.log('[SLA-API] Fetching staff performance metrics');

    const [staffPerformance] = await db.execute(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as staff_name,
        u.email,
        d.name as department,
        COUNT(t.id) as total_assigned,
        -- On-time: tickets that are resolved/closed OR currently not breaching resolution SLA
        SUM(CASE 
          WHEN t.status IN ('resolved', 'closed')
            OR (t.status NOT IN ('resolved', 'closed') AND t.resolution_deadline >= NOW())
          THEN 1 
          ELSE 0 
        END) as on_time_resolutions,
        -- Breached: tickets currently past resolution deadline and not resolved
        SUM(CASE 
          WHEN t.status NOT IN ('resolved', 'closed') 
            AND t.resolution_deadline < NOW()
          THEN 1 
          ELSE 0 
        END) as breached_resolutions,
        AVG(CASE 
          WHEN t.resolved_at IS NOT NULL AND t.assigned_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, t.assigned_at, t.resolved_at)
          ELSE NULL
        END) as avg_resolution_time_minutes,
        -- Compliance: percentage of tickets meeting SLA
        ROUND(
          (SUM(CASE 
            WHEN t.status IN ('resolved', 'closed')
              OR (t.status NOT IN ('resolved', 'closed') AND t.resolution_deadline >= NOW())
            THEN 1 
            ELSE 0 
          END) / NULLIF(COUNT(t.id), 0)) * 100,
          2
        ) as compliance_percentage
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tickets t ON u.id = t.assigned_to AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      WHERE u.role = 'staff' AND u.is_active = TRUE
      GROUP BY u.id, u.first_name, u.last_name, u.email, d.name
      HAVING total_assigned > 0
      ORDER BY compliance_percentage DESC, total_assigned DESC
      LIMIT 10
    `);

    res.json(staffPerformance);

  } catch (error) {
    console.error('[SLA-API] Error fetching staff performance:', error);
    res.status(500).json({ error: 'Failed to fetch staff performance metrics' });
  }
});

// Get SLA breach history
app.get('/api/sla/breaches', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const breachType = req.query.breachType || ''; // 'assignment' or 'resolution'
    const priority = req.query.priority || '';
    const offset = (page - 1) * limit;

    console.log('[SLA-API] Fetching breach history', { page, limit, breachType, priority });

    let whereConditions = ['1=1'];
    let params = [];

    if (breachType) {
      whereConditions.push('breach_type = ?');
      params.push(breachType);
    }

    if (priority) {
      whereConditions.push('priority = ?');
      params.push(priority);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM sla_breach_logs
      WHERE ${whereClause}
    `, params);

    // Get breach logs
    const [breaches] = await db.execute(`
      SELECT 
        bl.id,
        bl.ticket_id,
        bl.breach_type,
        bl.priority,
        bl.expected_deadline,
        bl.actual_breach_time,
        bl.breach_duration_minutes,
        bl.notified,
        bl.notification_sent_at,
        bl.created_at,
        t.subject as ticket_subject,
        t.department as ticket_department,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
      FROM sla_breach_logs bl
      LEFT JOIN tickets t ON bl.ticket_id = t.id
      LEFT JOIN users u ON bl.assigned_to = u.id
      WHERE ${whereClause}
      ORDER BY bl.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      breaches,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('[SLA-API] Error fetching breach history:', error);
    res.status(500).json({ error: 'Failed to fetch breach history' });
  }
});

// Get SLA trends (historical data)
app.get('/api/sla/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    console.log('[SLA-API] Fetching SLA trends for last', days, 'days');

    const [trends] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_tickets,
        SUM(CASE WHEN assignment_sla_breached = TRUE THEN 1 ELSE 0 END) as assignment_breaches,
        SUM(CASE WHEN resolution_sla_breached = TRUE THEN 1 ELSE 0 END) as resolution_breaches,
        SUM(CASE WHEN sla_status = 'on_time' THEN 1 ELSE 0 END) as on_time_tickets,
        ROUND((SUM(CASE WHEN sla_status = 'on_time' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as compliance_percentage
      FROM tickets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    res.json(trends);

  } catch (error) {
    console.error('[SLA-API] Error fetching SLA trends:', error);
    res.status(500).json({ error: 'Failed to fetch SLA trends' });
  }
});

// Get ticket SLA status
app.get('/api/tickets/:id/sla', async (req, res) => {
  try {
    const ticketId = req.params.id;
    console.log('[SLA-API] Fetching SLA status for ticket', ticketId);

    const [tickets] = await db.execute(`
      SELECT 
        t.*,
        p.assignment_sla_minutes,
        p.resolution_sla_minutes
      FROM tickets t
      INNER JOIN priorities p ON t.priority = p.value
      WHERE t.id = ?
    `, [ticketId]);

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];
    const slaStatus = SLACalculator.getTicketSLAStatus(ticket);

    // Calculate time remaining
    const assignmentTimeRemaining = ticket.assignment_deadline
      ? SLACalculator.formatTimeRemaining(ticket.assignment_deadline)
      : null;

    const resolutionTimeRemaining = ticket.resolution_deadline
      ? SLACalculator.formatTimeRemaining(ticket.resolution_deadline)
      : null;

    res.json({
      ticketId: ticket.id,
      priority: ticket.priority,
      status: ticket.status,
      sla: {
        assignment: {
          deadline: ticket.assignment_deadline,
          breached: ticket.assignment_sla_breached,
          breachDuration: ticket.assignment_breach_duration,
          timeRemaining: assignmentTimeRemaining,
          status: slaStatus.assignment.status
        },
        resolution: {
          deadline: ticket.resolution_deadline,
          breached: ticket.resolution_sla_breached,
          breachDuration: ticket.resolution_breach_duration,
          timeRemaining: resolutionTimeRemaining,
          status: slaStatus.resolution.status
        },
        overall: slaStatus.overall
      },
      config: {
        assignmentSLAMinutes: ticket.assignment_sla_minutes,
        resolutionSLAMinutes: ticket.resolution_sla_minutes
      }
    });

  } catch (error) {
    console.error('[SLA-API] Error fetching ticket SLA status:', error);
    res.status(500).json({ error: 'Failed to fetch ticket SLA status' });
  }
});

// Manual ticket assignment with SLA calculation
app.post('/api/tickets/:id/assign', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { assignedTo } = req.body;

    console.log('[SLA-API] Manually assigning ticket', ticketId, 'to user', assignedTo);

    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo is required' });
    }

    // Get ticket details
    const [tickets] = await db.execute(`
      SELECT t.*, p.resolution_sla_minutes
      FROM tickets t
      INNER JOIN priorities p ON t.priority = p.value
      WHERE t.id = ?
    `, [ticketId]);

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];
    const assignedAt = new Date();

    // Calculate resolution deadline
    const resolutionDeadline = SLACalculator.calculateResolutionDeadline(
      assignedAt,
      ticket.resolution_sla_minutes
    );

    // Check if assignment SLA was breached
    const assignmentStatus = SLACalculator.checkAssignmentBreach(
      ticket.created_at,
      ticket.assignment_deadline,
      assignedAt
    );

    // Update ticket with assignment and SLA info
    await db.execute(`
      UPDATE tickets
      SET 
        assigned_to = ?,
        assigned_at = ?,
        resolution_deadline = ?,
        status = CASE WHEN status = 'new' OR status = 'pending_assignment' THEN 'open' ELSE status END,
        assignment_sla_breached = ?,
        assignment_breach_duration = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      assignedTo,
      assignedAt,
      resolutionDeadline,
      assignmentStatus.breached,
      assignmentStatus.breachDuration,
      ticketId
    ]);

    console.log(`[SLA] Ticket #${ticketId} assigned - Resolution deadline: ${resolutionDeadline.toISOString()}`);

    if (assignmentStatus.breached) {
      console.log(`[SLA] Assignment SLA breached by ${assignmentStatus.breachDuration} minutes`);
    }

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      sla: {
        resolutionDeadline,
        assignmentBreached: assignmentStatus.breached,
        assignmentBreachDuration: assignmentStatus.breachDuration
      }
    });

  } catch (error) {
    console.error('[SLA-API] Error assigning ticket:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
});

// =============================================================================

// Import workers
const deferredAssignmentWorker = require('./workers/deferred-assignment-worker');
const slaMonitorWorker = require('./workers/sla-monitor-worker');

// Start server
async function startServer() {
  try {
    await initDatabase();

    // Check if auto-assignment is enabled before starting server
    const [autoAssignSetting] = await db.execute(`
      SELECT value FROM system_settings WHERE \`key\` = 'auto_assign_tickets'
    `);
    const autoAssignEnabled = autoAssignSetting.length > 0 && autoAssignSetting[0].value === 'true';

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
      console.log(`Dashboard endpoints available at http://localhost:${PORT}/api/dashboard`);

      // Start background workers
      console.log('\n[WORKERS] Starting background workers...');

      if (autoAssignEnabled) {
        console.log('[WORKERS] Starting Deferred Assignment Worker...');
        deferredAssignmentWorker.start();
      } else {
        console.log('⚠️  [WORKERS] Auto-assignment disabled - Deferred Assignment Worker not started');
      }

      console.log('[WORKERS] Starting SLA Monitoring Worker...');
      slaMonitorWorker.start();

      console.log('[WORKERS] All workers started successfully\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n[SHUTDOWN] Shutting down gracefully...');
  if (deferredAssignmentWorker.isRunning) {
    deferredAssignmentWorker.stop();
  }
  slaMonitorWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n[SHUTDOWN] Shutting down gracefully...');
  if (deferredAssignmentWorker.isRunning) {
    deferredAssignmentWorker.stop();
  }
  slaMonitorWorker.stop();
  process.exit(0);
});

startServer();