import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date, format = 'medium'): string {
    if (!value) return '';

    const date = new Date(value);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      },
      medium: {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      },
      long: {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      },
      full: {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      },
      datetime: {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    };

    const options = formatOptions[format] || formatOptions['medium'];
    return date.toLocaleString('en-US', options);
  }
}