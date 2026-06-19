import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  showSuccess(title: string, message?: string, duration = 5000): void {
    this.addToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  showError(title: string, message?: string, duration = 5000): void {
    this.addToast({
      type: 'error',
      title,
      message,
      duration
    });
  }

  showWarning(title: string, message?: string, duration = 5000): void {
    this.addToast({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  showInfo(title: string, message?: string, duration = 5000): void {
    this.addToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  private addToast(toast: Omit<ToastMessage, 'id'>): void {
    const id = this.generateId();
    const newToast: ToastMessage = { ...toast, id };
    
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(filteredToasts);
  }

  clearAll(): void {
    this.toastsSubject.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}