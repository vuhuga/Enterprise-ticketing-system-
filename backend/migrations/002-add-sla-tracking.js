/**
 * Migration: Add SLA Tracking System
 * 
 * Implements dual-phase SLA tracking:
 * - Phase 1: Unassigned SLA (creation to assignment)
 * - Phase 2: Resolution SLA (assignment to resolution)
 * 
 * Run with: node backend/migrations/002-add-sla-tracking.js
 */

require('dotenv').config();
const db = require('../db');

async function migrate() {
  console.log('[MIGRATION] Starting SLA Tracking System migration...\n');

  try {
    // Step 1: Add SLA columns to priorities table
    console.log('[STEP 1] Adding SLA timeframes to priorities table...');

    // Check if columns exist first
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'priorities'
        AND COLUMN_NAME IN ('assignment_sla_minutes', 'resolution_sla_minutes', 'is_active', 'updated_at')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    if (!existingColumns.includes('assignment_sla_minutes')) {
      await db.execute(`ALTER TABLE priorities ADD COLUMN assignment_sla_minutes INT DEFAULT 1440 COMMENT 'Time allowed for ticket assignment (default 1 day)'`);
      console.log('   [SUCCESS] Added assignment_sla_minutes column');
    } else {
      console.log('   [SKIP] assignment_sla_minutes column already exists');
    }

    if (!existingColumns.includes('resolution_sla_minutes')) {
      await db.execute(`ALTER TABLE priorities ADD COLUMN resolution_sla_minutes INT DEFAULT 10080 COMMENT 'Time allowed for ticket resolution (default 1 week)'`);
      console.log('   [SUCCESS] Added resolution_sla_minutes column');
    } else {
      console.log('   [SKIP] resolution_sla_minutes column already exists');
    }

    if (!existingColumns.includes('is_active')) {
      await db.execute(`ALTER TABLE priorities ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
      console.log('   [SUCCESS] Added is_active column');
    } else {
      console.log('   [SKIP] is_active column already exists');
    }

    if (!existingColumns.includes('updated_at')) {
      await db.execute(`ALTER TABLE priorities ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      console.log('   [SUCCESS] Added updated_at column');
    } else {
      console.log('   [SKIP] updated_at column already exists');
    }

    console.log('   [SUCCESS] SLA columns processed for priorities table');

    // Step 2: Update existing priorities with default SLA values
    console.log('\n[STEP 2] Setting default SLA values for existing priorities...');

    const slaDefaults = [{
      value: 'urgent',
      assignment: 30,
      resolution: 300
    }, // 30 min, 5 hours
    {
      value: 'high',
      assignment: 60,
      resolution: 480
    }, // 1 hour, 8 hours
    {
      value: 'medium',
      assignment: 240,
      resolution: 2880
    }, // 4 hours, 2 days
    {
      value: 'low',
      assignment: 1440,
      resolution: 10080
    } // 1 day, 1 week
    ];

    for (const sla of slaDefaults) {
      await db.execute(`
        UPDATE priorities 
        SET assignment_sla_minutes = ?, 
            resolution_sla_minutes = ?
        WHERE value = ?
      `, [sla.assignment, sla.resolution, sla.value]);

      console.log(`   [SUCCESS] ${sla.value}: ${sla.assignment}min assignment, ${sla.resolution}min resolution`);
    }

    // Step 3: Add SLA tracking columns to tickets table
    console.log('\n[STEP 3] Adding SLA tracking columns to tickets table...');

    // Check if columns exist first
    const [ticketColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tickets'
        AND COLUMN_NAME IN ('assigned_at', 'assignment_deadline', 'resolution_deadline', 'assignment_sla_breached', 
                            'resolution_sla_breached', 'assignment_breach_duration', 'resolution_breach_duration', 
                            'sla_status', 'first_response_at', 'resolved_at')
    `);

    const existingTicketColumns = ticketColumns.map(col => col.COLUMN_NAME);

    const ticketColumnsToAdd = [{
      name: 'assigned_at',
      sql: 'assigned_at DATETIME NULL COMMENT \'When ticket was assigned to staff\''
    },
    {
      name: 'assignment_deadline',
      sql: 'assignment_deadline DATETIME NULL COMMENT \'Deadline for assignment\''
    },
    {
      name: 'resolution_deadline',
      sql: 'resolution_deadline DATETIME NULL COMMENT \'Deadline for resolution\''
    },
    {
      name: 'assignment_sla_breached',
      sql: 'assignment_sla_breached BOOLEAN DEFAULT FALSE COMMENT \'Assignment SLA breach flag\''
    },
    {
      name: 'resolution_sla_breached',
      sql: 'resolution_sla_breached BOOLEAN DEFAULT FALSE COMMENT \'Resolution SLA breach flag\''
    },
    {
      name: 'assignment_breach_duration',
      sql: 'assignment_breach_duration INT NULL COMMENT \'Minutes past assignment deadline\''
    },
    {
      name: 'resolution_breach_duration',
      sql: 'resolution_breach_duration INT NULL COMMENT \'Minutes past resolution deadline\''
    },
    {
      name: 'sla_status',
      sql: 'sla_status ENUM(\'on_time\', \'at_risk\', \'breached_assignment\', \'breached_resolution\', \'breached_both\') DEFAULT \'on_time\''
    },
    {
      name: 'first_response_at',
      sql: 'first_response_at DATETIME NULL COMMENT \'First staff response time\''
    },
    {
      name: 'resolved_at',
      sql: 'resolved_at DATETIME NULL COMMENT \'When ticket was resolved\''
    }
    ];

    for (const column of ticketColumnsToAdd) {
      if (!existingTicketColumns.includes(column.name)) {
        await db.execute(`ALTER TABLE tickets ADD COLUMN ${column.sql}`);
        console.log(`   [SUCCESS] Added ${column.name} column`);
      } else {
        console.log(`   [SKIP] ${column.name} column already exists`);
      }
    }

    console.log('   [SUCCESS] SLA tracking columns processed for tickets table');

    // Step 4: Create SLA breach log table for audit trail
    console.log('\n[STEP 4] Creating SLA breach log table...');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sla_breach_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        breach_type ENUM('assignment', 'resolution') NOT NULL,
        priority VARCHAR(50) NOT NULL,
        expected_deadline DATETIME NOT NULL,
        actual_breach_time DATETIME NOT NULL,
        breach_duration_minutes INT NOT NULL,
        assigned_to INT NULL,
        notified BOOLEAN DEFAULT FALSE,
        notification_sent_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        
        INDEX idx_breach_type (breach_type),
        INDEX idx_ticket_id (ticket_id),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Audit trail for SLA breaches'
    `);

    console.log('   [SUCCESS] SLA breach log table created');

    // Step 5: Create SLA analytics view for dashboard
    console.log('\n[STEP 5] Creating SLA analytics view...');

    await db.execute(`
      CREATE OR REPLACE VIEW sla_analytics AS
      SELECT 
        DATE(t.created_at) as date,
        t.priority,
        COUNT(*) as total_tickets,
        SUM(CASE WHEN t.assignment_sla_breached = TRUE THEN 1 ELSE 0 END) as assignment_breaches,
        SUM(CASE WHEN t.resolution_sla_breached = TRUE THEN 1 ELSE 0 END) as resolution_breaches,
        SUM(CASE WHEN t.sla_status = 'on_time' THEN 1 ELSE 0 END) as on_time_tickets,
        AVG(CASE 
          WHEN t.assigned_at IS NOT NULL 
          THEN TIMESTAMPDIFF(MINUTE, t.created_at, t.assigned_at) 
          ELSE NULL 
        END) as avg_assignment_time_minutes,
        AVG(CASE 
          WHEN t.resolved_at IS NOT NULL AND t.assigned_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, t.assigned_at, t.resolved_at) 
          ELSE NULL 
        END) as avg_resolution_time_minutes,
        ROUND(
          (SUM(CASE WHEN t.sla_status = 'on_time' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
          2
        ) as sla_compliance_percentage
      FROM tickets t
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY DATE(t.created_at), t.priority
    `);

    console.log('   [SUCCESS] SLA analytics view created');

    // Step 6: Create indexes for performance
    console.log('\n[STEP 6] Creating performance indexes...');

    // Check existing indexes
    const [indexes] = await db.execute(`
      SELECT DISTINCT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tickets'
        AND INDEX_NAME IN ('idx_tickets_assignment_deadline', 'idx_tickets_resolution_deadline', 
                           'idx_tickets_sla_status', 'idx_tickets_assigned_at')
    `);

    const existingIndexes = indexes.map(idx => idx.INDEX_NAME);

    if (!existingIndexes.includes('idx_tickets_assignment_deadline')) {
      await db.execute(`CREATE INDEX idx_tickets_assignment_deadline ON tickets(assignment_deadline, assignment_sla_breached)`);
      console.log('   [SUCCESS] Created idx_tickets_assignment_deadline');
    } else {
      console.log('   [SKIP] idx_tickets_assignment_deadline already exists');
    }

    if (!existingIndexes.includes('idx_tickets_resolution_deadline')) {
      await db.execute(`CREATE INDEX idx_tickets_resolution_deadline ON tickets(resolution_deadline, resolution_sla_breached)`);
      console.log('   [SUCCESS] Created idx_tickets_resolution_deadline');
    } else {
      console.log('   [SKIP] idx_tickets_resolution_deadline already exists');
    }

    if (!existingIndexes.includes('idx_tickets_sla_status')) {
      await db.execute(`CREATE INDEX idx_tickets_sla_status ON tickets(sla_status)`);
      console.log('   [SUCCESS] Created idx_tickets_sla_status');
    } else {
      console.log('   [SKIP] idx_tickets_sla_status already exists');
    }

    if (!existingIndexes.includes('idx_tickets_assigned_at')) {
      await db.execute(`CREATE INDEX idx_tickets_assigned_at ON tickets(assigned_at)`);
      console.log('   [SUCCESS] Created idx_tickets_assigned_at');
    } else {
      console.log('   [SKIP] idx_tickets_assigned_at already exists');
    }

    console.log('   [SUCCESS] Performance indexes processed');

    // Step 7: Backfill assignment deadlines for existing tickets
    console.log('\n[STEP 7] Backfilling SLA deadlines for existing tickets...');

    await db.execute(`
      UPDATE tickets t
      INNER JOIN priorities p ON t.priority = p.value
      SET 
        t.assignment_deadline = DATE_ADD(t.created_at, INTERVAL p.assignment_sla_minutes MINUTE),
        t.resolution_deadline = CASE 
          WHEN t.assigned_to IS NOT NULL AND t.assigned_at IS NULL
          THEN DATE_ADD(t.created_at, INTERVAL p.resolution_sla_minutes MINUTE)
          WHEN t.assigned_at IS NOT NULL
          THEN DATE_ADD(t.assigned_at, INTERVAL p.resolution_sla_minutes MINUTE)
          ELSE NULL
        END,
        t.assigned_at = CASE 
          WHEN t.assigned_to IS NOT NULL AND t.assigned_at IS NULL 
          THEN t.created_at 
          ELSE t.assigned_at 
        END
      WHERE t.assignment_deadline IS NULL
    `);

    const [backfillResult] = await db.execute(`
      SELECT COUNT(*) as updated_count FROM tickets WHERE assignment_deadline IS NOT NULL
    `);

    console.log(`   [SUCCESS] Backfilled ${backfillResult[0].updated_count} tickets with SLA deadlines`);

    // Step 8: Create system settings for SLA configuration
    console.log('\n[STEP 8] Adding SLA system settings...');

    const slaSettings = [{
      key: 'sla_monitoring_enabled',
      value: 'true',
      label: 'Enable SLA Monitoring',
      description: 'Automatically track and flag SLA breaches',
      dataType: 'boolean',
      category: 'system'
    },
    {
      key: 'sla_notification_enabled',
      value: 'true',
      label: 'Enable SLA Breach Notifications',
      description: 'Send email notifications when SLA is breached',
      dataType: 'boolean',
      category: 'system'
    },
    {
      key: 'sla_at_risk_threshold',
      value: '80',
      label: 'SLA At-Risk Threshold (%)',
      description: 'Mark ticket as at-risk when this percentage of SLA time has elapsed',
      dataType: 'number',
      category: 'system'
    },
    {
      key: 'sla_worker_interval_minutes',
      value: '5',
      label: 'SLA Check Interval (minutes)',
      description: 'How often to check for SLA breaches',
      dataType: 'number',
      category: 'system'
    }
    ];

    for (const setting of slaSettings) {
      const [exists] = await db.execute(`
        SELECT COUNT(*) as count FROM system_settings WHERE \`key\` = ?
      `, [setting.key]);

      if (exists[0].count === 0) {
        await db.execute(`
          INSERT INTO system_settings (\`key\`, value, label, description, dataType, category, isEditable) 
          VALUES (?, ?, ?, ?, ?, ?, TRUE)
        `, [setting.key, setting.value, setting.label, setting.description, setting.dataType, setting.category]);

        console.log(`   [SUCCESS] Added setting: ${setting.key}`);
      } else {
        console.log(`   [SKIP] Setting already exists: ${setting.key}`);
      }
    }

    console.log('\n[MIGRATION] SLA Tracking System migration completed successfully!');
    console.log('\n[SUMMARY]');
    console.log('   - SLA columns added to priorities table');
    console.log('   - SLA tracking columns added to tickets table');
    console.log('   - SLA breach log table created');
    console.log('   - SLA analytics view created');
    console.log('   - Performance indexes created');
    console.log('   - Existing tickets backfilled with SLA deadlines');
    console.log('   - System settings configured');
    console.log('\n[NEXT STEPS]');
    console.log('   1. Start the SLA monitoring worker');
    console.log('   2. Configure priority SLA timeframes in Settings > Priorities');
    console.log('   3. View SLA analytics in Dashboard');

  } catch (error) {
    console.error('\n[ERROR] Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migration
migrate();
