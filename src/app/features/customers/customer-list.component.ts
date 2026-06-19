import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService, Customer } from './services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmationService, ConfirmationConfig } from '../../shared/services/confirmation.service';
import { LucideAngularModule, Plus, Search, Users, Trash2, Edit, Phone, MapPin, Calendar, ChevronRight, Loader2, User, Globe, Mail } from 'lucide-angular';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ModalComponent, FormSectionComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>Customers</h1>
          <p class="subtitle">Manage and view all customers in the system</p>
        </div>
        <div class="header-right">
          <button class="btn btn-primary" (click)="onCreateCustomer()">
            <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
            Add Customer
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="filters-section">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search customers by name, phone, or city..." 
            [(ngModel)]="searchTerm"
            (keyup.enter)="onSearch()"
            class="search-input">
          <button class="search-btn" (click)="onSearch()">
            <lucide-icon [img]="Search" [size]="18"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading customers...</p>
      </div>

      <!-- Customer Table -->
      <div *ngIf="!loading" class="table-container">
        
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact Info</th>
                <th>Location</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let customer of customers" (click)="onEdit(customer)" class="clickable-row">
                <td>
                  <div class="user-cell">
                    <div class="avatar">{{ customer.firstName.charAt(0) }}{{ customer.lastName.charAt(0) }}</div>
                    <div class="user-info">
                      <span class="user-name">{{ customer.firstName }} {{ customer.lastName }}</span>
                      <span class="user-email">{{ customer.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="icon-text" *ngIf="customer.phone">
                    <lucide-icon [img]="Phone" [size]="14" class="text-muted"></lucide-icon>
                    {{ customer.phone }}
                  </div>
                  <span class="text-muted" *ngIf="!customer.phone">-</span>
                </td>
                <td>
                  <div class="icon-text" *ngIf="customer.city">
                    <lucide-icon [img]="MapPin" [size]="14" class="text-muted"></lucide-icon>
                    {{ customer.city }}
                  </div>
                  <span class="text-muted" *ngIf="!customer.city">-</span>
                </td>
                <td>
                  <div class="icon-text">
                    <lucide-icon [img]="Calendar" [size]="14" class="text-muted"></lucide-icon>
                    {{ customer.createdAt | date:'mediumDate' }}
                  </div>
                </td>
                <td class="actions-cell">
                  <span class="arrow-icon"><lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="customers.length === 0" class="empty-state">
          <div class="empty-icon">
            <lucide-icon [img]="Users" [size]="64" strokeWidth="1.5"></lucide-icon>
          </div>
          <h3>No customers found</h3>
          <p>{{ searchTerm ? 'No customers match your search criteria.' : 'Start by adding your first customer to the system.' }}</p>
          <button class="btn btn-primary" (click)="onCreateCustomer()">
            <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
            Add New Customer
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && customers.length > 0" class="pagination-container">
        <div class="pagination-info">
          Showing <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> to <strong>{{ Math.min(currentPage * pageSize, totalCount) }}</strong> of <strong>{{ totalCount }}</strong> customers
        </div>
        <div class="pagination-controls">
          <button 
            class="page-btn" 
            [disabled]="currentPage === 1"
            (click)="onPageChange(currentPage - 1)">
            Previous
          </button>
          
          <button *ngFor="let page of [].constructor(totalPages); let i = index"
            class="page-btn"
            [class.active]="currentPage === i + 1"
            (click)="onPageChange(i + 1)">
            {{ i + 1 }}
          </button>
          
          <button 
            class="page-btn" 
            [disabled]="currentPage === totalPages"
            (click)="onPageChange(currentPage + 1)">
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Create Customer Modal -->
    <app-modal
      *ngIf="showCreateModal"
      title="Create New Customer"
      subtitle="Add a new customer profile to the system"
      [icon]="UserIconStr"
      confirmText="Create Customer"
      [loading]="saving"
      size="lg"
      (close)="closeCreateModal()"
      (cancel)="closeCreateModal()"
      (confirm)="saveCustomer()">
      
      <form class="customer-form">
        <!-- Basic Information -->
        <app-form-section title="Basic Information" [icon]="UserIconStr">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label required">First Name</label>
              <input type="text" class="form-control" [(ngModel)]="newCustomer.firstName" name="firstName" placeholder="e.g. John" required>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Last Name</label>
              <input type="text" class="form-control" [(ngModel)]="newCustomer.lastName" name="lastName" placeholder="e.g. Doe" required>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label required">Email Address</label>
              <div class="input-group">
                <span class="input-group-text">
                  <lucide-icon [img]="Mail" [size]="16"></lucide-icon>
                </span>
                <input type="email" class="form-control" [(ngModel)]="newCustomer.email" name="email" placeholder="john.doe@example.com" required>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <div class="input-group">
                <span class="input-group-text">
                  <lucide-icon [img]="Phone" [size]="16"></lucide-icon>
                </span>
                <input type="tel" class="form-control" [(ngModel)]="newCustomer.phone" name="phone" placeholder="+1 (555) 000-0000">
              </div>
            </div>
          </div>
        </app-form-section>

        <!-- Location Details -->
        <app-form-section title="Location Details" [icon]="MapPinStr">
          <div class="form-group">
            <label class="form-label">Address</label>
            <input type="text" class="form-control" [(ngModel)]="newCustomer.address" name="address" placeholder="e.g. 123 Main St, Suite 100">
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" class="form-control" [(ngModel)]="newCustomer.city" name="city" placeholder="e.g. New York">
            </div>
            
            <div class="form-group">
              <label class="form-label">Country</label>
              <div class="input-group">
                <span class="input-group-text prefix">
                  <lucide-icon [img]="Globe" [size]="16"></lucide-icon>
                </span>
                <input type="text" class="form-control" [(ngModel)]="newCustomer.country" name="country" placeholder="e.g. United States">
              </div>
            </div>
          </div>
        </app-form-section>

        <!-- Status -->
        <app-form-section>
          <div class="form-group">
            <label class="form-label required">Status</label>
            <select class="form-select" [(ngModel)]="newCustomer.status" name="status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </app-form-section>

      </form>

    </app-modal>
  `,
  styles: [`
    .page-container {
      max-width: 1400px;
      margin: 0 auto;
      padding-bottom: 4rem;
    }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      margin-bottom: 2rem;
      
      .header-left {
        h1 { font-size: 2rem; margin: 0 0 0.5rem 0; color: var(--slate-900); }
        .subtitle { color: var(--slate-500); font-size: 1.1rem; margin: 0; }
      }
    }

    .filters-section {
      margin-bottom: 1.5rem;
      
      .search-box {
        display: flex; max-width: 450px;
        background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
        
        .search-input {
          flex: 1; padding: 0.75rem 1rem; border: 1px solid var(--slate-200); border-right: none;
          border-radius: var(--radius-lg) 0 0 var(--radius-lg); font-size: 0.95rem;
          &:focus { outline: none; border-color: var(--primary-500); box-shadow: 0 0 0 3px var(--primary-100); z-index: 10; }
        }
        
        .search-btn {
          padding: 0 1.25rem; background: var(--primary-600); color: white;
          border: 1px solid var(--primary-600); border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
          cursor: pointer; display: flex; align-items: center; transition: all 0.2s;
          &:hover { background: var(--primary-700); border-color: var(--primary-700); }
        }
      }
    }

    .loading-state {
      text-align: center; padding: 4rem; color: var(--slate-500);
      .spinner {
        width: 40px; height: 40px; border: 3px solid var(--slate-200); border-top-color: var(--primary-600);
        border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;
      }
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .table-container {
      background: white; border-radius: var(--radius-xl); border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-sm); overflow: hidden;
    }

    .table-wrapper { overflow-x: auto; }

    .data-table {
      width: 100%; border-collapse: separate; border-spacing: 0; min-width: 900px;
      
      th {
        background: var(--slate-50); padding: 1rem 1.5rem; text-align: left;
        font-size: 0.85rem; font-weight: 600; color: var(--slate-700); text-transform: uppercase;
        letter-spacing: 0.05em; border-bottom: 1px solid var(--slate-200); white-space: nowrap;
      }
      
      td {
        padding: 1rem 1.5rem; vertical-align: middle; border-bottom: 1px solid var(--slate-100);
        color: var(--slate-700); font-size: 0.95rem;
      }
      
      tr:last-child td { border-bottom: none; }
      
      tr.clickable-row {
        cursor: pointer; transition: background-color 0.2s;
        &:hover {
          background: var(--primary-50);
          .arrow-icon { opacity: 1; transform: translateX(0); color: var(--primary-600); }
        }
      }
    }

    .user-cell {
      display: flex; align-items: center; gap: 1rem;
      
      .avatar {
        width: 40px; height: 40px; border-radius: 50%;
        background: var(--primary-100); color: var(--primary-700);
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
      }
      
      .user-info {
        display: flex; flex-direction: column;
        .user-name { font-weight: 600; color: var(--slate-900); }
        .user-email { font-size: 0.85rem; color: var(--slate-500); }
      }
    }

    .icon-text {
      display: flex; align-items: center; gap: 0.5rem; color: var(--slate-700);
      .text-muted { color: var(--slate-400); }
    }
    
    .text-muted { color: var(--slate-400); }

    .actions-cell { text-align: right; }
    
    .arrow-icon {
      display: inline-flex; opacity: 0; transform: translateX(-10px); transition: all 0.2s;
      color: var(--slate-300);
    }

    .empty-state {
      text-align: center; padding: 5rem 2rem;
      .empty-icon { color: var(--slate-200); margin-bottom: 1.5rem; }
      h3 { font-size: 1.25rem; font-weight: 600; color: var(--slate-900); margin: 0 0 0.5rem 0; }
      p { color: var(--slate-500); margin: 0 0 2rem 0; }
    }

    .pagination-container {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 1.5rem; padding: 0 0.5rem;
      
      .pagination-info { font-size: 0.9rem; color: var(--slate-500); }
      
      .pagination-controls {
        display: flex; gap: 0.5rem;
        
        .page-btn {
          min-width: 36px; height: 36px; padding: 0 0.75rem;
          border: 1px solid var(--slate-200); background: white; color: var(--slate-700);
          border-radius: var(--radius-md); cursor: pointer; font-size: 0.9rem; font-weight: 500;
          &:hover:not(:disabled) { background: var(--slate-50); }
          &.active { background: var(--primary-600); color: white; border-color: var(--primary-600); }
          &:disabled { opacity: 0.5; cursor: not-allowed; }
        }
      }
    }

    .btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.5rem; border-radius: var(--radius-lg);
      font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; transition: all 0.2s;
      
      &.btn-primary {
        background: var(--primary-600); color: white; box-shadow: var(--shadow-sm);
        &:hover { background: var(--primary-700); transform: translateY(-1px); box-shadow: var(--shadow-md); }
      }
    }

    /* Form Layout Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      margin-bottom: 1.25rem;

      .form-label {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--slate-800);
        display: block;
      }
    }

    .form-control,
    .form-select {
      width: 100%;
      height: 44px;
      padding: 0 1rem;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-lg);
      font-size: 0.95rem;
      transition: all 0.2s ease;

      &:focus {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 4px var(--primary-50);
        outline: none;
      }

      &::placeholder {
        color: var(--slate-400);
      }
    }

    .input-group {
      position: relative;
      display: flex;
      align-items: center;

      .input-group-text {
        position: absolute;
        left: 1rem;
        color: var(--slate-400);
        display: flex;
        align-items: center;
        pointer-events: none;
      }

      .form-control {
        padding-left: 3rem;
      }
    }
    
    @media (max-width: 640px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }
    
    .required:after {
      content: " *";
      color: var(--danger);
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .filters-section .search-box { max-width: 100%; }
      .pagination-container { flex-direction: column; gap: 1rem; text-align: center; }
    }
  `]
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  readonly Plus = Plus;
  readonly Search = Search;
  readonly Users = Users;
  readonly Trash2 = Trash2;
  readonly Edit = Edit;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly ChevronRight = ChevronRight;
  readonly Loader2 = Loader2;
  readonly User = User;
  readonly Globe = Globe;
  readonly Mail = Mail;

  // Icon strings for using with [innerHTML] in modal input
  // In a real app we might use a robust icon service or pass the component directly if supported
  // For now using empty strings as placeholders since the modal expects svg string or we need to adjust modal
  // Adjusting modal approach: The modal component expects icon content.
  // Actually, Lucide icons are components. The modal implementation I wrote uses [innerHTML]="icon". 
  // This expects an SVG string. Lucide-angular icons are components. 
  // To keep it simple, I'll update the modal input to use lucide icon component or just pass empty for now.
  // Better yet, I'll just use the icons available in the template directly.

  // Since I can't easily get the SVG string from the component in this context without rendering it,
  // I will just use reference properties for the template.
  readonly UserIconStr = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
  readonly MapPinStr = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';

  customers: Customer[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 10;

  // Modal State
  showCreateModal = false;
  saving = false;
  newCustomer: Partial<Customer & { status: string }> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    status: 'active'
  };

  // Make Math available in template
  Math = Math;

  ngOnInit() {
    this.loadCustomers();

    // Subscribe to real-time updates
    this.customerService.customers$.subscribe(customers => {
      this.customers = customers;
    });

    this.customerService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  loadCustomers() {
    this.customerService.getCustomers(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.totalCount = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load customers');
        console.error('Error loading customers:', error);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadCustomers();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadCustomers();
  }

  onEdit(customer: Customer) {
    this.router.navigate(['/customers/edit', customer.id]);
  }

  onDelete(customer: Customer) {
    this.confirmationService.confirm({
      title: 'Delete Customer',
      message: `Are you sure you want to delete ${customer.firstName} ${customer.lastName}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.customerService.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Success', 'Customer deleted successfully');
          },
          error: (error) => {
            this.toastService.showError('Error', 'Failed to delete customer');
            console.error('Error deleting customer:', error);
          }
        });
      }
    });
  }

  onCreateCustomer() {
    this.newCustomer = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      status: 'active'
      // Note: role is handled by service or backend usually, but we can set defaults if needed
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  saveCustomer() {
    if (!this.newCustomer.firstName || !this.newCustomer.lastName || !this.newCustomer.email) {
      this.toastService.showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    this.saving = true;

    // Ensure role is set
    const customerToSave = {
      ...this.newCustomer,
      role: 'customer'
    };

    this.customerService.createCustomer(customerToSave).subscribe({
      next: (response) => {
        this.toastService.showSuccess('Success', 'Customer created successfully');
        this.saving = false;
        this.showCreateModal = false;
        this.loadCustomers(); // Reload list
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to create customer');
        console.error('Error creating customer:', error);
        this.saving = false;
      }
    });
  }
}
