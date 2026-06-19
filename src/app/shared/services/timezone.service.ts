import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  
  /**
   * Get the user's detected timezone
   */
  getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Convert a UTC date string from backend to user's local timezone
   */
  convertToUserTimezone(utcDateString: string | Date): Date {
    if (!utcDateString) return new Date();
    
    // Handle MySQL datetime format (assumes UTC from backend)
    let date: Date;
    if (typeof utcDateString === 'string') {
      // If no timezone info, treat as UTC (MySQL default)
      if (!utcDateString.includes('T') && !utcDateString.includes('Z') && !utcDateString.includes('+')) {
        date = new Date(utcDateString + 'Z'); // Add Z to treat as UTC
      } else {
        date = new Date(utcDateString);
      }
    } else {
      date = new Date(utcDateString);
    }
    
    return date;
  }

  /**
   * Format date for display in user's timezone
   */
  formatForDisplay(date: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
    const convertedDate = this.convertToUserTimezone(date);
    
    if (isNaN(convertedDate.getTime())) {
      return 'Invalid date';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: this.getUserTimezone()
    };

    return convertedDate.toLocaleString('en-US', { ...defaultOptions, ...options });
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(date: string | Date): string {
    const convertedDate = this.convertToUserTimezone(date);
    const now = new Date();
    
    if (isNaN(convertedDate.getTime())) {
      return 'Invalid date';
    }

    const diffInSeconds = Math.floor((now.getTime() - convertedDate.getTime()) / 1000);

    // Handle future dates
    if (diffInSeconds < 0) {
      const futureDiff = Math.abs(diffInSeconds);
      if (futureDiff < 60) return 'in a few seconds';
      const futureMinutes = Math.floor(futureDiff / 60);
      if (futureMinutes < 60) {
        return `in ${futureMinutes} minute${futureMinutes === 1 ? '' : 's'}`;
      }
      return 'in the future';
    }

    // Past dates
    if (diffInSeconds < 60) {
      return diffInSeconds <= 5 ? 'just now' : `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }

    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
  }

  /**
   * Get user's timezone info for display
   */
  getTimezoneInfo(): { timezone: string; offset: string; name: string } {
    const timezone = this.getUserTimezone();
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset <= 0 ? '+' : '-';
    const offsetString = `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
    
    // Get timezone name
    const formatter = new Intl.DateTimeFormat('en', {
      timeZoneName: 'long',
      timeZone: timezone
    });
    const parts = formatter.formatToParts(now);
    const timezoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone;

    return {
      timezone,
      offset: offsetString,
      name: timezoneName
    };
  }
}