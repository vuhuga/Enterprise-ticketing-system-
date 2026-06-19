import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../shared/toast.service';
import { ContactService } from './services/contact.service';
import { DepartmentService } from '../../shared/services/department.service';
import { OrganizationService, Organization } from '../organizations/services/organization.service';
import { Department } from '../../shared/services/department.service';

@Component({
  selector: 'app-create-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-contact.component.html',
  styleUrls: ['./create-contact.component.scss']
})
export class CreateContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;
  departments: Department[] = [];
  isLoadingDepartments = false;
  organizations: Organization[] = [];
  isLoadingOrganizations = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private contactService = inject(ContactService);
  private departmentService = inject(DepartmentService);
  private organizationService = inject(OrganizationService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      jobTitle: [''],
      department: ['', [Validators.required]], // Required for smart role assignment
      organizationId: [null],
      city: [''],
      country: [''],
      province: [''],
      postalCode: [''],
      address: [''],
      notes: [''],
      status: ['Active'],
      preferredContactMethod: ['Email']
    });

    this.loadDepartments();
    this.loadOrganizations();
  }

  loadDepartments(): void {
    console.log('🔍 Loading departments for contact form...');
    this.isLoadingDepartments = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        console.log('✅ Departments loaded for contact form:', departments);
        this.departments = departments;
        this.isLoadingDepartments = false;
      },
      error: (error) => {
        console.error('❌ Error loading departments for contact form:', error);
        this.isLoadingDepartments = false;
        this.toastService.showError('Warning', 'Could not load departments');
      }
    });
  }

  loadOrganizations(): void {
    console.log('🔍 Loading organizations for contact form...');
    this.isLoadingOrganizations = true;
    this.organizationService.getOrganizations(1, 100).subscribe({
      next: (response: { organizations?: Organization[] } | Organization[]) => {
        console.log('✅ Organizations loaded for contact form:', response);
        // Handle both array response and paginated response
        this.organizations = Array.isArray(response) ? response : response.organizations || [];
        this.isLoadingOrganizations = false;
      },
      error: (error: unknown) => {
        console.error('❌ Error loading organizations for contact form:', error);
        this.isLoadingOrganizations = false;
        this.toastService.showError('Warning', 'Could not load organizations');
      }
    });
  }

  onSubmit(): void {
    console.log('🔍 Contact form submission triggered');
    console.log('🔍 Form valid:', this.contactForm.valid);
    console.log('🔍 Form value:', JSON.stringify(this.contactForm.value, null, 2));
    
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      const formData = this.contactForm.value;
      
      console.log('🔍 Sending contact data to backend:', JSON.stringify(formData, null, 2));

      this.contactService.createContact(formData).subscribe({
        next: (contact) => {
          console.log('✅ Contact created successfully:', contact);
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', `Contact ${contact.firstName} ${contact.lastName} created`);
          this.router.navigate(['/contacts']);
        },
        error: (error) => {
          console.error('❌ Error creating contact:', error);
          console.error('❌ Error details:', {
            status: error.status,
            message: error.message,
            error: error.error,
            fullResponse: error
          });
          console.error('❌ Response body:', JSON.stringify(error.error, null, 2));
          this.isSubmitting = false;
          const errorMessage = error.error?.error || error.error?.message || error.message || 'Unknown error occurred';
          this.toastService.showError('Error', `Failed to create contact: ${errorMessage}`);
        }
      });
    } else {
      console.log('❌ Form is invalid');
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      this.contactForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.contactForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.contactForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }
}
