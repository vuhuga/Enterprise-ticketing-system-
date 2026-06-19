/**
 * Migration: Add pending_assignment status support
 * 
 * This migration adds the 'pending_assignment' status to the tickets table
 * and ticket_statuses table for Phase 1 intelligent auto-assignment.
 * 
 * Run with: node backend/migrations/001-add-pending-assignment-status.js
 */

require('dotenv').config();
const db = require('../db');

async function migrate() {
  console.log('🔄 Starting migration: Add pending_assignment status...\n');

  try {
    // Step 1: Check if pending_assignment already exists in ENUM
    console.log('📋 Step 1: Checking tickets table status ENUM...');
    const [columns] = await db.execute(`
      SHOW COLUMNS FROM tickets WHERE Field = 'status'
    `);

    if (columns.length > 0) {
      const enumValues = columns[0].Type;
      console.log(`   Current ENUM: ${enumValues}`);

      if (!enumValues.includes('pending_assignment')) {
        console.log('   ⚠️  pending_assignment not found in ENUM, adding it...');

        // Alter the ENUM to include pending_assignment
        await db.execute(`
          ALTER TABLE tickets 
          MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'resolved', 'closed', 'pending_assignment') 
          DEFAULT 'new'
        `);

        console.log('   ✅ Added pending_assignment to tickets.status ENUM');
      } else {
        console.log('   ✅ pending_assignment already exists in ENUM');
      }
    }

    // Step 2: Add pending_assignment to ticket_statuses table if not exists
    console.log('\n📋 Step 2: Checking ticket_statuses table...');
    const [statusExists] = await db.execute(`
      SELECT COUNT(*) as count FROM ticket_statuses WHERE value = 'pending_assignment'
    `);

    if (statusExists[0].count === 0) {
      console.log('   ⚠️  pending_assignment status not found, adding it...');

      // Update sort orders for existing statuses
      await db.execute(`
        UPDATE ticket_statuses 
        SET sortOrder = sortOrder + 1 
        WHERE sortOrder >= 4
      `);

      // Insert pending_assignment status
      await db.execute(`
        INSERT INTO ticket_statuses (value, label, color, sortOrder, isActive, isFinal) 
        VALUES ('pending_assignment', 'Pending Assignment', '#ff6b6b', 4, TRUE, FALSE)
      `);

      console.log('   ✅ Added pending_assignment to ticket_statuses table');
    } else {
      console.log('   ✅ pending_assignment status already exists');
    }

    // Step 3: Update system settings to enable auto-assignment
    console.log('\n📋 Step 3: Checking auto-assignment system setting...');
    const [settingExists] = await db.execute(`
      SELECT value FROM system_settings WHERE \`key\` = 'auto_assign_tickets'
    `);

    if (settingExists.length > 0) {
      console.log(`   Current value: ${settingExists[0].value}`);
      console.log('   ℹ️  Auto-assignment setting exists (not changing current value)');
    } else {
      console.log('   ⚠️  Auto-assignment setting not found, adding it...');
      await db.execute(`
        INSERT INTO system_settings (\`key\`, value, label, description, dataType, category, isEditable) 
        VALUES ('auto_assign_tickets', 'false', 'Auto Assign Tickets', 
                'Automatically assign tickets to available agents based on load and priority', 
                'boolean', 'system', TRUE)
      `);
      console.log('   ✅ Added auto_assign_tickets system setting');
    }

    // Step 4: Add threshold settings
    console.log('\n📋 Step 4: Adding load threshold settings...');

    const thresholdSettings = [{
        key: 'max_load_threshold',
        value: '10',
        label: 'Maximum Load Threshold',
        description: 'Maximum number of active tickets per staff before system saturation',
        dataType: 'number',
        category: 'system'
      },
      {
        key: 'comfortable_load_threshold',
        value: '7',
        label: 'Comfortable Load Threshold',
        description: 'Comfortable workload threshold for non-critical ticket assignment',
        dataType: 'number',
        category: 'system'
      }
    ];

    for (const setting of thresholdSettings) {
      const [exists] = await db.execute(`
        SELECT COUNT(*) as count FROM system_settings WHERE \`key\` = ?
      `, [setting.key]);

      if (exists[0].count === 0) {
        await db.execute(`
          INSERT INTO system_settings (\`key\`, value, label, description, dataType, category, isEditable) 
          VALUES (?, ?, ?, ?, ?, ?, TRUE)
        `, [setting.key, setting.value, setting.label, setting.description, setting.dataType, setting.category]);
        console.log(`   ✅ Added ${setting.key} setting`);
      } else {
        console.log(`   ✅ ${setting.key} already exists`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - pending_assignment status added to tickets table');
    console.log('   - pending_assignment status added to ticket_statuses table');
    console.log('   - Auto-assignment system settings configured');
    console.log('   - Load threshold settings added');
    console.log('\n🎯 Phase 1 intelligent auto-assignment is now ready!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migration
migrate();
