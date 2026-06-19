import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Edit, Trash2, Lock, Unlock } from 'lucide-angular';
import { PriorityService, Priority, CreatePriorityRequest } from '../services/priority.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ToastService } from '../../../shared/toast.service';
import { SLAFormatter } from '../../../shared/utils/sla-formatter';

@Component({
  selector: 'app-priorities',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="priorities-page">
      <div class="page-header">
        <h1>Priority Levels</h1>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Priority Levels</span>
        </div>
      </div>

      <div class="content-container">
        <div class="search-section">
          <div class="search-left">
            <input 
              type="text" 
              placeholder="Search priorities..." 
              [(ngModel)]="searchTerm"
              (input)="applySearch()"
              class="search-input"
            >
            <button class="reset-btn" (click)="resetSearch()">Reset</button>
          </div>
          
          <div class="search-right">
            <button class="new-btn" (click)="openCreateModal()">Create New Priority</button>
          </div>
        </div>

        <div class="table-container">
          <div *ngIf="isLoading" class="loading-state">
            <p>Loading priorities...</p>
          </div>
          
          <table class="data-table" *ngIf="!isLoading">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Value</th>
                <th>Label</th>
                <th>Color</th>
                <th>Assignment SLA</th>
                <th>Resolution SLA</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let priority of filteredPriorities" class="data-row" (click)="editPriority(priority)">
                <td class="id-cell">{{ priority.id }}</td>
                <td class="value-cell">{{ priority.value }}</td>
                <td class="label-cell">{{ priority.label }}</td>
                <td class="color-cell">
                  <div class="color-preview" [style.background-color]="priority.color">
                    {{ priority.color }}
                  </div>
                </td>
                <td class="sla-cell">{{ formatSLA(priority.assignmentSlaMinutes) }}</td>
                <td class="sla-cell">{{ formatSLA(priority.resolutionSlaMinutes) }}</td>
                <td class="order-cell">{{ priority.sortOrder }}</td>
                <td class="status-cell">
                  <span class="status-badge" [class.active]="priority.isActive" [class.inactive]="!priority.isActive">
                    {{ priority.isActive ? 'Active' : 'Inactive' }}
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
      <div class="modal-overlay" *ngIf="showModal" 
           (click)="closeModal()" 
           (keydown.escape)="closeModal()" 
           tabindex="0">
        <div class="modal-content" 
             (click)="$event.stopPropagation()" 
             (keydown)="$event.stopPropagation()" 
             tabindex="-1">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit Priority' : 'Create New Priority' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="priorityForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="value">Value *</label>
              <input 
                type="text" 
                id="value" 
                formControlName="value" 
                placeholder="Enter priority value (e.g., high, critical)"
                class="form-input"
              >
              <div class="error-message" *ngIf="priorityForm.get('value')?.errors?.['required'] && priorityForm.get('value')?.touched">
                Value is required
              </div>
            </div>

            <div class="form-group">
              <label for="label">Label *</label>
              <input 
                type="text" 
                id="label" 
                formControlName="label" 
                placeholder="Enter priority label (e.g., High Priority)"
                class="form-input"
              >
              <div class="error-message" *ngIf="priorityForm.get('label')?.errors?.['required'] && priorityForm.get('label')?.touched">
                Label is required
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="color">Color</label>
                <input 
                  type="color" 
                  id="color" 
                  formControlName="color" 
                  class="form-input color-input"
                >
              </div>

              <div class="form-group">
                <label for="sortOrder">Sort Order *</label>
                <input 
                  type="number" 
                  id="sortOrder" 
                  formControlName="sortOrder" 
                  placeholder="Order (1=lowest, 4=highest)"
                  class="form-input"
                  min="1"
                >
                <div class="error-message" *ngIf="priorityForm.get('sortOrder')?.errors?.['required'] && priorityForm.get('sortOrder')?.touched">
                  Sort order is required
                </div>
              </div>
            </div>

            <div class="sla-section">
              <h4 class="section-title">SLA Configuration</h4>
              <p class="section-description">Define time limits for ticket assignment and resolution</p>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="assignmentSlaMinutes">Assignment SLA *</label>
                  <select 
                    id="assignmentSlaMinutes" 
                    formControlName="assignmentSlaMinutes" 
                    class="form-input"
                  >
                    <option [value]="null">Select timeframe</option>
                    <option *ngFor="let option of slaOptions" [value]="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <small class="help-text">Time allowed for ticket to be assigned to staff</small>
                </div>

                <div class="form-group">
                  <label for="resolutionSlaMinutes">Resolution SLA *</label>
                  <select 
                    id="resolutionSlaMinutes" 
                    formControlName="resolutionSlaMinutes" 
                    class="form-input"
                  >
                    <option [value]="null">Select timeframe</option>
                    <option *ngFor="let option of slaOptions" [value]="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <small class="help-text">Time allowed for ticket resolution after assignment</small>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="isActive">
                <span class="checkmark"></span>
                Active
              </label>
            </div>

            <div class="modal-actions">
              <button *ngIf="isEditMode" type="button" class="delete-btn" (click)="deletePriority(currentPriority!)" [disabled]="isSubmitting">
                Delete
              </button>
              <button type="submit" class="submit-btn" [disabled]="priorityForm.invalid || isSubmitting">
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
export class PrioritiesComponent implements OnInit {
  private priorityService = inject(PriorityService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  searchTerm = '';
  priorities: Priority[] = [];
  filteredPriorities: Priority[] = [];
  isLoading = false;
  showModal = false;
  isEditMode = false;
  isSubmitting = false;
  currentPriority: Priority | null = null;
  
  priorityForm: FormGroup;
  slaOptions = SLAFormatter.getSLAOptions();

  // Lucide icons
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Lock = Lock;
  readonly Unlock = Unlock;

  constructor() {
    this.priorityForm = this.fb.group({
      value: ['', [Validators.required, Validators.minLength(2)]],
      label: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#007bff'],
      sortOrder: [1, [Validators.required, Validators.min(1)]],
      assignmentSlaMinutes: [1440, [Validators.required, Validators.min(1)]],
      resolutionSlaMinutes: [10080, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  formatSLA(minutes: number | null | undefined): string {
    return SLAFormatter.formatMinutes(minutes);
  }

  ngOnInit(): void {
    this.loadPriorities();
  }

  loadPriorities(): void {
    this.isLoading = true;
    this.priorityService.getPriorities().subscribe({
      next: (priorities) => {
        this.priorities = priorities.sort((a, b) => a.sortOrder - b.sortOrder);
        this.filteredPriorities = [...this.priorities];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading priorities:', error);
        this.isLoading = false;
      }
    });
  }

  applySearch(): void {
    this.filteredPriorities = this.priorities.filter(priority =>
      priority.value.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      priority.label.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredPriorities = [...this.priorities];
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentPriority = null;
    this.priorityForm.reset({
      value: '',
      label: '',
      color: '#007bff',
      sortOrder: this.priorities.length + 1,
      assignmentSlaMinutes: 1440, // Default: 1 day
      resolutionSlaMinutes: 10080, // Default: 1 week
      isActive: true
    });
    this.showModal = true;
  }

  editPriority(priority: Priority): void {
    this.isEditMode = true;
    this.currentPriority = priority;
    this.priorityForm.patchValue({
      value: priority.value,
      label: priority.label,
      color: priority.color || '#007bff',
      sortOrder: priority.sortOrder,
      assignmentSlaMinutes: priority.assignmentSlaMinutes || 1440,
      resolutionSlaMinutes: priority.resolutionSlaMinutes || 10080,
      isActive: priority.isActive
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentPriority = null;
    this.priorityForm.reset();
  }

  onSubmit(): void {
    if (this.priorityForm.valid) {
      this.isSubmitting = true;
      const formData = this.priorityForm.value;

      const request = this.isEditMode && this.currentPriority
        ? this.priorityService.updatePriority(this.currentPriority.id, formData)
        : this.priorityService.createPriority(formData as CreatePriorityRequest);

      request.subscribe({
        next: (priority) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadPriorities(); // Reload the list
          console.log(`Priority ${this.isEditMode ? 'updated' : 'created'} successfully:`, priority);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} priority:`, error);
        }
      });
    }
  }

  togglePriorityStatus(priority: Priority): void {
    const updatedStatus = !priority.isActive;
    this.priorityService.updatePriority(priority.id, { isActive: updatedStatus }).subscribe({
      next: (updatedPriority) => {
        // Update the local array
        const index = this.priorities.findIndex(p => p.id === priority.id);
        if (index !== -1) {
          this.priorities[index] = { ...this.priorities[index], isActive: updatedStatus };
          this.applySearch(); // Refresh filtered list
        }
        console.log('Priority status updated:', updatedPriority);
      },
      error: (error) => {
        console.error('Error updating priority status:', error);
      }
    });
  }

  deletePriority(priority: Priority): void {
    this.confirmationService.confirm({
      title: 'Delete Priority',
      message: `Are you sure you want to delete the priority "${priority.label}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.priorityService.deletePriority(priority.id).subscribe({
          next: () => {
            this.loadPriorities(); // Reload the list
            this.toastService.showSuccess('Success', 'Priority deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting priority:', error);
            this.toastService.showError('Error', 'Failed to delete priority. It may be used by existing tickets.');
          }
        });
      }
    });
  }
}