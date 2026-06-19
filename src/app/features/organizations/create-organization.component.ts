import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';
import { OrganizationService } from './services/organization.service';
import { ToastService } from '../../shared/toast.service';

// Using the Organization interface from the service

// Create Organization Component - handles new organization creation with form validation
@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './create-organization.component.html',
  styleUrls: ['./create-organization.component.scss']
})
export class CreateOrganizationComponent implements OnInit {
  // Form state
  organizationForm!: FormGroup; // Main reactive form for organization data
  isSubmitting = false; // Prevents double submissions during form processing

  // UI icons
  readonly Home = Home; // Home icon for navigation

  // Services
  private fb = inject(FormBuilder); // Form builder for reactive forms
  private router = inject(Router); // Router for navigation after creation
  private organizationService = inject(OrganizationService); // Organization CRUD operations
  private toastService = inject(ToastService); // User feedback notifications

  // Initialize component and form
  ngOnInit(): void {
    this.initializeForm();
  }

  // Set up reactive form with validation rules
  private initializeForm(): void {
    this.isSubmitting = false; // Reset submission state

    this.organizationForm = this.fb.group({
      // Required organization identifier
      name: ['', [Validators.required, Validators.minLength(2)]],
      // Optional descriptive information
      description: [''],
      // Contact and location data
      address: [''],
      phone: [''],
      email: ['', [Validators.email]], // Email format validation
      website: [''],
      // Geographic classification
      city: [''],
      country: [''],
      // Required operational status (defaults to active)
      status: ['active', Validators.required]
    });
  }

  // Handle form submission with validation and error handling
  onSubmit(): void {
    if (this.organizationForm.valid) {
      this.isSubmitting = true; // Prevent double submission
      const formData = this.organizationForm.value;

      this.organizationService.createOrganization(formData).subscribe({
        next: (org) => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', `Organization ${org.name} created successfully`);
          this.router.navigate(['/organizations']); // Navigate to organization list
        },
        error: () => {
          this.isSubmitting = false;
          this.toastService.showError('Error', 'Failed to create organization. Please try again.');
        }
      });
    } else {
      this.markFormGroupTouched(); // Show validation errors
    }
  }

  // Mark all form fields as touched to display validation errors
  private markFormGroupTouched(): void {
    Object.keys(this.organizationForm.controls).forEach(key => {
      const control = this.organizationForm.get(key);
      control?.markAsTouched();
    });
  }

  // Get user-friendly error message for a specific field
  getFieldError(fieldName: string): string {
    const control = this.organizationForm.get(fieldName);

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

  // Convert field names to user-friendly display labels
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      name: 'Organization name',
      description: 'Description',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
      status: 'Status'
    };
    return displayNames[fieldName] || fieldName;
  }

  // Check if a field should show invalid styling
  isFieldInvalid(fieldName: string): boolean {
    const control = this.organizationForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }
}