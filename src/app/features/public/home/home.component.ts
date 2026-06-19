import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Footer } from '../footer/footer';
import { TicketService, CreateTicketRequest } from '../../tickets/services/ticket.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DepartmentService } from '../../../shared/services/department.service';
import { TicketTypeService } from '../../settings/services/ticket-type.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Footer],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private ticketTypeService = inject(TicketTypeService);

  private ticketService = inject(TicketService);
  private toastService = inject(ToastService);
  
  ticketForm: FormGroup;
  isSubmitting = false;
  showSuccess = false;
  successMessage = '';
  fileUploadMessages: string[] = [];

  // Dynamic data from APIs - NO HARDCODED VALUES
  ticketTypes: string[] = [];
  departments: string[] = [];
  isLoadingData = true;
  dataLoadError = false;

  constructor() {
    this.ticketForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      ticketType: ['', Validators.required],
      department: ['', Validators.required],
      requestDetails: ['', [Validators.required, Validators.minLength(10)]],
      attachments: [([] as File[])],
      agreeToTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
  }

  /**
   * Load departments and ticket types from API
   * Professional implementation - no hardcoded fallbacks in production
   */
  private loadDropdownData(): void {
    this.isLoadingData = true;
    this.dataLoadError = false;

    // Use Promise.all for concurrent API calls - better performance
    const departmentsPromise = this.departmentService.getAllDepartments().toPromise();
    const ticketTypesPromise = this.ticketTypeService.getTicketTypes().toPromise();

    Promise.all([departmentsPromise, ticketTypesPromise])
      .then(([departments, ticketTypes]) => {
        // Process departments - only active ones
        this.departments = departments
          ?.filter(dept => dept.status === 'active')
          ?.map(dept => dept.name) || [];

        // Process ticket types - only active ones
        this.ticketTypes = ticketTypes
          ?.filter(type => type.isActive)
          ?.map(type => type.name) || [];

        this.isLoadingData = false;

        // Validate data integrity
        if (this.departments.length === 0 || this.ticketTypes.length === 0) {
          console.warn('Warning: Some dropdown data is empty. Check database configuration.');
        }
      })
      .catch((error) => {
        console.error('Critical Error: Failed to load dropdown data from API:', error);
        this.dataLoadError = true;
        this.isLoadingData = false;
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const newFiles = Array.from(input.files);
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    const maxFileSizeMB = 5;
    const maxFilesAllowed = 3;

    const currentFiles: File[] = this.ticketForm.get('attachments')?.value || [];
    const validFiles: File[] = [];
    this.fileUploadMessages = [];

    for (const file of newFiles) {
      const isDuplicate = currentFiles.some(
        f => f.name === file.name && f.size === file.size && f.type === file.type
      );
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= maxFileSizeMB * 1024 * 1024;

      if (isDuplicate) {
        this.fileUploadMessages.push(`"${file.name}" is already selected.`);
        continue;
      }

      if (!isValidType) {
        this.fileUploadMessages.push(`"${file.name}" has an invalid file type.`);
        continue;
      }

      if (!isValidSize) {
        this.fileUploadMessages.push(`"${file.name}" exceeds the ${maxFileSizeMB}MB limit.`);
        continue;
      }

      validFiles.push(file);
    }

    const totalFiles = currentFiles.length + validFiles.length;
    if (totalFiles > maxFilesAllowed) {
      this.fileUploadMessages.push(`You can only upload up to ${maxFilesAllowed} files.`);
      return;
    }

    const updatedFiles = [...currentFiles, ...validFiles];
    this.ticketForm.patchValue({ attachments: updatedFiles });

    input.value = ''; // allow reselecting same file again
  }

  onFileRemove(file: File): void {
    const attachments: File[] = this.ticketForm.get('attachments')?.value || [];
    const updatedAttachments = attachments.filter(
      f => !(f.name === file.name && f.size === file.size)
    );
    this.ticketForm.patchValue({ attachments: updatedAttachments });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  onSubmit(): void {
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
    if (this.departments.length === 0 || this.ticketTypes.length === 0) {
      console.error('Form submission blocked: Required dropdown data is empty');
      this.toastService.showError('Unable to submit form. Required dropdown data is not available. Please contact system administrator.', 'Form Error');
      return;
    }

    if (this.ticketForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.ticketForm.value;
      
      // Prepare ticket data for API
      const ticketData: CreateTicketRequest = {
        subject: formData.subject,
        type: formData.ticketType,
        department: formData.department,
        description: formData.requestDetails,
        priority: 'medium', // Default priority for public tickets
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        attachments: formData.attachments || []
      };

      // Submit to API
      this.ticketService.createTicket(ticketData).subscribe({
        next: (ticket) => {
          this.isSubmitting = false;
          this.showSuccess = true;
          this.successMessage = `✅ Ticket #${ticket.key || ticket.id} submitted successfully. You may log in later to track it.`;
          
          console.log('✅ Ticket created successfully:', ticket);
          
          // Reset form
          this.ticketForm.reset({
            firstName: '',
            lastName: '',
            email: '',
            subject: '',
            ticketType: '',
            department: '',
            requestDetails: '',
            attachments: [],
            agreeToTerms: false
          });

          // Hide success message after 5 seconds
          setTimeout(() => {
            this.showSuccess = false;
            this.successMessage = '';
          }, 5000);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('❌ Error creating ticket:', error);
          
          // Show error message in the UI
          const errorMessage = error.error?.message || error.error?.error || 'Failed to submit ticket. Please try again.';
          this.toastService.showError(errorMessage, 'Submission Error');
        }
      });
    } else {
      Object.keys(this.ticketForm.controls).forEach(key => {
        this.ticketForm.get(key)?.markAsTouched();
      });
    }
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

  scrollToForm(): void {
    const formElement = document.querySelector('.ticket-form-section');
    if (formElement) {
      formElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}