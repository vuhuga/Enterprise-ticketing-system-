import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContactService } from './services/contact.service';
import { DepartmentService } from '../../shared/services/department.service';
import { Department } from '../../shared/services/department.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-edit-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-contact.component.html',
  styleUrls: ['./edit-contact.component.scss']
})
export class EditContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private departmentService = inject(DepartmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  contactForm!: FormGroup;
  isSubmitting = false;
  loading = true;
  contactId!: number;
  departments: Department[] = [];
  isLoadingDepartments = false;

  ngOnInit() {
    this.initForm();
    this.contactId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDepartments();
    this.loadContact();
  }

  loadDepartments(): void {
    console.log('🔍 Loading departments for edit contact form...');
    this.isLoadingDepartments = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        console.log('✅ Departments loaded for edit contact form:', departments);
        this.departments = departments;
        this.isLoadingDepartments = false;
      },
      error: (error) => {
        console.error('❌ Error loading departments for edit contact form:', error);
        this.isLoadingDepartments = false;
        this.toastService.showError('Warning', 'Could not load departments');
      }
    });
  }

  initForm() {
    this.contactForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      department: ['', Validators.required],
      position: [''],
      company: [''],
      status: ['active', Validators.required]
    });
  }

  loadContact() {
    this.contactService.getContactById(this.contactId).subscribe({
      next: (contact) => {
        this.contactForm.patchValue(contact);
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load contact');
        console.error('Error loading contact:', error);
        this.router.navigate(['/contacts']);
      }
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      const contactData = this.contactForm.value;
      
      this.contactService.updateContact(this.contactId, contactData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', 'Contact updated successfully');
          this.router.navigate(['/contacts']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.showError('Error', 'Failed to update contact: ' + (error.error?.message || error.message));
          console.error('Error updating contact:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/contacts']);
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      this.contactService.deleteContact(this.contactId).subscribe({
        next: () => {
          this.toastService.showSuccess('Success', 'Contact deleted successfully');
          this.router.navigate(['/contacts']);
        },
        error: (error) => {
          console.error('Error deleting contact:', error);
          this.toastService.showError('Error', 'Failed to delete contact');
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private markFormGroupTouched() {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }
}