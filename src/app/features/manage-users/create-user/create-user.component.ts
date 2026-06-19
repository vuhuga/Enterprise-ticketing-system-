import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { ToastService } from '../../../shared/toast.service';
import { DepartmentService, Department } from '../../../shared/services/department.service';
import { LucideAngularModule, ArrowLeft, User as UserIcon, Mail, Shield, Building2, Check, Loader2, Info, Lock, Phone, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">
          <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
          Back to Users
        </button>
        <div class="header-content">
          <h1>Create New User</h1>
          <p class="subtitle">Add a new user to the system</p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="card form-card">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          
          <!-- Personal Info -->
          <div class="form-section">
            <h3 class="section-title">
              <div class="icon-wrapper"><lucide-icon [img]="UserIcon" [size]="20"></lucide-icon></div>
              Personal Information
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

          <!-- Location -->
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
                <input type="text" id="country" formControlName="country" class="form-control">
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Access & Security -->
          <div class="form-section">
            <h3 class="section-title">
              <div class="icon-wrapper"><lucide-icon [img]="Shield" [size]="20"></lucide-icon></div>
              Access & Security
            </h3>

            <div class="form-grid">
              <div class="form-group">
                <label for="role">Role <span class="required">*</span></label>
                <select id="role" formControlName="role" class="form-select" [class.is-invalid]="isFieldInvalid('role')">
                  <option value="">Select Role</option>
                  <option *ngFor="let role of userRoles" [value]="role.value">{{ role.label }}</option>
                </select>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('role')">{{ getFieldError('role') }}</div>
              </div>

              <div class="form-group" *ngIf="shouldShowDepartmentField()">
                <label for="departmentId">Department <span class="required">*</span></label>
                <div class="input-with-icon">
                   <lucide-icon [img]="Building2" [size]="18" class="input-icon"></lucide-icon>
                   <select id="departmentId" formControlName="departmentId" class="form-select" 
                          [class.is-invalid]="isFieldInvalid('departmentId')"
                          [disabled]="loadingDepartments">
                    <option value="">Select Department</option>
                    <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                   </select>
                </div>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('departmentId')">{{ getFieldError('departmentId') }}</div>
              </div>

              <div class="form-group full-width">
                <label for="password">Password <span class="required">*</span></label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Lock" [size]="18" class="input-icon"></lucide-icon>
                  <input type="password" id="password" formControlName="password" class="form-control" [class.is-invalid]="isFieldInvalid('password')">
                </div>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('password')">{{ getFieldError('password') }}</div>
                <p class="helper-text">Must be at least 6 characters long</p>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-ghost" (click)="goBack()" [disabled]="isSubmitting">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || isSubmitting">
              <lucide-icon [img]="Loader2" [size]="18" class="spin" *ngIf="isSubmitting"></lucide-icon>
              <lucide-icon [img]="Check" [size]="18" *ngIf="!isSubmitting"></lucide-icon>
              {{ isSubmitting ? 'Creating...' : 'Create User' }}
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
    
    .helper-text {
      font-size: 0.85rem; color: var(--slate-500); margin-top: 0.25rem;
    }

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
export class CreateUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private departmentService = inject(DepartmentService);

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly UserIcon = UserIcon;
  readonly Mail = Mail;
  readonly Shield = Shield;
  readonly Building2 = Building2;
  readonly Check = Check;
  readonly Loader2 = Loader2;
  readonly Info = Info;
  readonly Lock = Lock;
  readonly Phone = Phone;
  readonly MapPin = MapPin;

  userForm!: FormGroup;
  userRoles = [
    { value: 'admin', label: 'Admin (System Administrator)' },
    { value: 'staff', label: 'Staff (Support Agent)' },
    { value: 'customer', label: 'Customer (Ticket Creator)' }
  ];
  departments: Department[] = [];
  isSubmitting = false;
  loadingDepartments = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadDepartments();
  }

  private loadDepartments(): void {
    this.loadingDepartments = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments.filter(dept => dept.isActive);
        this.loadingDepartments = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.departments = [];
        this.loadingDepartments = false;
      }
    });
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      city: [''],
      address: [''],
      country: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
      departmentId: ['']
    });

    this.userForm.get('role')?.valueChanges.subscribe(role => {
      const departmentControl = this.userForm.get('departmentId');
      if (role === 'staff') {
        departmentControl?.setValidators([Validators.required]);
      } else {
        departmentControl?.clearValidators();
        departmentControl?.setValue('');
      }
      departmentControl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const formData = this.userForm.value;

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        country: formData.country,
        role: formData.role,
        departmentId: formData.departmentId || null
      };

      this.userService.createUser(userData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', 'User created successfully');
          this.router.navigate(['/manage-users']);
        },
        error: (error) => {
          this.isSubmitting = false;
          const msg = error.error?.error || error.message || 'Failed to create user';
          this.toastService.showError('Error', msg);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email address';
      if (control.errors['minlength']) return `Must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.userForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  shouldShowDepartmentField(): boolean {
    return this.userForm.get('role')?.value === 'staff';
  }

  goBack() {
    this.router.navigate(['/manage-users']);
  }
}