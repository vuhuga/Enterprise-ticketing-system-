import { Pipe, PipeTransform, NgZone, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';

@Pipe({
  name: 'timeAgo',
  pure: false,
  standalone: true
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private changeDetector = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  private timer: ReturnType<typeof setTimeout> | null = null;

  transform(value: Date | string): string {
    if (!value) return '';

    this.removeTimer();
    
    // Handle local timestamp from backend (without timezone info)
    let date: Date;
    if (typeof value === 'string') {
      // If it's a string without timezone info, treat it as local time
      if (value.includes('T') && !value.includes('Z') && !value.includes('+')) {
        // Local datetime format from backend
        date = new Date(value);
      } else {
        // UTC or timezone-aware format
        date = new Date(value);
      }
    } else {
      date = new Date(value);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const seconds = Math.round(Math.abs((now.getTime() - date.getTime()) / 1000));
    
    // Determine update frequency based on age
    let timeToUpdate: number;
    if (seconds < 60) {
      timeToUpdate = 1000; // Update every second for recent items
    } else if (seconds < 3600) {
      timeToUpdate = 60000; // Update every minute for items less than an hour old
    } else {
      timeToUpdate = 3600000; // Update every hour for older items
    }

    // Schedule next update outside Angular zone for performance
    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => {
        this.zone.run(() => this.changeDetector.markForCheck());
      }, timeToUpdate);
    });

    return formatDistanceToNow(date, { addSuffix: true });
  }

  ngOnDestroy() {
    this.removeTimer();
  }

  private removeTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}