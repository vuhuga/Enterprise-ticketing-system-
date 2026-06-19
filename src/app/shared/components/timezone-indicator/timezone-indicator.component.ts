import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimezoneService } from '../../services/timezone.service';

@Component({
  selector: 'app-timezone-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timezone-indicator" [title]="fullTimezoneInfo">
      <span class="timezone-icon">🌍</span>
      <span class="timezone-text">{{ timezoneInfo.offset }}</span>
    </div>
  `,
  styles: [`
    .timezone-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: rgba(0, 123, 255, 0.1);
      border: 1px solid rgba(0, 123, 255, 0.2);
      border-radius: 12px;
      font-size: 0.75rem;
      color: #007bff;
      cursor: help;
    }

    .timezone-icon {
      font-size: 0.875rem;
    }

    .timezone-text {
      font-weight: 500;
      font-family: monospace;
    }

    .timezone-indicator:hover {
      background: rgba(0, 123, 255, 0.15);
      border-color: rgba(0, 123, 255, 0.3);
    }
  `]
})
export class TimezoneIndicatorComponent implements OnInit {
  private timezoneService = inject(TimezoneService);
  
  timezoneInfo: { timezone: string; offset: string; name: string } = {
    timezone: '',
    offset: '',
    name: ''
  };
  
  fullTimezoneInfo = '';

  ngOnInit() {
    this.timezoneInfo = this.timezoneService.getTimezoneInfo();
    this.fullTimezoneInfo = `Your timezone: ${this.timezoneInfo.name} (${this.timezoneInfo.offset})`;
  }
}