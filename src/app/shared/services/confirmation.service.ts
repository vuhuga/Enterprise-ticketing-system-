import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private isVisible = new BehaviorSubject<boolean>(false);
  private config = new BehaviorSubject<ConfirmationConfig | null>(null);
  private resolvePromise: ((value: boolean) => void) | null = null;

  isVisible$ = this.isVisible.asObservable();
  config$ = this.config.asObservable();

  confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.config.next({
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        confirmButtonClass: 'btn-danger',
        ...config
      });
      this.isVisible.next(true);
    });
  }

  onConfirm(): void {
    this.isVisible.next(false);
    if (this.resolvePromise) {
      this.resolvePromise(true);
      this.resolvePromise = null;
    }
  }

  onCancel(): void {
    this.isVisible.next(false);
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = null;
    }
  }
}