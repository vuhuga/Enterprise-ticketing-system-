import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  duration: number;
  progress: number;
  isPaused: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts(); trackBy: trackToast" 
        class="toast"
        [ngClass]="'toast-' + toast.type"
        (mouseenter)="pauseToast(toast.id)"
        (mouseleave)="resumeToast(toast.id)"
      >
        <div class="toast-icon">
          <ng-container [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'" class="icon">✓</span>
            <span *ngSwitchCase="'error'" class="icon">✕</span>
            <span *ngSwitchCase="'warning'" class="icon">⚠</span>
            <span *ngSwitchCase="'info'" class="icon">ℹ</span>
          </ng-container>
        </div>
        
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
          <div class="toast-timestamp">{{ getTimeAgo(toast.timestamp) }}</div>
        </div>
        
        <button class="toast-close" (click)="removeToast(toast.id)" aria-label="Close">
          <span>×</span>
        </button>
        
        <!-- Progress bar -->
        <div class="toast-progress">
          <div 
            class="toast-progress-bar" 
            [style.width.%]="toast.progress"
            [ngClass]="{ 'paused': toast.isPaused }"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(100%);
      animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .toast:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast.removing {
      animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
        max-height: 200px;
        margin-bottom: 12px;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
        max-height: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
      }
    }

    .toast-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      color: white;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .toast-success .toast-icon {
      background: #10b981;
    }

    .toast-error .toast-icon {
      background: #ef4444;
    }

    .toast-warning .toast-icon {
      background: #f59e0b;
    }

    .toast-info .toast-icon {
      background: #3b82f6;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #1f2937;
      font-size: 16px;
      line-height: 1.4;
    }

    .toast-message {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 6px;
    }

    .toast-timestamp {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 500;
    }

    .toast-close {
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
      transform: scale(1.1);
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0, 0, 0, 0.1);
    }

    .toast-progress-bar {
      height: 100%;
      transition: width 0.1s linear;
      border-radius: 0 0 12px 12px;
    }

    .toast-progress-bar.paused {
      transition: none;
    }

    .toast-success .toast-progress-bar {
      background: #10b981;
    }

    .toast-error .toast-progress-bar {
      background: #ef4444;
    }

    .toast-warning .toast-progress-bar {
      background: #f59e0b;
    }

    .toast-info .toast-progress-bar {
      background: #3b82f6;
    }

    /* Mobile responsiveness */
    @media (max-width: 640px) {
      .toast-container {
        top: 16px;
        right: 16px;
        left: 16px;
        max-width: none;
      }
      
      .toast {
        padding: 16px;
        gap: 12px;
      }
      
      .toast-title {
        font-size: 15px;
      }
      
      .toast-message {
        font-size: 13px;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts = signal<Toast[]>([]);
  private intervals = new Map<string, NodeJS.Timeout>();

  ngOnInit() {
    window.addEventListener('app-toast', this.handleToastEvent.bind(this) as EventListener);
  }

  ngOnDestroy() {
    window.removeEventListener('app-toast', this.handleToastEvent.bind(this) as EventListener);
    this.intervals.forEach(interval => clearInterval(interval));
  }

  private handleToastEvent(event: Event) {
    const customEvent = event as CustomEvent<{ type: string; title: string; message: string; duration?: number }>;
    const { type, title, message, duration = 5000 } = customEvent.detail;
    this.addToast(type as 'success' | 'error' | 'info' | 'warning', title, message, duration);
  }

  addToast(type: Toast['type'], title: string, message: string, duration = 5000) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
      duration,
      progress: 100,
      isPaused: false
    };

    this.toasts.update(toasts => [toast, ...toasts]);
    this.startProgress(toast);
  }

  private startProgress(toast: Toast) {
    const updateInterval = 50; // Update every 50ms for smooth animation
    const totalSteps = toast.duration / updateInterval;
    let currentStep = 0;

    const interval = setInterval(() => {
      if (toast.isPaused) return;

      currentStep++;
      const progress = Math.max(0, 100 - (currentStep / totalSteps) * 100);
      
      this.toasts.update(toasts => 
        toasts.map(t => t.id === toast.id ? { ...t, progress } : t)
      );

      if (progress <= 0) {
        this.removeToast(toast.id);
        clearInterval(interval);
        this.intervals.delete(toast.id);
      }
    }, updateInterval);

    this.intervals.set(toast.id, interval);
  }

  pauseToast(id: string) {
    this.toasts.update(toasts =>
      toasts.map(toast => toast.id === id ? { ...toast, isPaused: true } : toast)
    );
  }

  resumeToast(id: string) {
    this.toasts.update(toasts =>
      toasts.map(toast => toast.id === id ? { ...toast, isPaused: false } : toast)
    );
  }

  removeToast(id: string) {
    const toastElement = document.querySelector(`[data-toast-id="${id}"]`) as HTMLElement;
    if (toastElement) {
      toastElement.classList.add('removing');
    }

    setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
      const interval = this.intervals.get(id);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(id);
      }
    }, 300);
  }

  trackToast(index: number, toast: Toast): string {
    return toast.id;
  }

  getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }
}