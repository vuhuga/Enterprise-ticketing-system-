import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)" [@fadeIn]>
      <div class="modal-container" [ngClass]="size" (click)="$event.stopPropagation()" [@slideIn]>
        <!-- Header -->
        <div class="modal-header">
          <div class="header-content">
            <div class="header-icon" *ngIf="icon" [innerHTML]="icon"></div>
            <div class="header-text">
              <h2 class="modal-title">{{ title }}</h2>
              <p class="modal-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
            </div>
          </div>
          <button 
            type="button" 
            class="close-button" 
            (click)="onClose()"
            [attr.aria-label]="'Close modal'">
            <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" [ngClass]="{'no-padding': noPadding}">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[modal-footer]"></ng-content>
          
          <!-- Default footer if no custom footer provided -->
          <div class="default-footer" *ngIf="!hasCustomFooter">
            <button 
              type="button" 
              class="btn btn-ghost" 
              (click)="onCancel()"
              [disabled]="loading">
              {{ cancelText }}
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="onConfirm()"
              [disabled]="loading || confirmDisabled">
              <span class="btn-spinner" *ngIf="loading"></span>
              <span>{{ loading ? loadingText : confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-container {
      background: white;
      border-radius: var(--radius-2xl);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--slate-200);

      &.sm {
        width: 100%;
        max-width: 400px;
      }

      &.md {
        width: 100%;
        max-width: 600px;
      }

      &.lg {
        width: 100%;
        max-width: 800px;
      }

      &.xl {
        width: 100%;
        max-width: 1000px;
      }

      &.full {
        width: calc(100vw - 2rem);
        max-width: 1200px;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1.75rem 2rem;
      border-bottom: 1px solid var(--slate-200);
      flex-shrink: 0;

      .header-content {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        flex: 1;
      }

      .header-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-xl);
        background: var(--primary-50);
        color: var(--primary-600);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.5rem;
      }

      .header-text {
        flex: 1;
      }

      .modal-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--slate-900);
        margin: 0;
        line-height: 1.3;
      }

      .modal-subtitle {
        font-size: 0.9375rem;
        color: var(--slate-600);
        margin: 0.375rem 0 0 0;
        line-height: 1.5;
      }

      .close-button {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-lg);
        border: none;
        background: transparent;
        color: var(--slate-400);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
          background: var(--slate-100);
          color: var(--slate-700);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .modal-body {
      padding: 2rem;
      overflow-y: auto;
      flex: 1;

      &.no-padding {
        padding: 0;
      }

      /* Custom scrollbar */
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: var(--slate-50);
      }

      &::-webkit-scrollbar-thumb {
        background: var(--slate-300);
        border-radius: 4px;

        &:hover {
          background: var(--slate-400);
        }
      }
    }

    .modal-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--slate-200);
      flex-shrink: 0;
      background: var(--slate-50);
      border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);

      .default-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-lg);
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.btn-ghost {
        background: white;
        color: var(--slate-700);
        border: 1px solid var(--slate-300);

        &:hover:not(:disabled) {
          background: var(--slate-50);
          border-color: var(--slate-400);
        }
      }

      &.btn-primary {
        background: var(--primary-600);
        color: white;

        &:hover:not(:disabled) {
          background: var(--primary-700);
        }

        &:active:not(:disabled) {
          transform: scale(0.98);
        }
      }
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .modal-overlay {
        padding: 0;
      }

      .modal-container {
        max-height: 100vh;
        border-radius: 0;
        
        &.sm, &.md, &.lg, &.xl, &.full {
          width: 100%;
          max-width: 100%;
        }
      }

      .modal-header {
        padding: 1.25rem 1rem;

        .modal-title {
          font-size: 1.25rem;
        }

        .header-icon {
          width: 40px;
          height: 40px;
        }
      }

      .modal-body {
        padding: 1.5rem 1rem;
      }

      .modal-footer {
        padding: 1rem;

        .default-footer {
          flex-direction: column-reverse;

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }
  `],
  animations: []
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() showFooter: boolean = true;
  @Input() noPadding: boolean = false;
  @Input() closeOnOverlayClick: boolean = true;
  @Input() closeOnEscape: boolean = true;
  @Input() loading: boolean = false;
  @Input() confirmDisabled: boolean = false;
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() loadingText: string = 'Processing...';
  @Input() hasCustomFooter: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly XIcon = X;

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: any) {
    if (this.closeOnEscape && !this.loading) {
      this.onClose();
    }
  }

  onOverlayClick(event: MouseEvent) {
    if (this.closeOnOverlayClick && !this.loading) {
      this.onClose();
    }
  }

  onClose() {
    if (!this.loading) {
      this.close.emit();
    }
  }

  onConfirm() {
    if (!this.loading && !this.confirmDisabled) {
      this.confirm.emit();
    }
  }

  onCancel() {
    if (!this.loading) {
      this.cancel.emit();
    }
  }
}
