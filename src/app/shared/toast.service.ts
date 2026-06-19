import { Injectable } from '@angular/core';

// Toast notification options interface
export interface ToastOptions {
  duration?: number;
  pauseOnHover?: boolean;
}

// Toast service - manages user notifications and feedback
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Show success notification
  showSuccess(title: string, message: string, options: ToastOptions = {}): void {
    this.showToast('success', title, message, options);
  }

  // Show error notification with longer duration
  showError(title: string, message: string, options: ToastOptions = {}): void {
    const defaultOptions = { duration: 8000, ...options };
    this.showToast('error', title, message, defaultOptions);
  }

  // Show info notification
  showInfo(title: string, message: string, options: ToastOptions = {}): void {
    this.showToast('info', title, message, options);
  }

  // Show warning notification with medium duration
  showWarning(title: string, message: string, options: ToastOptions = {}): void {
    const defaultOptions = { duration: 6000, ...options };
    this.showToast('warning', title, message, defaultOptions);
  }

  // Quick success message for common actions
  quickSuccess(action: string): void {
    this.showSuccess('Success', `${action} completed successfully`);
  }

  // Quick error message for common actions
  quickError(action: string, error?: string): void {
    const message = error ? `${action} failed: ${error}` : `${action} failed. Please try again.`;
    this.showError('Error', message);
  }

  // Handle API response notifications
  showApiResponse(success: boolean, action: string, successMessage?: string, errorMessage?: string): void {
    if (success) {
      this.showSuccess('Success', successMessage || `${action} completed successfully`);
    } else {
      this.showError('Error', errorMessage || `Failed to ${action.toLowerCase()}. Please try again.`);
    }
  }

  // Core toast display using custom events
  private showToast(
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    options: ToastOptions = {}
  ): void {
    const defaultDuration = type === 'error' ? 8000 : type === 'warning' ? 6000 : 5000;
    const duration = options.duration ?? defaultDuration;

    const toastEvent = new CustomEvent('app-toast', {
      detail: {
        type,
        title,
        message,
        duration,
        ...options
      }
    });

    window.dispatchEvent(toastEvent);
  }
}