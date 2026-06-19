/**
 * SLA Calculator Service
 * 
 * Enterprise-grade service for calculating SLA deadlines and breach status.
 * Implements business logic for dual-phase SLA tracking.
 * 
 * @author Enterprise Ticketing System
 * @version 2.0.0
 */

const db = require('../db');

class SLACalculator {
  /**
   * Calculate assignment deadline for a ticket
   * @param {Date} createdAt - Ticket creation timestamp
   * @param {number} assignmentSLAMinutes - SLA minutes from priority
   * @returns {Date} Assignment deadline
   */
  static calculateAssignmentDeadline(createdAt, assignmentSLAMinutes) {
    const deadline = new Date(createdAt);
    deadline.setMinutes(deadline.getMinutes() + assignmentSLAMinutes);
    return deadline;
  }

  /**
   * Calculate resolution deadline for a ticket
   * @param {Date} assignedAt - Ticket assignment timestamp
   * @param {number} resolutionSLAMinutes - SLA minutes from priority
   * @returns {Date} Resolution deadline
   */
  static calculateResolutionDeadline(assignedAt, resolutionSLAMinutes) {
    const deadline = new Date(assignedAt);
    deadline.setMinutes(deadline.getMinutes() + resolutionSLAMinutes);
    return deadline;
  }

  /**
   * Get priority SLA configuration
   * @param {string} priorityValue - Priority value (urgent, high, medium, low)
   * @returns {Promise<Object>} Priority SLA configuration
   */
  static async getPrioritySLA(priorityValue) {
    const [priorities] = await db.execute(`
      SELECT 
        value,
        label,
        assignment_sla_minutes,
        resolution_sla_minutes
      FROM priorities
      WHERE value = ? AND is_active = TRUE
      LIMIT 1
    `, [priorityValue]);

    if (priorities.length === 0) {
      throw new Error(`Priority '${priorityValue}' not found or inactive`);
    }

    return priorities[0];
  }

  /**
   * Calculate SLA deadlines for a new ticket
   * @param {string} priority - Ticket priority
   * @param {Date} createdAt - Ticket creation time
   * @returns {Promise<Object>} SLA deadlines
   */
  static async calculateTicketSLA(priority, createdAt = new Date()) {
    const prioritySLA = await this.getPrioritySLA(priority);

    const assignmentDeadline = this.calculateAssignmentDeadline(
      createdAt,
      prioritySLA.assignment_sla_minutes
    );

    return {
      assignmentDeadline,
      assignmentSLAMinutes: prioritySLA.assignment_sla_minutes,
      resolutionSLAMinutes: prioritySLA.resolution_sla_minutes
    };
  }

