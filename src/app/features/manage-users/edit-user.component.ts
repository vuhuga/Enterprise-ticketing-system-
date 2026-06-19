import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService, User } from './services/user.service';
import { DepartmentService, Department } from '../../shared/services/department.service';
import { ToastService } from '../../shared/toast.service';
import { LucideAngularModule, ArrowLeft, User as UserIcon, Mail, Shield, Building2, Check, Loader2, Info } from 'lucide-angular';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <button class="btn-back" (click)="onCancel()">
          <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
          Back to Users
        </button>
        <div class="header-content">
          <h1>Edit User</h1>
          <p class="subtitle">Update user profile and permissions</p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="card form-card" *ngIf="!loading; else loadingTpl">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          
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

              <div class="form-group full-width">
                <label for="email">Email Address <span class="required">*</span></label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Mail" [size]="18" class="input-icon"></lucide-icon>
                  <input type="email" id="email" formControlName="email" class="form-control" [class.is-invalid]="isFieldInvalid('email')">
                </div>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">{{ getFieldError('email') }}</div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="form-section">
            <h3 class="section-title">
              <div class="icon-wrapper"><lucide-icon [img]="Shield" [size]="20"></lucide-icon></div>
              Access & Permissions
            </h3>

            <div class="form-grid">
              <div class="form-group">
                <label for="role">Role <span class="required">*</span></label>
                <select id="role" formControlName="role" class="form-select" [class.is-invalid]="isFieldInvalid('role')">
                  <option value="">Select Role</option>
                  <option value="admin">Admin (System Administrator)</option>
                  <option value="staff">Staff (Support Agent)</option>
                  <option value="customer">Customer (Ticket Creator)</option>
                </select>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('role')">{{ getFieldError('role') }}</div>
              </div>

              <div class="form-group">
                <label for="status">Account Status <span class="required">*</span></label>
                <select id="status" formControlName="status" class="form-select" [class.is-invalid]="isFieldInvalid('status')">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                 <div class="invalid-feedback" *ngIf="isFieldInvalid('status')">{{ getFieldError('status') }}</div>
              </div>

              <div class="form-group full-width" *ngIf="shouldShowDepartmentField()">
                <label for="departmentId">Department <span class="required">*</span></label>
                <div class="input-with-icon">
                   <lucide-icon [img]="Building2" [size]="18" class="input-icon"></lucide-icon>
                   <select id="departmentId" formControlName="departmentId" class="form-select" 
                          [class.is-invalid]="isFieldInvalid('departmentId')"
                          [disabled]="loadingDepartments || getCurrentRole() === 'admin'">
                    <option value="">Select Department</option>
                    <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                   </select>
                </div>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('departmentId')">{{ getFieldError('departmentId') }}</div>
                
                <div class="helper-text" *ngIf="getCurrentRole() === 'admin'">
                  <lucide-icon [img]="Info" [size]="14"></lucide-icon>
                  Admins have access to all departments
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-ghost" (click)="onCancel()" [disabled]="isSubmitting">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || isSubmitting">
              <lucide-icon [img]="Loader2" [size]="18" class="spin" *ngIf="isSubmitting"></lucide-icon>
              <lucide-icon [img]="Check" [size]="18" *ngIf="!isSubmitting"></lucide-icon>
              {{ isSubmitting ? 'Updating...' : 'Update User' }}
            </button>
          </div>
        </form>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading user profile...</p>
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
    
    .helper-text {
      display: flex; align-items: center; gap: 0.5rem;
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
export class EditUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private departmentService = inject(DepartmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly UserIcon = UserIcon;
  readonly Mail = Mail;
  readonly Shield = Shield;
  readonly Building2 = Building2;
  readonly Check = Check;
  readonly Loader2 = Loader2;
  readonly Info = Info;

  userForm!: FormGroup;
  isSubmitting = false;
  loading = true;
  loadingDepartments = false;
  userId!: number;
  departments: Department[] = [];
  originalRole = '';

  ngOnInit() {
    this.initForm();
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDepartments();
    this.loadUser();
  }

  initForm() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      departmentId: [''],
      status: ['active', Validators.required]
    });

    this.userForm.get('role')?.valueChanges.subscribe(role => {
      this.handleRoleChange(role);
    });
  }

  private handleRoleChange(newRole: string) {
    const departmentControl = this.userForm.get('departmentId');

    if (newRole === 'staff') {
      departmentControl?.setValidators([Validators.required]);
    } else if (newRole === 'admin') {
      departmentControl?.clearValidators();
    } else {
      departmentControl?.clearValidators();
      departmentControl?.setValue('');
    }
    departmentControl?.updateValueAndValidity();
  }

  private loadDepartments(): void {
    this.loadingDepartments = true;
    (this.departmentService.getAllDepartments() as Observable<Department[]>).subscribe({
      next: (departments: Department[]) => {
        this.departments = departments.filter((dept: Department) => dept.isActive);
        this.loadingDepartments = false;
      },
      error: (error: unknown) => {
        console.error('Error loading departments:', error);
        this.departments = [];
        this.loadingDepartments = false;
      }
    });
  }

  loadUser() {
    this.userService.getUserById(this.userId).subscribe({
      next: (user: User) => {
        this.originalRole = user.role;
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId || '',
          status: user.isActive ? 'active' : 'inactive'
        });
        this.loading = false;
      },
      error: (error: unknown) => {
        this.toastService.showError('Error', 'Failed to load user');
        this.router.navigate(['/manage-users']);
      }
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const userData = this.userForm.value;

      if (userData.role === 'customer') {
        userData.departmentId = null;
      }

      this.userService.updateUser(this.userId, userData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', 'User updated successfully');
          if (userData.role === 'admin') {
            this.loadUser();
          } else {
            this.router.navigate(['/manage-users']);
          }
        },
        error: (error: any) => {
          this.isSubmitting = false;
          const msg = error.error?.message || error.message || 'Unknown error';
          this.toastService.showError('Error', 'Failed to update: ' + msg);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/manage-users']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Invalid email address';
      if (field.errors['minlength']) return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  shouldShowDepartmentField(): boolean {
    const role = this.userForm.get('role')?.value;
    return role === 'staff' || role === 'admin';
  }

  getCurrentRole(): string {
    return this.userForm.get('role')?.value || '';
  }

  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }
}