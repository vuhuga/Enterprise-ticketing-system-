import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartmentService, Department } from '../../services/department.service';
import { TicketTypeService, TicketType } from '../../../features/settings/services/ticket-type.service';
import { PriorityService, Priority } from '../../../features/settings/services/priority.service';
import { ToastService } from '../../toast.service';

/**
 * Ticket form configuration interface
 */
export interface TicketFormConfig {
  mode: 'public' | 'admin';
  showPersonalInfo: boolean;
  showPriority: boolean;
  showAssignment: boolean;
  submitButtonText: string;
  title: string;
  description: string;
}

/**
 * Initial data interface for pre-filling form
 */
interface TicketFormData {
  subject?: string;
  ticketType?: string;
  department?: string;
  requestDetails?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  priority?: string;
  assignedTo?: string;
}

/**
 * Reusable ticket form component
 * Used by both public and admin ticket creation
 */
@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.scss'
})
export class TicketFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private ticketTypeService = inject(TicketTypeService);
  private priorityService = inject(PriorityService);
  private toastService = inject(ToastService);

  // Form configuration - controls which fields to show/hide
  @Input() config: TicketFormConfig = {
    mode: 'public',
    showPersonalInfo: true,
    showPriority: false,
    showAssignment: false,
    submitButtonText: 'Submit',
    title: 'Create a ticket',
    description: 'Submit your request and our team will get back to you as soon as possible.'
  };

  // Pre-fill data for logged-in users (future use)
  @Input() initialData: TicketFormData = {};
  
  // Events
  @Output() formSubmit = new EventEmitter<Record<string, unknown>>();
  @Output() formCancel = new EventEmitter<void>();

  ticketForm!: FormGroup;
  isSubmitting = false;
  showSuccess = false;

  // Dynamic data from APIs - NO HARDCODED VALUES
  ticketTypes: string[] = [];
  departments: string[] = [];
  priorities: { value: string; label: string }[] = [];
  isLoadingData = true;
  dataLoadError = false;

  ngOnInit() {
    this.initializeForm();
    this.loadDropdownData();
  }

  /**
   * Load departments, ticket types, and priorities from API
   * Professional implementation - no hardcoded fallbacks in production
   */
  private loadDropdownData() {
    this.isLoadingData = true;
    this.dataLoadError = false;

    console.log('🔍 Starting loadDropdownData...');

    // Test ticket types service individually first
    this.ticketTypeService.getTicketTypes().subscribe({
      next: (ticketTypes) => {
        console.log('🔍 Direct TicketTypes call result:', ticketTypes);
        
        // Process ticket types - only active ones
        this.ticketTypes = (ticketTypes as TicketType[])
          ?.filter((type: TicketType) => type.isActive === true)
          ?.map((type: TicketType) => type.name) || [];
          
        console.log('🔍 Processed ticket types for dropdown:', this.ticketTypes);
      },
      error: (error) => {
        console.error('🔍 TicketTypes API call failed:', error);
      }
    });

    // Use Promise.all for concurrent API calls - better performance
    const departmentsPromise = this.departmentService.getAllDepartments().toPromise();
    const ticketTypesPromise = this.ticketTypeService.getTicketTypes().toPromise();
    const prioritiesPromise = this.priorityService.getPriorities().toPromise();

    Promise.all([departmentsPromise, ticketTypesPromise, prioritiesPromise])
      .then(([departments, ticketTypes, priorities]) => {
        console.log('🔍 Raw API Responses:');
        console.log('Departments:', departments);
        console.log('Ticket Types:', ticketTypes);
        console.log('Priorities:', priorities);

        // Process departments - only active ones
        this.departments = (departments as Department[])
          ?.filter((dept: Department) => dept.isActive === true)
          ?.map((dept: Department) => dept.name) || [];

        // Process ticket types - only active ones
        this.ticketTypes = (ticketTypes as TicketType[])
          ?.filter((type: TicketType) => type.isActive === true)
          ?.map((type: TicketType) => type.name) || [];

        // Process priorities - only active ones, sorted by sortOrder
        this.priorities = (priorities as Priority[])
          ?.filter((priority: Priority) => priority.isActive)
          ?.sort((a: Priority, b: Priority) => a.sortOrder - b.sortOrder)
          ?.map((priority: Priority) => ({ value: priority.value, label: priority.label })) || [];

        console.log('🔍 Processed Arrays:');
        console.log('Departments:', this.departments);
        console.log('Ticket Types:', this.ticketTypes);
        console.log('Priorities:', this.priorities);

        this.isLoadingData = false;

        // Validate data integrity
        if (this.departments.length === 0 || this.ticketTypes.length === 0 || this.priorities.length === 0) {
          console.warn('Warning: Some dropdown data is empty. Check database configuration.');
        }
      })
      .catch((error) => {
        console.error('Critical Error: Failed to load dropdown data from API:', error);
        this.dataLoadError = true;
        this.isLoadingData = false;
        
        // In production, this should be handled by a global error handler
        // and possibly redirect to an error page or show user-friendly message
      });
  }

  /**
   * Initialize form with dynamic fields based on configuration
   */
  private initializeForm() {
    // Base form fields (always present)
    const formConfig: Record<string, unknown[]> = {
      subject: [this.initialData.subject || '', [Validators.required, Validators.minLength(5)]],
      ticketType: [this.initialData.ticketType || '', Validators.required],
      department: [this.initialData.department || '', Validators.required],
      requestDetails: [this.initialData.requestDetails || '', [Validators.required, Validators.minLength(10)]],
      attachments: [null]
    };

    // Add terms checkbox for public users only
    if (this.config.mode === 'public') {
      formConfig['agreeToTerms'] = [false, Validators.requiredTrue];
    }

    // Add personal info fields when needed
    if (this.config.showPersonalInfo) {
      formConfig['firstName'] = [this.initialData.firstName || '', [Validators.required, Validators.minLength(2)]];
      formConfig['lastName'] = [this.initialData.lastName || '', [Validators.required, Validators.minLength(2)]];
      formConfig['email'] = [this.initialData.email || '', [Validators.required, Validators.email]];
    }

    // Add admin-specific fields
    if (this.config.showPriority) {
      formConfig['priority'] = [this.initialData.priority || 'medium'];
    }

    if (this.config.showAssignment) {
      formConfig['assignedTo'] = [this.initialData.assignedTo || ''];
    }

    this.ticketForm = this.fb.group(formConfig);
  }

  onFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.ticketForm.patchValue({
        attachments: files
      });
    }
  }

  onSubmit() {
    // Professional validation: prevent submission if dropdown data isn't loaded
    if (this.isLoadingData) {
      console.warn('Form submission blocked: Dropdown data still loading');
      return;
    }

    if (this.dataLoadError) {
      console.error('Form submission blocked: Failed to load required dropdown data');
      this.toastService.showError('Unable to submit form. Some required data failed to load. Please refresh the page and try again.', 'Form Error');
      return;
    }

    // Additional validation: ensure required dropdowns have data
    if (this.departments.length === 0 || this.ticketTypes.length === 0 || this.priorities.length === 0) {
      console.error('Form submission blocked: Required dropdown data is empty');
      this.toastService.showError('Unable to submit form. Required dropdown data is not available. Please contact system administrator.', 'Form Error');
      return;
    }

    if (this.ticketForm.valid) {
      this.isSubmitting = true;
      this.formSubmit.emit({
        formData: this.ticketForm.value,
        onSuccess: () => {
          this.isSubmitting = false;
          if (this.config.mode === 'public') {
            this.showSuccess = true;
            this.ticketForm.reset();
            setTimeout(() => this.showSuccess = false, 5000);
          }
        },
        onError: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      Object.keys(this.ticketForm.controls).forEach(key => {
        this.ticketForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.formCancel.emit();
  }

  getFieldError(fieldName: string): string {
    const field = this.ticketForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return '';
  }
}