  /**
   * Update ticket with assignment SLA
   * @param {number} ticketId - Ticket ID
   * @param {number} assignedTo - User ID of assignee
   * @param {Date} assignedAt - Assignment timestamp
   * @returns {Promise<void>}
   */
  static async updateAssignmentSLA(ticketId, assignedTo, assignedAt = new Date()) {
    // Get ticket priority
    const [tickets] = await db.execute(`
      SELECT priority FROM tickets WHERE id = ?
    `, [ticketId]);

    if (tickets.length === 0) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    const prioritySLA = await this.getPrioritySLA(tickets[0].priority);

    const resolutionDeadline = this.calculateResolutionDeadline(
      assignedAt,
      prioritySLA.resolution_sla_minutes
    );

    await db.execute(`
      UPDATE tickets
      SET 
        assigned_at = ?,
        resolution_deadline = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [assignedAt, resolutionDeadline, ticketId]);

    console.log(`[SLA] Ticket #${ticketId} assigned - Resolution deadline: ${resolutionDeadline.toISOString()}`);
  }

  /**
   * Check if assignment SLA is breached
   * @param {Date} createdAt - Ticket creation time
   * @param {Date} assignmentDeadline - Assignment deadline
   * @param {Date|null} assignedAt - Assignment time (null if not assigned)
   * @returns {Object} Breach status
   */
  static checkAssignmentBreach(createdAt, assignmentDeadline, assignedAt) {
    const now = new Date();
    const deadline = new Date(assignmentDeadline);

    // If assigned, check if it was assigned before deadline
    if (assignedAt) {
      const assigned = new Date(assignedAt);
      if (assigned > deadline) {
        const breachMinutes = Math.floor((assigned - deadline) / 60000);
        return {
          breached: true,
          breachDuration: breachMinutes,
          status: 'breached_assignment'
        };
      }
      return {
        breached: false,
        breachDuration: 0,
        status: 'on_time'
      };
    }

    // Not assigned yet - check if deadline passed
    if (now > deadline) {
      const breachMinutes = Math.floor((now - deadline) / 60000);
      return {
        breached: true,
        breachDuration: breachMinutes,
        status: 'breached_assignment'
      };
    }

    // Check if at risk (80% of time elapsed)
    const totalTime = deadline - new Date(createdAt);
    const elapsedTime = now - new Date(createdAt);
    const percentageElapsed = (elapsedTime / totalTime) * 100;

    if (percentageElapsed >= 80) {
      return {
        breached: false,
        breachDuration: 0,
        status: 'at_risk'
      };
    }

    return {
      breached: false,
      breachDuration: 0,
      status: 'on_time'
    };
  }

  /**
   * Check if resolution SLA is breached
   * @param {Date} assignedAt - Assignment time
   * @param {Date} resolutionDeadline - Resolution deadline
   * @param {Date|null} resolvedAt - Resolution time (null if not resolved)
   * @param {string} status - Current ticket status
   * @returns {Object} Breach status
   */
  static checkResolutionBreach(assignedAt, resolutionDeadline, resolvedAt, status) {
    const now = new Date();
    const deadline = new Date(resolutionDeadline);

    // If resolved, check if it was resolved before deadline
    if (resolvedAt || status === 'resolved' || status === 'closed') {
      const resolved = resolvedAt ? new Date(resolvedAt) : now;
      if (resolved > deadline) {
        const breachMinutes = Math.floor((resolved - deadline) / 60000);
        return {
          breached: true,
          breachDuration: breachMinutes,
          status: 'breached_resolution'
        };
      }
      return {
        breached: false,
        breachDuration: 0,
        status: 'on_time'
      };
    }

    // Not resolved yet - check if deadline passed
    if (now > deadline) {
      const breachMinutes = Math.floor((now - deadline) / 60000);
      return {
        breached: true,
        breachDuration: breachMinutes,
        status: 'breached_resolution'
      };
    }

    // Check if at risk (80% of time elapsed)
    const totalTime = deadline - new Date(assignedAt);
    const elapsedTime = now - new Date(assignedAt);
    const percentageElapsed = (elapsedTime / totalTime) * 100;

    if (percentageElapsed >= 80) {
      return {
        breached: false,
        breachDuration: 0,
        status: 'at_risk'
      };
    }

    return {
      breached: false,
      breachDuration: 0,
      status: 'on_time'
    };
  }

  /**
   * Get comprehensive SLA status for a ticket
   * @param {Object} ticket - Ticket object with SLA fields
   * @returns {Object} Complete SLA status
   */
  static getTicketSLAStatus(ticket) {
    const assignmentStatus = this.checkAssignmentBreach(
      ticket.created_at,
      ticket.assignment_deadline,
      ticket.assigned_at
    );

    let resolutionStatus = { breached: false, breachDuration: 0, status: 'on_time' };
    
    if (ticket.assigned_at && ticket.resolution_deadline) {
      resolutionStatus = this.checkResolutionBreach(
        ticket.assigned_at,
        ticket.resolution_deadline,
        ticket.resolved_at,
        ticket.status
      );
    }

    // Determine overall SLA status
    let overallStatus = 'on_time';
    if (assignmentStatus.breached && resolutionStatus.breached) {
      overallStatus = 'breached_both';
    } else if (assignmentStatus.breached) {
      overallStatus = 'breached_assignment';
    } else if (resolutionStatus.breached) {
      overallStatus = 'breached_resolution';
    } else if (assignmentStatus.status === 'at_risk' || resolutionStatus.status === 'at_risk') {
      overallStatus = 'at_risk';
    }

    return {
      assignment: assignmentStatus,
      resolution: resolutionStatus,
      overall: overallStatus
    };
  }

  /**
   * Format SLA time remaining for display
   * @param {Date} deadline - SLA deadline
   * @returns {string} Formatted time remaining
   */
  static formatTimeRemaining(deadline) {
    const now = new Date();
    const diff = new Date(deadline) - now;

    if (diff < 0) {
      const minutes = Math.abs(Math.floor(diff / 60000));
      if (minutes < 60) return `${minutes}m overdue`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h overdue`;
      const days = Math.floor(hours / 24);
      return `${days}d overdue`;
    }

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m remaining`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  }
}

module.exports = SLACalculator;
