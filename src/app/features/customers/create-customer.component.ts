import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from './services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { LucideAngularModule, ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Globe, Check, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-create-customer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">
          <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
          Back to Customers
        </button>
        <div class="header-content">
          <h1>Create New Customer</h1>
          <p class="subtitle">Add a new customer profile to the system</p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="card form-card">
        <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
          
          <div class="form-section">
            <h3 class="section-title">
              <div class="icon-wrapper"><lucide-icon [img]="UserIcon" [size]="20"></lucide-icon></div>
              Basic Information
            </h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="firstName">First Name <span class="required">*</span></label>
                <input type="text" id="firstName" formControlName="firstName" class="form-control" [class.is-invalid]="isFieldInvalid('firstName')">
                <div class="invalid-feedback" *ngIf="isFieldInvalid('firstName')">{{ getFieldError('firstName') }}</div>
              </div>

              <div class="form-group">
                <label for="lastName">Last Name <span class="required">*</span></label>
                <input type="text" id="lastName" formControlName="lastName" class="form-control" [class.is-invalid]="isFieldInvalid('lastName')">
                 <div class="invalid-feedback" *ngIf="isFieldInvalid('lastName')">{{ getFieldError('lastName') }}</div>
              </div>

              <div class="form-group">
                <label for="email">Email Address <span class="required">*</span></label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Mail" [size]="18" class="input-icon"></lucide-icon>
                  <input type="email" id="email" formControlName="email" class="form-control" [class.is-invalid]="isFieldInvalid('email')">
                </div>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">{{ getFieldError('email') }}</div>
              </div>

              <div class="form-group">
                <label for="phone">Phone Number</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Phone" [size]="18" class="input-icon"></lucide-icon>
                  <input type="tel" id="phone" formControlName="phone" class="form-control">
                </div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="form-section">
            <h3 class="section-title">
              <div class="icon-wrapper"><lucide-icon [img]="MapPin" [size]="20"></lucide-icon></div>
              Location Details
            </h3>

            <div class="form-grid">
              <div class="form-group full-width">
                <label for="address">Address</label>
                <input type="text" id="address" formControlName="address" class="form-control">
              </div>

              <div class="form-group">
                <label for="city">City</label>
                <input type="text" id="city" formControlName="city" class="form-control">
              </div>

              <div class="form-group">
                <label for="country">Country</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Globe" [size]="18" class="input-icon"></lucide-icon>
                  <input type="text" id="country" formControlName="country" class="form-control">
                </div>
              </div>

              <div class="form-group">
                <label for="status">Status <span class="required">*</span></label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-ghost" (click)="goBack()" [disabled]="isSubmitting">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="customerForm.invalid || isSubmitting">
              <lucide-icon [img]="Loader2" [size]="18" class="spin" *ngIf="isSubmitting"></lucide-icon>
              <lucide-icon [img]="Check" [size]="18" *ngIf="!isSubmitting"></lucide-icon>
              {{ isSubmitting ? 'Creating...' : 'Create Customer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      padding-bottom: 4rem;
    }

    .page-header {
      margin-bottom: 2rem;
      
      .btn-back {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: none;
        border: none;
        color: var(--slate-500);
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        margin-bottom: 1rem;
        &:hover { color: var(--primary-600); }
      }
      
      .header-content {
        h1 { font-size: 2rem; margin: 0 0 0.5rem 0; color: var(--slate-900); }
        .subtitle { color: var(--slate-500); font-size: 1.1rem; margin: 0; }
      }
    }

    .form-card {
      padding: 0;
      overflow: hidden;
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-xl);
      
      form { padding: 2.5rem; }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--slate-800);
      margin: 0 0 1.5rem 0;
      
      .icon-wrapper {
        width: 36px; height: 36px;
        background: var(--primary-50);
        color: var(--primary-600);
        border-radius: var(--radius-lg);
        display: flex; align-items: center; justify-content: center;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .form-group {
      display: flex; flex-direction: column; gap: 0.5rem;
      &.full-width { grid-column: 1 / -1; }
      
      label {
        font-size: 0.9rem; font-weight: 500; color: var(--slate-700);
        .required { color: #ef4444; margin-left: 2px; }
      }
    }

    .form-control, .form-select {
      height: 42px;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--slate-300);
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      transition: all 0.2s;
      
      &:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }
      
      &.is-invalid { border-color: #ef4444; background: #fef2f2; }
    }

    .input-with-icon {
      position: relative;
      
      .input-icon {
        position: absolute;
        left: 10px; top: 50%; transform: translateY(-50%);
        color: var(--slate-400);
        pointer-events: none;
      }
      
      input, select { padding-left: 36px; }
    }

    .invalid-feedback { font-size: 0.85rem; color: #ef4444; }
    
    .divider {
      height: 1px; background: var(--slate-100); margin: 2rem 0;
    }

    .form-actions {
      display: flex; justify-content: flex-end; gap: 1rem;
      margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--slate-100);
      
      .btn {
        min-width: 120px; height: 44px;
        font-size: 0.95rem; font-weight: 500;
        border-radius: var(--radius-lg);
        display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
        cursor: pointer; transition: all 0.2s; border: none;
        
        &.btn-ghost {
          background: white; color: var(--slate-600); border: 1px solid var(--slate-200);
          &:hover { background: var(--slate-50); color: var(--slate-900); }
        }
        
        &.btn-primary {
          background: var(--primary-600); color: white;
          &:hover { background: var(--primary-700); transform: translateY(-1px); box-shadow: var(--shadow-md); }
          &:disabled { background: var(--slate-300); cursor: not-allowed; transform: none; box-shadow: none; }
        }
      }
    }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class CreateCustomerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private toastService = inject(ToastService);

  readonly ArrowLeft = ArrowLeft;
  readonly UserIcon = UserIcon;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Globe = Globe;
  readonly Check = Check;
  readonly Loader2 = Loader2;

  customerForm!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      city: [''],
      address: [''],
      country: [''],
      status: ['active', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.isSubmitting = true;

      this.customerService.createCustomer(this.customerForm.value).subscribe({
        next: (customer) => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', `Customer ${customer.firstName} ${customer.lastName} created successfully`);
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          this.isSubmitting = false;
          const errorMessage = error.error?.error || 'Failed to create customer. Please try again.';
          this.toastService.showError('Error', errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.customerForm.controls).forEach(key => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.customerForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email address';
      if (control.errors['minlength']) return `Must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.customerForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}