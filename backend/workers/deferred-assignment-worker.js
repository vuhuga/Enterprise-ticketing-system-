/**
 * Phase 2: Deferred Assignment Worker
 * 
 * Background job that:
 * 1. Retries assignment for pending_assignment tickets
 * 2. Escalates priority after configurable time
 * 3. Sends alerts when queue backs up
 * 
 * Runs every 5 minutes by default
 */

const db = require('../db');

// Configuration (can be changed based on your needs)
const RETRY_INTERVAL_MS = 60 * 60 * 1000; // 1 hour (recommended for auto-assignment systems)
const ESCALATION_THRESHOLD_MINUTES = 7 * 24 * 60;   // Escalate after 1 week (10,080 minutes)
const ALERT_THRESHOLD = 100;                // Alert if queue > 100 tickets

// Alternative intervals you can use:
// const RETRY_INTERVAL_MS = 30 * 60 * 1000;  // 30 minutes (more frequent checks)
// const RETRY_INTERVAL_MS = 2 * 60 * 60 * 1000;  // 2 hours (less frequent checks)
// const RETRY_INTERVAL_MS = 10 * 60 * 1000;  // 10 minutes (high-volume systems)
const MAX_LOAD_THRESHOLD = 10;
const COMFORTABLE_LOAD_THRESHOLD = 7;
const CRITICAL_PRIORITIES = new Set(['urgent', 'high']);

class DeferredAssignmentWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.stats = {
      totalProcessed: 0,
      successfulAssignments: 0,
      escalations: 0,
      alertsSent: 0,
      lastRun: null,
      lastAlertSent: null
    };
  }

  /**
   * Start the worker
   */
  start() {
    if (this.isRunning) {
      console.log('[WORKER] Already running');
      return;
    }

    console.log('[WORKER] Starting Deferred Assignment Worker');
    console.log(`   Retry Interval: ${RETRY_INTERVAL_MS / (60 * 1000)} minutes (${RETRY_INTERVAL_MS / (60 * 60 * 1000)} hour(s))`);
    console.log(`   Escalation Threshold: ${ESCALATION_THRESHOLD_MINUTES} minutes (${ESCALATION_THRESHOLD_MINUTES / (24 * 60)} days)`);
    console.log(`   Alert Threshold: ${ALERT_THRESHOLD} tickets\n`);

    this.isRunning = true;

    // Run immediately on start
    this.processQueue();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, RETRY_INTERVAL_MS);
  }

  /**
   * Stop the worker
   */
  stop() {
    if (!this.isRunning) {
      console.log('[WORKER] Not running');
      return;
    }

    console.log('[WORKER] Stopping Deferred Assignment Worker');
    clearInterval(this.intervalId);
    this.isRunning = false;
  }

  /**
   * Main processing function
   */
  async processQueue() {
    const startTime = Date.now();
    console.log(`\n[WORKER] Processing queue at ${new Date().toISOString()}`);

    try {
      // Step 1: Get all pending assignment tickets
      const [pendingTickets] = await db.execute(`
        SELECT 
          t.id,
          t.subject,
          t.priority,
          t.department,
          t.created_at,
          TIMESTAMPDIFF(MINUTE, t.created_at, NOW()) as age_minutes,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          u.email as customer_email
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.status = 'pending_assignment'
        ORDER BY 
          FIELD(t.priority, 'urgent', 'high', 'medium', 'low'),
          t.created_at ASC
      `);

      if (pendingTickets.length === 0) {
        console.log('[WORKER] Queue is empty - no pending tickets');
        this.stats.lastRun = new Date();
        return;
      }

      console.log(`[WORKER] Found ${pendingTickets.length} pending tickets`);

      // Step 2: Check if alert threshold exceeded
      if (pendingTickets.length >= ALERT_THRESHOLD) {
        await this.sendQueueAlert(pendingTickets.length);
      }

      // Step 3: Process each ticket
      let processed = 0;
      let assigned = 0;
      let escalated = 0;

      for (const ticket of pendingTickets) {
        processed++;
        
        // Check if ticket needs escalation
        if (ticket.age_minutes >= ESCALATION_THRESHOLD_MINUTES) {
          const escalationResult = await this.escalateTicket(ticket);
          if (escalationResult) {
            escalated++;
          }
        }

        // Try to assign
        const assignmentResult = await this.attemptAssignment(ticket);
        if (assignmentResult.success) {
          assigned++;
          console.log(`   [SUCCESS] Assigned ticket #${ticket.id} to ${assignmentResult.staffName}`);
        } else {
          console.log(`   [PENDING] Ticket #${ticket.id} still pending: ${assignmentResult.reason}`);
        }
      }

      // Step 4: Update stats
      this.stats.totalProcessed += processed;
      this.stats.successfulAssignments += assigned;
      this.stats.escalations += escalated;
      this.stats.lastRun = new Date();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n[WORKER] Batch Complete:`);
      console.log(`   Processed: ${processed}`);
      console.log(`   Assigned: ${assigned}`);
      console.log(`   Escalated: ${escalated}`);
      console.log(`   Still Pending: ${processed - assigned}`);
      console.log(`   Duration: ${duration}s\n`);

    } catch (error) {
      console.error('[WORKER] Error processing queue:', error.message);
      console.error(error);
    }
  }

  /**
   * Attempt to assign a pending ticket
   */
  async attemptAssignment(ticket) {
    try {
      // Fetch department staff with current load
      const [deptStaff] = await db.execute(`
        SELECT u.id, u.first_name, u.last_name, u.email, d.name as department,
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
      `, [ticket.department]);

      let staffPool = deptStaff;

      // If no department staff, try general pool
      if (staffPool.length === 0) {
        const [generalStaff] = await db.execute(`
          SELECT u.id, u.first_name, u.last_name, u.email, d.name as department,
                 COUNT(t.id) as current_tickets
          FROM users u
          LEFT JOIN departments d ON u.department_id = d.id
          LEFT JOIN tickets t ON u.id = t.assigned_to 
                             AND t.status IN ('new', 'open', 'in_progress', 'pending_assignment')
          WHERE u.role = 'staff' AND u.is_active = TRUE
          GROUP BY u.id
          ORDER BY current_tickets ASC, RAND()
        `);
        staffPool = generalStaff;
      }

      if (staffPool.length === 0) {
        return { success: false, reason: 'NO_STAFF_AVAILABLE' };
      }

      const loads = staffPool.map(s => s.current_tickets);
      const minLoad = Math.min(...loads);

      // Check if we can assign based on priority and load
      const isCritical = CRITICAL_PRIORITIES.has(ticket.priority);

      if (isCritical || minLoad < COMFORTABLE_LOAD_THRESHOLD) {
        // Assign to least busy staff
        const topCandidates = staffPool.slice(0, Math.min(3, staffPool.length));
        const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

        // Update ticket
        await db.execute(`
          UPDATE tickets 
          SET assigned_to = ?, status = 'open', updated_at = NOW()
          WHERE id = ?
        `, [selected.id, ticket.id]);

        // Send notification email (if configured)
        await this.sendAssignmentNotification(ticket, selected);

        return {
          success: true,
          staffId: selected.id,
          staffName: `${selected.first_name} ${selected.last_name}`,
          reason: isCritical ? 'CRITICAL_RETRY' : 'CAPACITY_AVAILABLE'
        };
      } else if (minLoad >= MAX_LOAD_THRESHOLD) {
        return { success: false, reason: 'SYSTEM_STILL_SATURATED' };
      } else {
        return { success: false, reason: 'STAFF_STILL_BUSY' };
      }

    } catch (error) {
      console.error(`   [ERROR] Error assigning ticket #${ticket.id}:`, error.message);
      return { success: false, reason: 'ERROR', error: error.message };
    }
  }

  /**
   * Escalate ticket priority
   */
  async escalateTicket(ticket) {
    try {
      // Priority escalation map
      const escalationMap = {
        'low': 'medium',
        'medium': 'high',
        'high': 'urgent',
        'urgent': 'urgent' // Already at max
      };

      const newPriority = escalationMap[ticket.priority];

      if (newPriority === ticket.priority) {
        // Already at max priority
        return false;
      }

      await db.execute(`
        UPDATE tickets 
        SET priority = ?, updated_at = NOW()
        WHERE id = ?
      `, [newPriority, ticket.id]);

      const ageDays = Math.floor(ticket.age_minutes / (24 * 60));
      const ageHours = Math.floor((ticket.age_minutes % (24 * 60)) / 60);
      console.log(`   [ESCALATED] Ticket #${ticket.id}: ${ticket.priority} -> ${newPriority} (age: ${ageDays}d ${ageHours}h)`);

      // Update ticket object for next assignment attempt
      ticket.priority = newPriority;

      return true;

    } catch (error) {
      console.error(`   [ERROR] Error escalating ticket #${ticket.id}:`, error.message);
      return false;
    }
  }

  /**
   * Send queue alert to administrators
   */
  async sendQueueAlert(queueSize) {
    try {
      // Only send alert once per 6 hours to avoid spam
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      if (this.stats.lastAlertSent && this.stats.lastAlertSent > sixHoursAgo) {
        return; // Already sent alert recently
      }

      console.log(`[WORKER] Queue alert: ${queueSize} pending tickets (threshold: ${ALERT_THRESHOLD})`);

      // Get admin emails only (not staff)
      const [admins] = await db.execute(`
        SELECT email, first_name, last_name
        FROM users
        WHERE role = 'admin' AND is_active = TRUE
      `);

      if (admins.length === 0) {
        console.log('   [WARNING] No admins found to send alert');
        return;
      }

      // Send email notification to all admins
      const nodemailer = require('nodemailer');
      
      // Check if SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log('   [WARNING] SMTP not configured - skipping email notification');
        console.log(`   [INFO] Would send alert to ${admins.length} admin(s):`);
        admins.forEach(admin => {
          console.log(`      - ${admin.first_name} ${admin.last_name} <${admin.email}>`);
        });
        this.stats.alertsSent++;
        this.stats.lastAlertSent = new Date();
        return;
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Send email to each admin
      const emailPromises = admins.map(admin => {
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: admin.email,
          subject: `High Pending Ticket Queue Alert - ${queueSize} Tickets`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #ff6b6b; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Pending Ticket Queue Alert</h1>
              </div>
              
              <div style="padding: 30px; background-color: #f9f9f9;">
                <p>Hello ${admin.first_name},</p>
                
                <p>This is an automated alert from the Enterprise Ticketing System.</p>
                
                <div style="background-color: white; border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0;">
                  <h2 style="margin-top: 0; color: #ff6b6b;">High Queue Volume Detected</h2>
                  <p style="font-size: 18px; margin: 10px 0;">
                    <strong>${queueSize} tickets</strong> are currently in "Pending Assignment" status.
                  </p>
                  <p style="color: #666; margin: 10px 0;">
                    Alert Threshold: ${ALERT_THRESHOLD} tickets
                  </p>
                </div>
                
                <h3>Recommended Actions:</h3>
                <ul style="line-height: 1.8;">
                  <li>Review staff workload distribution</li>
                  <li>Consider manually assigning high-priority tickets</li>
                  <li>Check if additional staff resources are needed</li>
                  <li>Review and adjust auto-assignment thresholds if necessary</li>
                </ul>
                
                <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
                  <p style="margin: 0;"><strong>System Information:</strong></p>
                  <p style="margin: 5px 0;">Alert Time: ${new Date().toLocaleString()}</p>
                  <p style="margin: 5px 0;">Escalation Threshold: ${ESCALATION_THRESHOLD_MINUTES / (24 * 60)} days</p>
                  <p style="margin: 5px 0;">Worker Retry Interval: ${RETRY_INTERVAL_MS / (60 * 60 * 1000)} hour(s)</p>
                </div>
                
                <p style="margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard" 
                     style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View Dashboard
                  </a>
                </p>
              </div>
              
              <div style="background-color: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">Enterprise Ticketing System - Automated Alert</p>
                <p style="margin: 5px 0;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          `
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);
      
      console.log(`   [SUCCESS] Alert emails sent to ${admins.length} administrator(s):`);
      admins.forEach(admin => {
        console.log(`      - ${admin.first_name} ${admin.last_name} <${admin.email}>`);
      });
      
      this.stats.alertsSent++;
      this.stats.lastAlertSent = new Date();

    } catch (error) {
      console.error('   [ERROR] Error sending queue alert:', error.message);
    }
  }

  /**
   * Send assignment notification
   */
  async sendAssignmentNotification(ticket, staff) {
    try {
      // TODO: Integrate with email system
      // For now, just log
      console.log(`   [INFO] Would notify ${staff.email} about ticket #${ticket.id}`);
    } catch (error) {
      console.error('   [ERROR] Error sending notification:', error.message);
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
const worker = new DeferredAssignmentWorker();

module.exports = worker;
