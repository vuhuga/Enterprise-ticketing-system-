import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Edit, Trash2, Lock, Unlock } from 'lucide-angular';
import { StatusService, TicketStatus, CreateStatusRequest } from '../services/status.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-statuses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="statuses-page">
      <div class="page-header">
        <h1>Ticket Statuses</h1>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Ticket Statuses</span>
        </div>
      </div>

      <div class="content-container">
        <div class="search-section">
          <div class="search-left">
            <input 
              type="text" 
              placeholder="Search statuses..." 
              [(ngModel)]="searchTerm"
              (input)="applySearch()"
              class="search-input"
            >
            <button class="reset-btn" (click)="resetSearch()">Reset</button>
          </div>
          
          <div class="search-right">
            <button class="new-btn" (click)="openCreateModal()">Create New Status</button>
          </div>
        </div>

        <div class="table-container">
          <div *ngIf="isLoading" class="loading-state">
            <p>Loading statuses...</p>
          </div>
          
          <table class="data-table" *ngIf="!isLoading">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Value</th>
                <th>Label</th>
                <th>Color</th>
                <th>Sort Order</th>
                <th>Final Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let status of filteredStatuses" class="data-row" (click)="editStatus(status)">
                <td class="id-cell">{{ status.id }}</td>
                <td class="value-cell">{{ status.value }}</td>
                <td class="label-cell">{{ status.label }}</td>
                <td class="color-cell">
                  <div class="color-preview" [style.background-color]="status.color">
                    {{ status.color }}
                  </div>
                </td>
                <td class="order-cell">{{ status.sortOrder }}</td>
                <td class="final-cell">
                  <span class="final-badge" [class.final]="status.isFinal">
                    {{ status.isFinal ? 'Final' : 'Transition' }}
                  </span>
                </td>
                <td class="status-cell">
                  <span class="status-badge" [class.active]="status.isActive" [class.inactive]="!status.isActive">
                    {{ status.isActive ? 'Active' : 'Inactive' }}
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
            <h3>{{ isEditMode ? 'Edit Status' : 'Create New Status' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="statusForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="value">Value *</label>
              <input 
                type="text" 
                id="value" 
                formControlName="value" 
                placeholder="Enter status value (e.g., in_progress, on_hold)"
                class="form-input"
              >
              <div class="error-message" *ngIf="statusForm.get('value')?.errors?.['required'] && statusForm.get('value')?.touched">
                Value is required
              </div>
            </div>

            <div class="form-group">
              <label for="label">Label *</label>
              <input 
                type="text" 
                id="label" 
                formControlName="label" 
                placeholder="Enter status label (e.g., In Progress, On Hold)"
                class="form-input"
              >
              <div class="error-message" *ngIf="statusForm.get('label')?.errors?.['required'] && statusForm.get('label')?.touched">
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
                  placeholder="Workflow order"
                  class="form-input"
                  min="1"
                >
                <div class="error-message" *ngIf="statusForm.get('sortOrder')?.errors?.['required'] && statusForm.get('sortOrder')?.touched">
                  Sort order is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="isActive">
                  <span class="checkmark"></span>
                  Active
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="isFinal">
                  <span class="checkmark"></span>
                  Final Status (Closed/Resolved)
                </label>
              </div>
            </div>

            <div class="modal-actions">
              <button *ngIf="isEditMode" type="button" class="delete-btn" (click)="deleteStatus(currentStatus!)" [disabled]="isSubmitting">
                Delete
              </button>
              <button type="submit" class="submit-btn" [disabled]="statusForm.invalid || isSubmitting">
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
export class StatusesComponent implements OnInit {
  private statusService = inject(StatusService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  searchTerm = '';
  statuses: TicketStatus[] = [];
  filteredStatuses: TicketStatus[] = [];
  isLoading = false;
  showModal = false;
  isEditMode = false;
  isSubmitting = false;
  currentStatus: TicketStatus | null = null;

  statusForm: FormGroup;

  // Lucide icons
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Lock = Lock;
  readonly Unlock = Unlock;

  constructor() {
    this.statusForm = this.fb.group({
      value: ['', [Validators.required, Validators.minLength(2)]],
      label: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#007bff'],
      sortOrder: [1, [Validators.required, Validators.min(1)]],
      isActive: [true],
      isFinal: [false]
    });
  }

  ngOnInit(): void {
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.isLoading = true;
    this.statusService.getStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses.sort((a, b) => a.sortOrder - b.sortOrder);
        this.filteredStatuses = [...this.statuses];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.isLoading = false;
      }
    });
  }

  applySearch(): void {
    this.filteredStatuses = this.statuses.filter(status =>
      status.value.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      status.label.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredStatuses = [...this.statuses];
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentStatus = null;
    this.statusForm.reset({
      value: '',
      label: '',
      color: '#007bff',
      sortOrder: this.statuses.length + 1,
      isActive: true,
      isFinal: false
    });
    this.showModal = true;
  }

  editStatus(status: TicketStatus): void {
    this.isEditMode = true;
    this.currentStatus = status;
    this.statusForm.patchValue({
      value: status.value,
      label: status.label,
      color: status.color || '#007bff',
      sortOrder: status.sortOrder,
      isActive: status.isActive,
      isFinal: status.isFinal
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentStatus = null;
    this.statusForm.reset();
  }

  onSubmit(): void {
    if (this.statusForm.valid) {
      this.isSubmitting = true;
      const formData = this.statusForm.value;

      const request = this.isEditMode && this.currentStatus
        ? this.statusService.updateStatus(this.currentStatus.id, formData)
        : this.statusService.createStatus(formData as CreateStatusRequest);

      request.subscribe({
        next: (status) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadStatuses(); // Reload the list
          console.log(`Status ${this.isEditMode ? 'updated' : 'created'} successfully:`, status);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} status:`, error);
        }
      });
    }
  }

  toggleStatusStatus(status: TicketStatus): void {
    const updatedStatus = !status.isActive;
    this.statusService.updateStatus(status.id, { isActive: updatedStatus }).subscribe({
      next: (updatedStatus) => {
        // Update the local array
        const index = this.statuses.findIndex(s => s.id === status.id);
        if (index !== -1) {
          this.statuses[index] = { ...this.statuses[index], isActive: updatedStatus.isActive };
          this.applySearch(); // Refresh filtered list
        }
        console.log('Status updated:', updatedStatus);
      },
      error: (error) => {
        console.error('Error updating status:', error);
      }
    });
  }

  deleteStatus(status: TicketStatus): void {
    this.confirmationService.confirm({
      title: 'Delete Status',
      message: `Are you sure you want to delete the status "${status.label}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.statusService.deleteStatus(status.id).subscribe({
          next: () => {
            this.loadStatuses(); // Reload the list
            this.toastService.showSuccess('Success', 'Status deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting status:', error);
            this.toastService.showError('Error', 'Failed to delete status. It may be used by existing tickets.');
          }
        });
      }
    });
  }
}