// Fix missing columns in tickets table
require('dotenv').config();
const db = require('./db');

async function fixTicketsTable() {
  console.log('🔧 Fixing tickets table structure...');
  
  try {
    // Check current table structure
    const [columns] = await db.execute('DESCRIBE tickets');
    const columnNames = columns.map(col => col.Field);
    
    console.log('Current columns:', columnNames);
    
    // Add missing columns if they don't exist
    const columnsToAdd = [
      {
        name: 'assignment_deadline',
        sql: 'ADD COLUMN `assignment_deadline` timestamp NULL DEFAULT NULL COMMENT "Deadline for assignment"'
      },
      {
        name: 'resolution_deadline', 
        sql: 'ADD COLUMN `resolution_deadline` timestamp NULL DEFAULT NULL COMMENT "Deadline for resolution"'
      },
      {
        name: 'assignment_sla_breached',
        sql: 'ADD COLUMN `assignment_sla_breached` tinyint(1) DEFAULT 0 COMMENT "Assignment SLA breach flag"'
      },
      {
        name: 'resolution_sla_breached',
        sql: 'ADD COLUMN `resolution_sla_breached` tinyint(1) DEFAULT 0 COMMENT "Resolution SLA breach flag"'
      },
      {
        name: 'assignment_breach_duration',
        sql: 'ADD COLUMN `assignment_breach_duration` int DEFAULT NULL COMMENT "Minutes past assignment deadline"'
      },
      {
        name: 'resolution_breach_duration',
        sql: 'ADD COLUMN `resolution_breach_duration` int DEFAULT NULL COMMENT "Minutes past resolution deadline"'
      },
      {
        name: 'sla_status',
        sql: 'ADD COLUMN `sla_status` enum("on_time","at_risk","breached_assignment","breached_resolution","breached_both") DEFAULT "on_time"'
      },
      {
        name: 'first_response_at',
        sql: 'ADD COLUMN `first_response_at` timestamp NULL DEFAULT NULL COMMENT "First staff response time"'
      },
      {
        name: 'resolved_at',
        sql: 'ADD COLUMN `resolved_at` timestamp NULL DEFAULT NULL COMMENT "When ticket was resolved"'
      }
    ];
    
    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        await db.execute(`ALTER TABLE tickets ${column.sql}`);
        console.log(`✅ Added ${column.name}`);
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }
    
    // Add indexes if they don't exist
    const indexesToAdd = [
      'ADD INDEX `idx_tickets_assignment_deadline` (`assignment_deadline`, `assignment_sla_breached`)',
      'ADD INDEX `idx_tickets_resolution_deadline` (`resolution_deadline`, `resolution_sla_breached`)',
      'ADD INDEX `idx_tickets_sla_status` (`sla_status`)',
      'ADD INDEX `idx_tickets_assigned_at` (`assigned_at`)'
    ];
    
    for (const indexSql of indexesToAdd) {
      try {
        await db.execute(`ALTER TABLE tickets ${indexSql}`);
        console.log(`✅ Added index`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`✅ Index already exists`);
        } else {
          console.log(`⚠️ Index error (might already exist):`, error.message);
        }
      }
    }
    
    console.log('🎉 Tickets table structure fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing tickets table:', error);
  }
}

fixTicketsTable().then(() => process.exit(0));