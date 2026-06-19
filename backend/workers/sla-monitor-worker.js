/**
 * SLA Monitoring Worker
 * 
 * Background service that monitors SLA compliance and flags breaches.
 * Runs on configurable interval to check assignment and resolution SLAs.
 * 
 * @author Enterprise Ticketing System
 * @version 2.0.0
 */

const db = require('../db');
const SLACalculator = require('../services/SLACalculator');

// Configuration
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 100; // Process tickets in batches

class SLAMonitorWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.stats = {
      totalChecked: 0,
      assignmentBreaches: 0,
      resolutionBreaches: 0,
      notificationsSent: 0,
      lastRun: null,
      errors: 0
    };
  }

  /**
   * Start the SLA monitoring worker
   */
  start() {
    if (this.isRunning) {
      console.log('[SLA-WORKER] Already running');
      return;
    }

    console.log('[SLA-WORKER] Starting SLA Monitoring Worker');
    console.log(`   Check Interval: ${CHECK_INTERVAL_MS / 1000}s`);
    console.log(`   Batch Size: ${BATCH_SIZE} tickets\n`);

    this.isRunning = true;

    // Run immediately on start
    this.monitorSLA();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.monitorSLA();
    }, CHECK_INTERVAL_MS);
  }

  /**
   * Stop the worker
   */
  stop() {
    if (!this.isRunning) {
      console.log('[SLA-WORKER] Not running');
      return;
    }

    console.log('[SLA-WORKER] Stopping SLA Monitoring Worker');
    clearInterval(this.intervalId);
    this.isRunning = false;
  }

  /**
   * Main monitoring function
   */
  async monitorSLA() {
    const startTime = Date.now();
    console.log(`\n[SLA-WORKER] Starting SLA check at ${new Date().toISOString()}`);

    try {
      // Check if SLA monitoring is enabled
      const [settings] = await db.execute(`
        SELECT value FROM system_settings WHERE \`key\` = 'sla_monitoring_enabled'
      `);

      if (settings.length > 0 && settings[0].value === 'false') {
        console.log('[SLA-WORKER] SLA monitoring is disabled in system settings');
        return;
      }

      // Monitor assignment SLA
      await this.monitorAssignmentSLA();

      // Monitor resolution SLA
      await this.monitorResolutionSLA();

      // Update statistics
      this.stats.lastRun = new Date();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n[SLA-WORKER] Check Complete:`);
      console.log(`   Total Checked: ${this.stats.totalChecked}`);
      console.log(`   Assignment Breaches: ${this.stats.assignmentBreaches}`);
      console.log(`   Resolution Breaches: ${this.stats.resolutionBreaches}`);
      console.log(`   Notifications Sent: ${this.stats.notificationsSent}`);
      console.log(`   Duration: ${duration}s\n`);

    } catch (error) {
      this.stats.errors++;
      console.error('[SLA-WORKER] Error during SLA monitoring:', error.message);
      console.error(error);
    }
  }

  /**
   * Monitor assignment SLA for unassigned tickets
   */
  async monitorAssignmentSLA() {
    console.log('[SLA-WORKER] Checking assignment SLA...');

    // Get tickets that are not assigned and past deadline
    const [tickets] = await db.execute(`
      SELECT 
        t.id,
        t.subject,
        t.priority,
        t.department,
        t.created_at,
        t.assignment_deadline,
        t.assigned_at,
        t.assignment_sla_breached,
        p.assignment_sla_minutes
      FROM tickets t
      INNER JOIN priorities p ON t.priority = p.value
      WHERE t.assigned_to IS NULL
        AND t.assignment_deadline < NOW()
        AND t.status NOT IN ('resolved', 'closed')
      ORDER BY t.assignment_deadline ASC
      LIMIT ${BATCH_SIZE}
    `);

    if (tickets.length === 0) {
      console.log('   [OK] No assignment SLA breaches detected');
      return;
    }

    console.log(`   [ALERT] Found ${tickets.length} tickets with assignment SLA breach`);

    for (const ticket of tickets) {
      await this.handleAssignmentBreach(ticket);
    }
  }

  /**
   * Monitor resolution SLA for assigned tickets
   */
  async monitorResolutionSLA() {
    console.log('[SLA-WORKER] Checking resolution SLA...');

    // Get assigned tickets that are past resolution deadline
    const [tickets] = await db.execute(`
      SELECT 
        t.id,
        t.subject,
        t.priority,
        t.department,
        t.assigned_to,
        t.assigned_at,
        t.resolution_deadline,
        t.resolved_at,
        t.resolution_sla_breached,
        t.status,
        p.resolution_sla_minutes,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name,
        u.email as assigned_to_email
      FROM tickets t
      INNER JOIN priorities p ON t.priority = p.value
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to IS NOT NULL
        AND t.resolution_deadline < NOW()
        AND t.status NOT IN ('resolved', 'closed')
      ORDER BY t.resolution_deadline ASC
      LIMIT ${BATCH_SIZE}
    `);

    if (tickets.length === 0) {
      console.log('   [OK] No resolution SLA breaches detected');
      return;
    }

    console.log(`   [ALERT] Found ${tickets.length} tickets with resolution SLA breach`);

    for (const ticket of tickets) {
      await this.handleResolutionBreach(ticket);
    }
  }

  /**
   * Handle assignment SLA breach
   * @param {Object} ticket - Ticket object
   */
  async handleAssignmentBreach(ticket) {
    try {
      const breachDuration = Math.floor(
        (new Date() - new Date(ticket.assignment_deadline)) / 60000
      );

      // Update ticket
      await db.execute(`
        UPDATE tickets
        SET 
          assignment_sla_breached = TRUE,
          assignment_breach_duration = ?,
          sla_status = CASE 
            WHEN resolution_sla_breached = TRUE THEN 'breached_both'
            ELSE 'breached_assignment'
          END,
          updated_at = NOW()
        WHERE id = ?
      `, [breachDuration, ticket.id]);

      // Log breach if not already logged
      if (!ticket.assignment_sla_breached) {
        await this.logSLABreach(ticket, 'assignment', breachDuration);
        await this.sendBreachNotification(ticket, 'assignment', breachDuration);
        this.stats.assignmentBreaches++;
      }

      console.log(`   [BREACH] Ticket #${ticket.id} - Assignment SLA breached by ${breachDuration} minutes`);

    } catch (error) {
      console.error(`   [ERROR] Failed to handle assignment breach for ticket #${ticket.id}:`, error.message);
    }
  }

  /**
   * Handle resolution SLA breach
   * @param {Object} ticket - Ticket object
   */
  async handleResolutionBreach(ticket) {
    try {
      const breachDuration = Math.floor(
        (new Date() - new Date(ticket.resolution_deadline)) / 60000
      );

      // Update ticket
      await db.execute(`
        UPDATE tickets
        SET 
          resolution_sla_breached = TRUE,
          resolution_breach_duration = ?,
          sla_status = CASE 
            WHEN assignment_sla_breached = TRUE THEN 'breached_both'
            ELSE 'breached_resolution'
          END,
          updated_at = NOW()
        WHERE id = ?
      `, [breachDuration, ticket.id]);

      // Log breach if not already logged
      if (!ticket.resolution_sla_breached) {
        await this.logSLABreach(ticket, 'resolution', breachDuration);
        await this.sendBreachNotification(ticket, 'resolution', breachDuration);
        this.stats.resolutionBreaches++;
      }

      console.log(`   [BREACH] Ticket #${ticket.id} - Resolution SLA breached by ${breachDuration} minutes`);

    } catch (error) {
      console.error(`   [ERROR] Failed to handle resolution breach for ticket #${ticket.id}:`, error.message);
    }
  }

  /**
   * Log SLA breach to audit table
   * @param {Object} ticket - Ticket object
   * @param {string} breachType - 'assignment' or 'resolution'
   * @param {number} breachDuration - Minutes past deadline
   */
  async logSLABreach(ticket, breachType, breachDuration) {
    try {
      const deadline = breachType === 'assignment' 
        ? ticket.assignment_deadline 
        : ticket.resolution_deadline;

      await db.execute(`
        INSERT INTO sla_breach_logs 
        (ticket_id, breach_type, priority, expected_deadline, actual_breach_time, breach_duration_minutes, assigned_to)
        VALUES (?, ?, ?, ?, NOW(), ?, ?)
      `, [
        ticket.id,
        breachType,
        ticket.priority,
        deadline,
        breachDuration,
        ticket.assigned_to || null
      ]);

    } catch (error) {
      console.error(`   [ERROR] Failed to log SLA breach for ticket #${ticket.id}:`, error.message);
    }
  }

  /**
   * Send breach notification to admins/assignee
   * @param {Object} ticket - Ticket object
   * @param {string} breachType - 'assignment' or 'resolution'
   * @param {number} breachDuration - Minutes past deadline
   */
  async sendBreachNotification(ticket, breachType, breachDuration) {
    try {
      // Check if notifications are enabled
      const [settings] = await db.execute(`
        SELECT value FROM system_settings WHERE \`key\` = 'sla_notification_enabled'
      `);

      if (settings.length > 0 && settings[0].value === 'false') {
        return;
      }

      // Get admin emails
      const [admins] = await db.execute(`
        SELECT email, first_name, last_name
        FROM users
        WHERE role = 'admin' AND is_active = TRUE
      `);

      if (admins.length === 0) {
        console.log('   [WARNING] No admins found for notification');
        return;
      }

      // Check if SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log(`   [INFO] Would send ${breachType} SLA breach notification to ${admins.length} admin(s)`);
        return;
      }

      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const breachTypeLabel = breachType === 'assignment' ? 'Assignment' : 'Resolution';
      const hours = Math.floor(breachDuration / 60);
      const minutes = breachDuration % 60;
      const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Send email to each admin
      const emailPromises = admins.map(admin => {
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: admin.email,
          subject: `SLA Breach Alert: ${breachTypeLabel} - Ticket #${ticket.id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">${breachTypeLabel} SLA Breach</h1>
              </div>
              
              <div style="padding: 30px; background-color: #f9f9f9;">
                <p>Hello ${admin.first_name},</p>
                
                <p>An SLA breach has been detected:</p>
                
                <div style="background-color: white; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                  <h2 style="margin-top: 0; color: #dc3545;">Ticket #${ticket.id}</h2>
                  <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                  <p style="margin: 5px 0;"><strong>Priority:</strong> ${ticket.priority.toUpperCase()}</p>
                  <p style="margin: 5px 0;"><strong>Department:</strong> ${ticket.department}</p>
                  <p style="margin: 5px 0;"><strong>Breach Type:</strong> ${breachTypeLabel} SLA</p>
                  <p style="margin: 5px 0;"><strong>Overdue By:</strong> ${durationText}</p>
                  ${ticket.assigned_to_name ? `<p style="margin: 5px 0;"><strong>Assigned To:</strong> ${ticket.assigned_to_name}</p>` : ''}
                </div>
                
                <h3>Immediate Action Required:</h3>
                <ul style="line-height: 1.8;">
                  ${breachType === 'assignment' 
                    ? '<li>Assign this ticket to an available staff member immediately</li>'
                    : '<li>Follow up with assigned staff member for immediate resolution</li>'
                  }
                  <li>Review ticket priority and escalate if necessary</li>
                  <li>Update customer on status and expected resolution time</li>
                </ul>
                
                <p style="margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/tickets/${ticket.id}" 
                     style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View Ticket
                  </a>
                </p>
              </div>
              
              <div style="background-color: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">Enterprise Ticketing System - SLA Monitoring</p>
                <p style="margin: 5px 0;">This is an automated alert. Please do not reply to this email.</p>
              </div>
            </div>
          `
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);
      
      // Update breach log
      await db.execute(`
        UPDATE sla_breach_logs
        SET notified = TRUE, notification_sent_at = NOW()
        WHERE ticket_id = ? AND breach_type = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [ticket.id, breachType]);

      this.stats.notificationsSent++;
      console.log(`   [NOTIFICATION] Sent ${breachType} breach alert to ${admins.length} admin(s)`);

    } catch (error) {
      console.error(`   [ERROR] Failed to send breach notification for ticket #${ticket.id}:`, error.message);
    }
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      uptime: this.stats.lastRun ? Date.now() - this.stats.lastRun.getTime() : 0
    };
  }
}

// Export singleton instance
const worker = new SLAMonitorWorker();

module.exports = worker;
