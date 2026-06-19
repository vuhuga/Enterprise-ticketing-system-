import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmation-overlay" *ngIf="confirmationService.isVisible$ | async" 
         (click)="onCancel()" 
         (keydown.escape)="onCancel()" 
         tabindex="0">
      <div class="confirmation-dialog" 
           (click)="$event.stopPropagation()" 
           (keydown)="$event.stopPropagation()" 
           tabindex="-1">
        <div class="dialog-header">
          <h3>{{ (confirmationService.config$ | async)?.title }}</h3>
        </div>
        <div class="dialog-body">
          <p>{{ (confirmationService.config$ | async)?.message }}</p>
        </div>
        <div class="dialog-footer">
          <button 
            class="btn btn-secondary" 
            (click)="onCancel()">
            {{ (confirmationService.config$ | async)?.cancelText }}
          </button>
          <button 
            class="btn"
            [ngClass]="(confirmationService.config$ | async)?.confirmButtonClass"
            (click)="onConfirm()">
            {{ (confirmationService.config$ | async)?.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .confirmation-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
    }

    .dialog-header {
      padding: 20px 24px 0;
      border-bottom: 1px solid #e1e5e9;
    }

    .dialog-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .dialog-body {
      padding: 20px 24px;
    }

    .dialog-body p {
      margin: 0;
      color: #5a6c7d;
      line-height: 1.5;
    }

    .dialog-footer {
      padding: 0 24px 20px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }
  `]
})
export class ConfirmationDialogComponent {
  confirmationService = inject(ConfirmationService);

  onConfirm(): void {
    this.confirmationService.onConfirm();
  }

  onCancel(): void {
    this.confirmationService.onCancel();
  }
}