import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerService } from './services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { LucideAngularModule, ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Globe, Check, Loader2, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-edit-customer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <button class="btn-back" (click)="onCancel()">
          <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
          Back to Customers
        </button>
        <div class="header-content">
          <h1>Edit Customer</h1>
          <p class="subtitle">Update customer information</p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="card form-card" *ngIf="!loading; else loadingTpl">
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
            <button type="button" class="btn btn-danger-ghost" (click)="onDelete()" [disabled]="isSubmitting">
              <lucide-icon [img]="Trash2" [size]="18"></lucide-icon>
              Delete Customer
            </button>
            <div class="right-actions">
              <button type="button" class="btn btn-ghost" (click)="onCancel()" [disabled]="isSubmitting">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="customerForm.invalid || isSubmitting">
                <lucide-icon [img]="Loader2" [size]="18" class="spin" *ngIf="isSubmitting"></lucide-icon>
                <lucide-icon [img]="Check" [size]="18" *ngIf="!isSubmitting"></lucide-icon>
                {{ isSubmitting ? 'Updating...' : 'Update Customer' }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading customer...</p>
        </div>
      </ng-template>
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
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--slate-100);
      
      .right-actions { display: flex; gap: 1rem; }
      
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
        
        &.btn-danger-ghost {
          background: #fef2f2; color: #ef4444; border: 1px solid #fecaca;
          &:hover { background: #fee2e2; border-color: #fca5a5; }
        }
      }
    }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .loading-state {
      text-align: center; padding: 4rem; color: var(--slate-500);
      .spinner {
        width: 40px; height: 40px; border: 3px solid var(--slate-200);
        border-top-color: var(--primary-600); border-radius: 50%;
        animation: spin 1s linear infinite; margin: 0 auto 1rem;
      }
    }
  `]
})
export class EditCustomerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  readonly ArrowLeft = ArrowLeft;
  readonly UserIcon = UserIcon;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Globe = Globe;
  readonly Check = Check;
  readonly Loader2 = Loader2;
  readonly Trash2 = Trash2;

  customerForm!: FormGroup;
  isSubmitting = false;
  loading = true;
  customerId!: number;

  ngOnInit() {
    this.initForm();
    this.customerId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCustomer();
  }

  initForm() {
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

  loadCustomer() {
    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (customer) => {
        this.customerForm.patchValue(customer);
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load customer');
        console.error('Error loading customer:', error);
        this.router.navigate(['/customers']);
      }
    });
  }

  onSubmit() {
    if (this.customerForm.valid) {
      this.isSubmitting = true;
      const customerData = this.customerForm.value;

      this.customerService.updateCustomer(this.customerId, customerData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', 'Customer updated successfully');
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.showError('Error', 'Failed to update customer: ' + (error.error?.message || error.message));
          console.error('Error updating customer:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/customers']);
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      this.customerService.deleteCustomer(this.customerId).subscribe({
        next: () => {
          this.toastService.showSuccess('Success', 'Customer deleted successfully');
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.toastService.showError('Error', 'Failed to delete customer');
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.customerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.customerForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Invalid email address';
      if (field.errors['minlength']) return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private markFormGroupTouched() {
    Object.keys(this.customerForm.controls).forEach(key => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
    });
  }
}