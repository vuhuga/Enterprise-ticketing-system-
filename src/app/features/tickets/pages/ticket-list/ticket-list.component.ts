import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TicketService, Ticket, TicketFilter } from '../../services/ticket.service';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TimeAgoPipe],
  template: `
    <div class="ticket-list-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h2>Tickets</h2>
          <span class="ticket-count">{{ totalCount() }} total</span>
        </div>
        <button 
          type="button" 
          class="btn-primary"
          routerLink="/contact"
          (click)="navigateToCreate()">
          + New Ticket
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <form [formGroup]="filterForm" class="filters-form">
          <div class="filter-group">
            <input 
              type="text" 
              placeholder="Search tickets..." 
              formControlName="search"
              class="search-input">
          </div>
          
          <div class="filter-group">
            <select formControlName="status" class="filter-select">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div class="filter-group">
            <select formControlName="priority" class="filter-select">
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div class="filter-group">
            <select formControlName="department" class="filter-select">
              <option value="">All Departments</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="general">General</option>
            </select>
          </div>

          <button type="button" class="btn-secondary" (click)="clearFilters()">
            Clear
          </button>
        </form>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading tickets...</p>
      </div>

      <!-- Tickets List -->
      <div *ngIf="!loading() && tickets().length > 0" class="tickets-grid">
        <div *ngFor="let ticket of tickets(); trackBy: trackByTicketId" 
             class="ticket-card" 
             [routerLink]="['/tickets', ticket.id]">
          <div class="ticket-header">
            <div class="ticket-key">{{ ticket.key }}</div>
            <div class="ticket-status" [class]="'status-' + ticket.status">
              {{ ticket.status | titlecase }}
            </div>
          </div>
          
          <h3 class="ticket-subject">{{ ticket.subject }}</h3>
          
          <p class="ticket-description">
            {{ ticket.description | slice:0:150 }}
            <span *ngIf="ticket.description.length > 150">...</span>
          </p>
          
          <div class="ticket-meta">
            <div class="priority" [class]="'priority-' + ticket.priority">
              {{ ticket.priority | titlecase }}
            </div>
            <div class="department">{{ ticket.department }}</div>
            <div class="date">{{ ticket.createdAt | timeAgo }}</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && tickets().length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No tickets found</h3>
        <p>
          <span *ngIf="hasActiveFilters(); else noFiltersMessage">
            Try adjusting your filters or 
            <button type="button" class="link-button" (click)="clearFilters()">
              clear all filters
            </button>
          </span>
          <ng-template #noFiltersMessage>
            Get started by creating your first ticket
          </ng-template>
        </p>
        <button 
          *ngIf="!hasActiveFilters()"
          type="button" 
          class="btn-primary"
          routerLink="/tickets/create">
          Create First Ticket
        </button>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalCount() > pageSize" class="pagination">
        <button 
          type="button" 
          class="btn-secondary"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)">
          Previous
        </button>
        
        <span class="page-info">
          Page {{ currentPage() }} of {{ totalPages() }}
        </span>
        
        <button 
          type="button" 
          class="btn-secondary"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)">
          Next
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ticket-list-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-section h2 {
      margin: 0;
      color: #333;
    }

    .ticket-count {
      background: #f8f9fa;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .filters-form {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
    }

    .search-input, .filter-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .search-input:focus, .filter-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #6c757d;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .tickets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .ticket-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: inherit;
    }

    .ticket-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .ticket-key {
      font-family: monospace;
      font-weight: bold;
      color: #007bff;
    }

    .ticket-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-pending { background: #fff3cd; color: #856404; }
    .status-open { background: #d4edda; color: #155724; }
    .status-in_progress { background: #cce5ff; color: #004085; }
    .status-resolved { background: #d1ecf1; color: #0c5460; }
    .status-closed { background: #f8d7da; color: #721c24; }

    .ticket-subject {
      margin: 0 0 0.75rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      line-height: 1.4;
    }

    .ticket-description {
      color: #666;
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .ticket-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .priority {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .priority-low { background: #e2e3e5; color: #383d41; }
    .priority-normal { background: #bee5eb; color: #0c5460; }
    .priority-high { background: #ffeaa7; color: #856404; }
    .priority-urgent { background: #f5c6cb; color: #721c24; }

    .empty-state {
      text-align: center;
      padding: 4rem;
      color: #6c757d;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin-bottom: 0.5rem;
      color: #333;
    }

    .link-button {
      background: none;
      border: none;
      color: #007bff;
      text-decoration: underline;
      cursor: pointer;
      font-size: inherit;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding: 1rem;
    }

    .page-info {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filters-form {
        flex-direction: column;
      }

      .filter-group {
        min-width: auto;
      }

      .tickets-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TicketListComponent implements OnInit {
  // Injected services
  private readonly ticketService = inject(TicketService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Configuration
  readonly pageSize = 20;

  // Reactive state with signals
  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalCount = signal<number>(0);
  readonly currentPage = signal<number>(1);

  // Form for filters
  readonly filterForm: FormGroup = this.fb.group({
    search: [''],
    status: [''],
    priority: [''],
    department: ['']
  });

  // Computed values
  readonly totalPages = computed(() => 
    Math.ceil(this.totalCount() / this.pageSize)
  );
  
  readonly hasActiveFilters = computed(() => {
    const formValue = this.filterForm.value;
    return Object.values(formValue).some(value => value && value !== '');
  });

  ngOnInit(): void {
    this.loadTickets();
    this.setupFilterSubscription();
  }

  // Public methods
  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadTickets();
    }
  }

  navigateToCreate(): void {
    console.log('Navigating to create ticket...');
    this.router.navigate(['/contact']);
  }

  // TrackBy function for performance
  trackByTicketId(index: number, ticket: Ticket): string {
    return ticket.id;
  }

  // Private methods
  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadTickets();
      });
  }

  private loadTickets(): void {
    this.loading.set(true);

    const filter: TicketFilter = {
      ...this.filterForm.value,
      page: this.currentPage(),
      limit: this.pageSize
    };

    // Remove empty values from filter
    Object.keys(filter).forEach(key => {
      if (!filter[key as keyof TicketFilter]) {
        delete filter[key as keyof TicketFilter];
      }
    });

    this.ticketService.getTickets(filter).subscribe({
      next: (response) => {
        this.tickets.set(response.tickets);
        this.totalCount.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading tickets:', error);
        this.loading.set(false);
      }
    });
  }
}