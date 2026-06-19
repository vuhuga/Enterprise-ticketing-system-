import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your new password below.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #resetForm="ngForm" *ngIf="!isTokenInvalid">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              [(ngModel)]="newPassword"
              required
              minlength="6"
              #passwordInput="ngModel"
              [class.error]="passwordInput.invalid && passwordInput.touched"
              placeholder="Enter new password"
            >
            <div class="error-message" *ngIf="passwordInput.invalid && passwordInput.touched">
              <span *ngIf="passwordInput.errors?.['required']">Password is required</span>
              <span *ngIf="passwordInput.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              required
              #confirmInput="ngModel"
              [class.error]="(confirmInput.touched && newPassword !== confirmPassword)"
              placeholder="Confirm new password"
            >
            <div class="error-message" *ngIf="confirmInput.touched && newPassword !== confirmPassword">
              Passwords do not match
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="resetForm.invalid || newPassword !== confirmPassword || isLoading"
            >
              <span *ngIf="isLoading">Updating...</span>
              <span *ngIf="!isLoading">Update Password</span>
            </button>
          </div>
        </form>

        <div class="success-message" *ngIf="successMessage">
          <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="goToLogin()">
              Go to Login
            </button>
          </div>
        </div>

        <div class="error-message" *ngIf="errorMessage || isTokenInvalid">
          <div class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            <span *ngIf="isTokenInvalid">This reset link is invalid or has expired.</span>
            <span *ngIf="!isTokenInvalid">{{ errorMessage }}</span>
          </div>
          <div class="form-actions" *ngIf="isTokenInvalid">
            <button class="btn btn-secondary" (click)="goToForgotPassword()">
              Request New Reset Link
            </button>
          </div>
        </div>

        <div class="auth-footer" *ngIf="!successMessage">
          <p>Remember your password? <a routerLink="/auth/login">Back to Login</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .auth-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .auth-header h2 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
      font-weight: 600;
    }

    .auth-header p {
      color: #666;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #2196F3;
    }

    .form-group input.error {
      border-color: #f44336;
    }

    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-top: 5px;
    }

    .form-actions {
      margin-bottom: 20px;
    }

    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #2196F3;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1976D2;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .alert-success {
      background: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }

    .alert-error {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }

    .auth-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .auth-footer p {
      color: #666;
      margin: 0;
    }

    .auth-footer a {
      color: #2196F3;
      text-decoration: none;
      font-weight: 500;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  isTokenInvalid = false;

  ngOnInit() {
    // Get token from URL parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.isTokenInvalid = true;
      }
    });
  }

  onSubmit() {
    if (this.isLoading || this.newPassword !== this.confirmPassword) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
        // Clear the form
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.error?.includes('Invalid or expired')) {
          this.isTokenInvalid = true;
        } else {
          this.errorMessage = error.error?.error || 'An error occurred. Please try again.';
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}