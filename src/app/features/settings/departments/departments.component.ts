import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Home, Edit, Trash2, Lock, Unlock } from 'lucide-angular';
import { DepartmentService, Department, CreateDepartmentRequest } from '../services/department.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="departments-page">
      <div class="page-header">
        <h1>Departments</h1>
        <div class="breadcrumb">
          <lucide-icon [img]="Home" [size]="16"></lucide-icon>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Departments</span>
        </div>
      </div>

      <div class="content-container">
        <div class="search-section">
          <div class="search-left">
            <input 
              type="text" 
              placeholder="Search departments..." 
              [(ngModel)]="searchTerm"
              (input)="applySearch()"
              class="search-input"
            >
            <button class="reset-btn" (click)="resetSearch()">Reset</button>
          </div>
          
          <div class="search-right">
            <button class="new-btn" (click)="openCreateModal()">Create New Department</button>
          </div>
        </div>

        <div class="table-container">
          <div *ngIf="isLoading" class="loading-state">
            <p>Loading departments...</p>
          </div>
          
          <table class="data-table" *ngIf="!isLoading">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let department of filteredDepartments" class="data-row" (click)="editDepartment(department)">
                <td class="id-cell">{{ department.id }}</td>
                <td class="name-cell">{{ department.name }}</td>
                <td class="description-cell">{{ department.description || 'No description' }}</td>
                <td class="status-cell">
                  <span class="status-badge" [class.active]="department.isActive" [class.inactive]="!department.isActive">
                    {{ department.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="actions-cell">
                  <span class="arrow-icon">></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()" (keydown.escape)="closeModal()" role="dialog" aria-modal="true" tabindex="-1">
        <div class="modal-content" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" role="document" tabindex="0">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit Department' : 'Create New Department' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="departmentForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="name">Name *</label>
              <input 
                type="text" 
                id="name" 
                formControlName="name" 
                placeholder="Enter department name"
                class="form-input"
              >
              <div class="error-message" *ngIf="departmentForm.get('name')?.errors?.['required'] && departmentForm.get('name')?.touched">
                Name is required
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                formControlName="description" 
                placeholder="Enter description (optional)"
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="isActive">
                <span class="checkmark"></span>
                Active
              </label>
            </div>

            <div class="modal-actions">
              <button *ngIf="isEditMode" type="button" class="delete-btn" (click)="deleteDepartment(currentDepartment!)" [disabled]="isSubmitting">
                Delete
              </button>
              <button type="submit" class="submit-btn" [disabled]="departmentForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../shared-styles/settings-page.scss']
})
export class DepartmentsComponent implements OnInit {
  private departmentService = inject(DepartmentService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  searchTerm = '';
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  isLoading = false;
  showModal = false;
  isEditMode = false;
  isSubmitting = false;
  currentDepartment: Department | null = null;
  
  departmentForm: FormGroup;

  // Lucide icons
  readonly Home = Home;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Lock = Lock;
  readonly Unlock = Unlock;

  constructor() {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.filteredDepartments = [...departments];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.isLoading = false;
      }
    });
  }

  applySearch(): void {
    this.filteredDepartments = this.departments.filter(department =>
      department.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (department.description && department.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredDepartments = [...this.departments];
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentDepartment = null;
    this.departmentForm.reset({
      name: '',
      description: '',
      isActive: true
    });
    this.showModal = true;
  }

  editDepartment(department: Department): void {
    this.isEditMode = true;
    this.currentDepartment = department;
    this.departmentForm.patchValue({
      name: department.name,
      description: department.description || '',
      isActive: department.isActive
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentDepartment = null;
    this.departmentForm.reset();
  }

  onSubmit(): void {
    if (this.departmentForm.valid) {
      this.isSubmitting = true;
      const formData = this.departmentForm.value;

      const request = this.isEditMode && this.currentDepartment
        ? this.departmentService.updateDepartment(this.currentDepartment.id, formData)
        : this.departmentService.createDepartment(formData as CreateDepartmentRequest);

      request.subscribe({
        next: (department) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadDepartments(); // Reload the list
          console.log(`Department ${this.isEditMode ? 'updated' : 'created'} successfully:`, department);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} department:`, error);
        }
      });
    }
  }

  toggleDepartmentStatus(department: Department): void {
    const updatedStatus = !department.isActive;
    this.departmentService.updateDepartment(department.id, { isActive: updatedStatus }).subscribe({
      next: (updatedDepartment) => {
        // Update the local array
        const index = this.departments.findIndex(d => d.id === department.id);
        if (index !== -1) {
          this.departments[index] = { ...this.departments[index], isActive: updatedStatus };
          this.applySearch(); // Refresh filtered list
        }
        console.log('Department status updated:', updatedDepartment);
      },
      error: (error) => {
        console.error('Error updating department status:', error);
      }
    });
  }

  deleteDepartment(department: Department): void {
    this.confirmationService.confirm({
      title: 'Delete Department',
      message: `Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.departmentService.deleteDepartment(department.id).subscribe({
          next: () => {
            this.loadDepartments(); // Reload the list
            this.toastService.showSuccess('Success', 'Department deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting department:', error);
            this.toastService.showError('Error', 'Failed to delete department. It may have associated tickets.');
          }
        });
      }
    });
  }
}