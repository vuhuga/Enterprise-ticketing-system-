import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Building, Plus, Search, Edit, Trash2, Home } from 'lucide-angular';
import { OrganizationService, Organization } from './services/organization.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

// Organization list component - displays and manages organization data
@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './organization-list.component.html',
  styleUrls: ['./organization-list.component.scss']
})
export class OrganizationListComponent implements OnInit {
  // Services
  private organizationService = inject(OrganizationService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  // Data state
  organizations: Organization[] = [];
  loading = false;
  searchTerm = '';

  // Pagination state
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 10;
  expandedRowId: number | null = null;

  // UI icons
  readonly Building = Building;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Home = Home;

  // Initialize component and subscribe to data updates
  ngOnInit() {
    this.loadOrganizations();

    // Subscribe to real-time updates
    this.organizationService.organizations$.subscribe(organizations => {
      this.organizations = organizations;
    });

    this.organizationService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  // Load organizations with pagination and search
  loadOrganizations() {
    this.organizationService.getOrganizations(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.totalCount = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);
        // The organizations are automatically updated via the service's observable
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load organizations');
        console.error('Error loading organizations:', error);
      }
    });
  }

  // Handle search input
  onSearch() {
    this.currentPage = 1;
    this.loadOrganizations();
  }

  // Handle page navigation
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadOrganizations();
  }

  // Navigate to edit organization
  onEdit(organization: Organization) {
    this.router.navigate(['/organizations/edit', organization.id]);
  }

  // Delete organization with confirmation
  onDelete(organization: Organization) {
    this.confirmationService.confirm({
      title: 'Delete Organization',
      message: `Are you sure you want to delete ${organization.name}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.organizationService.deleteOrganization(organization.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Success', 'Organization deleted successfully');
          },
          error: (error) => {
            this.toastService.showError('Error', 'Failed to delete organization');
            console.error('Error deleting organization:', error);
          }
        });
      }
    });
  }

  // Navigate to create organization
  onCreateOrganization() {
    this.router.navigate(['/organizations/create']);
  }

  // Get CSS class for status badges
  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  // Make Math available in template
  Math = Math;
}