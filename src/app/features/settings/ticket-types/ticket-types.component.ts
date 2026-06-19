import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Edit, Trash2, Lock, Unlock } from 'lucide-angular';
import { TicketTypeService, TicketType, CreateTicketTypeRequest } from '../services/ticket-type.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-ticket-types',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="ticket-types-page">
      <div class="page-header">
        <h1>Ticket Types</h1>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Ticket Types</span>
        </div>
      </div>

      <div class="content-container">
        <div class="search-section">
          <div class="search-left">
            <input 
              type="text" 
              placeholder="Search ticket types..." 
              [(ngModel)]="searchTerm"
              (input)="applySearch()"
              class="search-input"
            >
            <button class="reset-btn" (click)="resetSearch()">Reset</button>
          </div>
          
          <div class="search-right">
            <button class="new-btn" (click)="openCreateModal()">Create New Ticket Type</button>
          </div>
        </div>

        <div class="table-container">
          <div *ngIf="isLoading" class="loading-state">
            <p>Loading ticket types...</p>
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
              <tr *ngFor="let ticketType of filteredTicketTypes" class="data-row" (click)="editTicketType(ticketType)">
                <td class="id-cell">{{ ticketType.id }}</td>
                <td class="name-cell">{{ ticketType.name }}</td>
                <td class="description-cell">{{ ticketType.description || 'No description' }}</td>
                <td class="status-cell">
                  <span class="status-badge" [class.active]="ticketType.isActive" [class.inactive]="!ticketType.isActive">
                    {{ ticketType.isActive ? 'Active' : 'Inactive' }}
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
            <h3>{{ isEditMode ? 'Edit Ticket Type' : 'Create New Ticket Type' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="ticketTypeForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="name">Name *</label>
              <input 
                type="text" 
                id="name" 
                formControlName="name" 
                placeholder="Enter ticket type name"
                class="form-input"
              >
              <div class="error-message" *ngIf="ticketTypeForm.get('name')?.errors?.['required'] && ticketTypeForm.get('name')?.touched">
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
              <button *ngIf="isEditMode" type="button" class="delete-btn" (click)="deleteTicketType(currentTicketType!)" [disabled]="isSubmitting">
                Delete
              </button>
              <button type="submit" class="submit-btn" [disabled]="ticketTypeForm.invalid || isSubmitting">
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
export class TicketTypesComponent implements OnInit {
  private ticketTypeService = inject(TicketTypeService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  searchTerm = '';
  ticketTypes: TicketType[] = [];
  filteredTicketTypes: TicketType[] = [];
  isLoading = false;
  showModal = false;
  isEditMode = false;
  isSubmitting = false;
  currentTicketType: TicketType | null = null;
  
  ticketTypeForm: FormGroup;

  // Lucide icons
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Lock = Lock;
  readonly Unlock = Unlock;

  constructor() {
    this.ticketTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadTicketTypes();
  }

  loadTicketTypes(): void {
    this.isLoading = true;
    this.ticketTypeService.getTicketTypes().subscribe({
      next: (ticketTypes) => {
        this.ticketTypes = ticketTypes;
        this.filteredTicketTypes = [...ticketTypes];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ticket types:', error);
        this.isLoading = false;
      }
    });
  }

  applySearch(): void {
    this.filteredTicketTypes = this.ticketTypes.filter(ticketType =>
      ticketType.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (ticketType.description && ticketType.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredTicketTypes = [...this.ticketTypes];
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentTicketType = null;
    this.ticketTypeForm.reset({
      name: '',
      description: '',
      isActive: true
    });
    this.showModal = true;
  }

  editTicketType(ticketType: TicketType): void {
    this.isEditMode = true;
    this.currentTicketType = ticketType;
    this.ticketTypeForm.patchValue({
      name: ticketType.name,
      description: ticketType.description || '',
      isActive: ticketType.isActive
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentTicketType = null;
    this.ticketTypeForm.reset();
  }

  onSubmit(): void {
    if (this.ticketTypeForm.valid) {
      this.isSubmitting = true;
      const formData = this.ticketTypeForm.value;

      const request = this.isEditMode && this.currentTicketType
        ? this.ticketTypeService.updateTicketType(this.currentTicketType.id, formData)
        : this.ticketTypeService.createTicketType(formData as CreateTicketTypeRequest);

      request.subscribe({
        next: (ticketType) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadTicketTypes(); // Reload the list
          console.log(`Ticket type ${this.isEditMode ? 'updated' : 'created'} successfully:`, ticketType);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} ticket type:`, error);
        }
      });
    }
  }

  toggleTicketTypeStatus(ticketType: TicketType): void {
    const updatedStatus = !ticketType.isActive;
    this.ticketTypeService.updateTicketType(ticketType.id, { isActive: updatedStatus }).subscribe({
      next: (updatedTicketType) => {
        // Update the local array
        const index = this.ticketTypes.findIndex(t => t.id === ticketType.id);
        if (index !== -1) {
          this.ticketTypes[index] = { ...this.ticketTypes[index], isActive: updatedStatus };
          this.applySearch(); // Refresh filtered list
        }
        console.log('Ticket type status updated:', updatedTicketType);
      },
      error: (error) => {
        console.error('Error updating ticket type status:', error);
      }
    });
  }

  deleteTicketType(ticketType: TicketType): void {
    this.confirmationService.confirm({
      title: 'Delete Ticket Type',
      message: `Are you sure you want to delete the ticket type "${ticketType.name}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.ticketTypeService.deleteTicketType(ticketType.id).subscribe({
          next: () => {
            this.loadTicketTypes(); // Reload the list
            this.toastService.showSuccess('Success', 'Ticket type deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting ticket type:', error);
            this.toastService.showError('Error', 'Failed to delete ticket type. It may have associated tickets.');
          }
        });
      }
    });
  }
}