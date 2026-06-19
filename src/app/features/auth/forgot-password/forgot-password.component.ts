import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Forgot Password</h2>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #forgotForm="ngForm">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              email
              #emailInput="ngModel"
              [class.error]="emailInput.invalid && emailInput.touched"
              placeholder="Enter your email address"
            >
            <div class="error-message" *ngIf="emailInput.invalid && emailInput.touched">
              <span *ngIf="emailInput.errors?.['required']">Email is required</span>
              <span *ngIf="emailInput.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="forgotForm.invalid || isLoading"
            >
              <span *ngIf="isLoading">Sending...</span>
              <span *ngIf="!isLoading">Send Reset Link</span>
            </button>
          </div>
        </form>

        <div class="success-message" *ngIf="successMessage">
          <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>
        </div>

        <div class="error-message" *ngIf="errorMessage">
          <div class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMessage }}
          </div>
        </div>

        <div class="auth-footer">
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
      line-height: 1.5;
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
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  onSubmit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
        // Clear the form
        this.email = '';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'An error occurred. Please try again.';
      }
    });
  }
}