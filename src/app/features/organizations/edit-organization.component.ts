import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrganizationService } from './services/organization.service';
import { ToastService } from '../../shared/toast.service';

// Edit Organization Component - handles organization editing with form validation
@Component({
  selector: 'app-edit-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-organization.component.html',
  styleUrls: ['./edit-organization.component.scss']
})
export class EditOrganizationComponent implements OnInit {
  // Dependency injection
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  // Form and state management
  organizationForm!: FormGroup;
  isSubmitting = false; // Prevents double submissions
  loading = true; // Shows loading state during data fetch
  organizationId!: number; // ID from route parameters

  // Initialize component and load data
  ngOnInit() {
    this.initForm();
    this.organizationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrganization();
  }

  // Set up reactive form with validation rules
  initForm() {
    this.organizationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      address: [''],
      phone: [''],
      email: ['', [Validators.email]],
      website: [''],
      status: ['active', Validators.required]
    });
  }

  // Load organization data from API
  loadOrganization() {
    this.organizationService.getOrganizationById(this.organizationId).subscribe({
      next: (organization) => {
        this.organizationForm.patchValue(organization);
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load organization');
        console.error('Error loading organization:', error);
        this.router.navigate(['/organizations']);
      }
    });
  }

  // Handle form submission with validation
  onSubmit() {
    if (this.organizationForm.valid) {
      this.isSubmitting = true;
      const organizationData = this.organizationForm.value;

      this.organizationService.updateOrganization(this.organizationId, organizationData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', 'Organization updated successfully');
          this.router.navigate(['/organizations']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.showError('Error', 'Failed to update organization: ' + (error.error?.message || error.message));
          console.error('Error updating organization:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  // Navigate back to organizations list
  onCancel() {
    this.router.navigate(['/organizations']);
  }

  // Delete organization with confirmation dialog
  onDelete() {
    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      this.organizationService.deleteOrganization(this.organizationId).subscribe({
        next: () => {
          this.toastService.showSuccess('Success', 'Organization deleted successfully');
          this.router.navigate(['/organizations']);
        },
        error: (error) => {
          console.error('Error deleting organization:', error);
          this.toastService.showError('Error', 'Failed to delete organization');
        }
      });
    }
  }

  // Check if field should show invalid styling
  isFieldInvalid(fieldName: string): boolean {
    const field = this.organizationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Get validation error message for field
  getFieldError(fieldName: string): string {
    const field = this.organizationForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  // Mark all form fields as touched to show validation errors
  private markFormGroupTouched() {
    Object.keys(this.organizationForm.controls).forEach(key => {
      const control = this.organizationForm.get(key);
      control?.markAsTouched();
    });
  }
}