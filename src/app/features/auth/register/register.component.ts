import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterResponse } from '../../../models/auth.model';
import { ToastService } from '../../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  registerForm!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      organization: [''],
      city: [''],
      country: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): Record<string, boolean> | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isSubmitting = true;

      const formValue = this.registerForm.value;

      // Map form values to API request format (snake_case)
      const requestData = {
        first_name: formValue.firstName,
        last_name: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        phone: formValue.phone,
        city: formValue.city,
        country: formValue.country,
        address: formValue.address
      };

      // Call the backend API using auth service
      this.authService.register(requestData).subscribe({
        next: (response: RegisterResponse) => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Registration Successful!', `${response.message || 'Account created successfully!'} You can now login with your credentials.`);
          this.router.navigate(['/auth/login']);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting = false;
          console.error('❌ Registration error:', err);
          const errorMessage = err.error?.error || err.error?.message || 'Registration failed. Please try again.';
          this.toastService.showError('Registration Failed', errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        const minLength = control.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${minLength} characters`;
      }
      if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      organization: 'Organization',
      city: 'City',
      country: 'Country',
      password: 'Password',
      confirmPassword: 'Confirm password',
      agreeToTerms: 'Terms agreement'
    };
    return displayNames[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    const isInvalid = !!(control?.invalid && control.touched);

    // Special case for confirm password
    if (fieldName === 'confirmPassword') {
      return isInvalid || (this.registerForm.errors?.['passwordMismatch'] && control?.touched);
    }

    return isInvalid;
  }
}