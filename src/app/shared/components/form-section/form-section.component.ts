import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-form-section',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="form-section">
      <div class="section-header" *ngIf="title || subtitle">
        <div class="section-icon" *ngIf="icon" [innerHTML]="icon"></div>
        <div class="section-text">
          <h3 class="section-title" *ngIf="title">{{ title }}</h3>
          <p class="section-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="section-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
    styles: [`
    .form-section {
      margin-bottom: 2rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--slate-200);
    }

    .section-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-lg);
      background: var(--primary-50);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.25rem;
    }

    .section-text {
      flex: 1;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
      line-height: 1.4;
    }

    .section-subtitle {
      font-size: 0.875rem;
      color: var(--slate-600);
      margin: 0.25rem 0 0 0;
      line-height: 1.5;
    }

    .section-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }

    @media (max-width: 640px) {
      .section-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FormSectionComponent {
    @Input() title: string = '';
    @Input() subtitle: string = '';
    @Input() icon: string = '';
}
