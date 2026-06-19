/**
 * SLA Time Formatter Utility
 * Converts minutes to human-readable format
 */

export class SLAFormatter {
  /**
   * Format minutes to human-readable string
   * @param minutes - Number of minutes
   * @returns Formatted string (e.g., "30 minutes", "4 hours", "2 days")
   */
  static formatMinutes(minutes: number | null | undefined): string {
    if (!minutes || minutes === 0) {
      return 'Not set';
    }

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      }
      
      return `${hours}h ${remainingMinutes}m`;
    }

    // Days
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    return `${days}d ${remainingHours}h`;
  }

  /**
   * Parse human-readable string to minutes
   * @param value - String like "30 minutes", "4 hours", "2 days"
   * @returns Number of minutes
   */
  static parseToMinutes(value: string): number {
    if (!value || value === 'Not set') {
      return 0;
    }

    const lowerValue = value.toLowerCase().trim();
    
    // Match patterns like "30 minutes", "4 hours", "2 days"
    const minuteMatch = lowerValue.match(/(\d+)\s*(?:minute|min|m)(?:s)?/);
    const hourMatch = lowerValue.match(/(\d+)\s*(?:hour|hr|h)(?:s)?/);
    const dayMatch = lowerValue.match(/(\d+)\s*(?:day|d)(?:s)?/);

    let totalMinutes = 0;

    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }

    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }

    if (dayMatch) {
      totalMinutes += parseInt(dayMatch[1]) * 1440;
    }

    return totalMinutes;
  }

  /**
   * Get SLA options for dropdown
   */
  static getSLAOptions(): { label: string; value: number }[] {
    return [
      { label: '15 minutes', value: 15 },
      { label: '30 minutes', value: 30 },
      { label: '1 hour', value: 60 },
      { label: '2 hours', value: 120 },
      { label: '4 hours', value: 240 },
      { label: '8 hours', value: 480 },
      { label: '1 day', value: 1440 },
      { label: '2 days', value: 2880 },
      { label: '3 days', value: 4320 },
      { label: '5 days', value: 7200 },
      { label: '1 week', value: 10080 },
      { label: '2 weeks', value: 20160 },
      { label: '1 month', value: 43200 }
    ];
  }

  /**
   * Format time remaining for display
   * @param deadline - Deadline date
   * @returns Formatted string with status indicator
   */
  static formatTimeRemaining(deadline: Date | string): { text: string; status: 'ok' | 'warning' | 'danger' } {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) {
      const absMinutes = Math.abs(minutes);
      return {
        text: `${this.formatMinutes(absMinutes)} overdue`,
        status: 'danger'
      };
    }

    if (minutes < 60) {
      return {
        text: `${minutes}m remaining`,
        status: minutes < 15 ? 'danger' : 'warning'
      };
    }

    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return {
        text: `${hours}h remaining`,
        status: hours < 2 ? 'warning' : 'ok'
      };
    }

    const days = Math.floor(minutes / 1440);
    return {
      text: `${days}d remaining`,
      status: 'ok'
    };
  }
}
