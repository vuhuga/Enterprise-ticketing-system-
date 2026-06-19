import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateTicketRequest } from '../../../../models/ticket.model';
import { DepartmentService, Department } from '../../../../shared/services/department.service';
import { TicketTypeService, TicketType } from '../../../settings/services/ticket-type.service';
import { PriorityService, Priority } from '../../../settings/services/priority.service';
import { LucideAngularModule, ArrowLeft, Info, User, FileText, Check, Loader2, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <button type="button" class="btn-back" (click)="goBack()">
            <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
            Back to Tickets
          </button>
          <div class="header-title">
            <h1>Create New Ticket</h1>
            <p class="subtitle">Submit a new support request for assistance</p>
          </div>
        </div>
      </div>

      <!-- Form Card -->
      <div class="card form-card">
        <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()">
          
          <!-- Basic Info -->
          <div class="section-title">
            <div class="icon-wrapper"><lucide-icon [img]="Info" [size]="20"></lucide-icon></div>
            <h3>Ticket Information</h3>
          </div>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="subject">Subject <span class="required">*</span></label>
              <input type="text" id="subject" formControlName="subject" class="form-control" 
                     [class.is-invalid]="isFieldInvalid('subject')" placeholder="Briefly summarize the issue">
              <div class="invalid-feedback" *ngIf="isFieldInvalid('subject')">
                {{ getFieldError('subject') }}
              </div>
            </div>

            <div class="form-group">
              <label for="ticketType">Type <span class="required">*</span></label>
              <select id="ticketType" formControlName="ticketType" class="form-select" [class.is-invalid]="isFieldInvalid('ticketType')">
                <option value="">Select Type</option>
                <option *ngFor="let type of ticketTypes" [value]="type.id">{{ type.name }}</option>
              </select>
               <div class="invalid-feedback" *ngIf="isFieldInvalid('ticketType')">{{ getFieldError('ticketType') }}</div>
            </div>

            <div class="form-group">
              <label for="department">Department <span class="required">*</span></label>
              <select id="department" formControlName="department" class="form-select" [class.is-invalid]="isFieldInvalid('department')">
                <option value="">Select Department</option>
                <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
              </select>
              <div class="invalid-feedback" *ngIf="isFieldInvalid('department')">{{ getFieldError('department') }}</div>
            </div>

            <div class="form-group">
              <label for="priority">Priority <span class="required">*</span></label>
              <div class="priority-selector">
                <label *ngFor="let p of priorities" class="priority-radio" [class.selected]="ticketForm.get('priority')?.value === p.value">
                  <input type="radio" formControlName="priority" [value]="p.value">
                  <span class="priority-label" [ngClass]="'priority-' + p.value">{{ p.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Description -->
          <div class="section-title">
            <div class="icon-wrapper"><lucide-icon [img]="FileText" [size]="20"></lucide-icon></div>
            <h3>Description</h3>
          </div>

          <div class="form-group">
             <label for="description">Details <span class="required">*</span></label>
             <textarea id="description" formControlName="description" class="form-control" rows="8" 
                       [class.is-invalid]="isFieldInvalid('description')"
                       placeholder="Please describe the issue in detail, including steps to reproduce..."></textarea>
             <div class="invalid-feedback" *ngIf="isFieldInvalid('description')">{{ getFieldError('description') }}</div>
             <p class="form-text">Provide as much detail as possible to help us resolve the issue faster.</p>
          </div>

          <div class="divider"></div>

          <!-- Contact Info -->
          <div class="section-title">
            <div class="icon-wrapper"><lucide-icon [img]="User" [size]="20"></lucide-icon></div>
            <h3>Contact Information</h3>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" formControlName="firstName" class="form-control" [class.is-invalid]="isFieldInvalid('firstName')">
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" formControlName="lastName" class="form-control" [class.is-invalid]="isFieldInvalid('lastName')">
            </div>
            <div class="form-group full-width">
              <label>Email Address</label>
              <input type="email" formControlName="email" class="form-control" [class.is-invalid]="isFieldInvalid('email')">
            </div>
             <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">{{ getFieldError('email') }}</div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" (click)="goBack()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="ticketForm.invalid || isSubmitting">
              <lucide-icon [img]="Loader2" [size]="18" class="spin" *ngIf="isSubmitting"></lucide-icon>
              <lucide-icon [img]="Check" [size]="18" *ngIf="!isSubmitting"></lucide-icon>
              {{ isSubmitting ? 'Creating...' : 'Submit Ticket' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 900px;
      margin: 0 auto;
      padding-bottom: 4rem;
    }
    
    .page-header {
      margin-bottom: 2rem;
      
      .header-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .btn-back {
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: none;
        border: none;
        color: var(--slate-500);
        font-weight: 500;
        cursor: pointer;
        padding: 0;
        
        &:hover { color: var(--primary-600); }
      }
      
      .header-title {
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .subtitle { color: var(--slate-500); font-size: 1.1rem; }
      }
    }

    .form-card {
      padding: 0;
      overflow: hidden;
      
      form { padding: 2.5rem; }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      
      .icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-lg);
        background: var(--primary-50);
        color: var(--primary-600);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--slate-800);
        margin: 0;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      &.full-width { grid-column: 1 / -1; }
      
      label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--slate-700);
        
        .required { color: #ef4444; margin-left: 2px; }
      }
    }

    .form-control, .form-select {
      height: 46px; // Taller inputs
      padding: 0.5rem 1rem;
      font-size: 0.95rem;
      border: 1px solid var(--slate-300);
      border-radius: var(--radius-md);
      transition: all 0.2s;
      
      &:focus {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
        outline: none;
      }
      
      &.is-invalid {
        border-color: #ef4444;
        background-color: #fef2f2;
      }
    }

    textarea.form-control {
      height: auto;
      min-height: 120px;
      resize: vertical;
    }

    .form-text {
      font-size: 0.85rem;
      color: var(--slate-500);
      margin-top: 0.25rem;
    }

    .invalid-feedback {
      font-size: 0.85rem;
      color: #ef4444;
      margin-top: 0.25rem;
    }

    /* Priority Radio Selector */
    .priority-selector {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .priority-radio {
      cursor: pointer;
      position: relative;
      
      input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .priority-label {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: var(--slate-50);
        border: 1px solid var(--slate-200);
        border-radius: var(--radius-full);
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--slate-600);
        transition: all 0.2s;
        
        &:hover { background: var(--slate-100); }
      }
      
      &.selected .priority-label {
        border-color: transparent;
        color: white;
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
        
        &.priority-low { background: #16a34a; }
        &.priority-medium { background: #ca8a04; }
        &.priority-high { background: #ea580c; }
        &.priority-urgent { background: #dc2626; }
      }
    }

    .divider {
      height: 1px;
      background: var(--slate-100);
      margin: 2.5rem 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--slate-100);
      
      .btn {
        min-width: 140px;
        height: 48px;
        font-size: 1rem;
      }
    }
    
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class CreateTicketComponent implements OnInit {
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private departmentService = inject(DepartmentService);
  private ticketTypeService = inject(TicketTypeService);
  private priorityService = inject(PriorityService);
  private fb = inject(FormBuilder);

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Info = Info;
  readonly User = User;
  readonly FileText = FileText;
  readonly Check = Check;
  readonly Loader2 = Loader2;
  readonly AlertCircle = AlertCircle;

  ticketForm!: FormGroup;
  isSubmitting = false;

  departments: Department[] = [];
  ticketTypes: TicketType[] = [];
  priorities: Priority[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.loadFormData();
  }

  private initializeForm(): void {
    const currentUser = this.authService.currentUser();

    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5)]],
      ticketType: ['', Validators.required],
      department: ['', Validators.required],
      priority: ['medium', Validators.required],
      firstName: [currentUser?.first_name || '', [Validators.required, Validators.minLength(2)]],
      lastName: [currentUser?.last_name || '', [Validators.required, Validators.minLength(2)]],
      email: [currentUser?.email || '', [Validators.required, Validators.email]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private loadFormData(): void {
    // Load departments
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments.filter(dept => dept.status === 'active');
      },
      error: (error) => console.error('Error loading departments:', error)
    });

    // Load ticket types
    this.ticketTypeService.getTicketTypes().subscribe({
      next: (types) => {
        this.ticketTypes = types.filter(type => type.status === 'active');
      },
      error: (error) => console.error('Error loading ticket types:', error)
    });

    // Load priorities
    this.priorityService.getPriorities().subscribe({
      next: (priorities) => {
        this.priorities = priorities.filter(priority => priority.isActive);
      },
      error: (error) => console.error('Error loading priorities:', error)
    });
  }

  onSubmit(): void {
    if (this.ticketForm.valid) {
      this.isSubmitting = true;
      const formData = this.ticketForm.value;

      const ticketData: CreateTicketRequest = {
        subject: formData.subject,
        type: formData.ticketType,
        department: formData.department,
        description: formData.description,
        priority: formData.priority,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        attachments: []
      };

      this.ticketService.createTicket(ticketData).subscribe({
        next: (ticket) => {
          this.isSubmitting = false;
          this.router.navigate(['/tickets']);
        },
        error: (error) => {
          console.error('❌ Error creating ticket:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.ticketForm.controls).forEach(key => {
      const control = this.ticketForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.ticketForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  getFieldError(fieldName: string): string {
    const control = this.ticketForm.get(fieldName);
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
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      subject: 'Subject',
      ticketType: 'Ticket type',
      department: 'Department',
      priority: 'Priority',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      description: 'Description'
    };
    return displayNames[fieldName] || fieldName;
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }
}