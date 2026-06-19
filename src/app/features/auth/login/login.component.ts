import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LoginResponse } from '../../../models/auth.model';
import { ToastService } from '../../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  email = '';
  password = '';
  error = '';
  loading = false;

  onLogin(): void {
    this.error = '';

    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password.';
      return;
    }

    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response: LoginResponse) => {
        this.loading = false;
        console.log('Login successful:', response);

        // Get return URL from query params or default to dashboard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed. Please check your credentials.';
        console.error('Login error:', err);
      }
    });
  }
}