import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DepartmentService, Department } from '../../shared/services/department.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss']
})
export class DepartmentListComponent implements OnInit {
  private departmentService = inject(DepartmentService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  departments: Department[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 10;

  ngOnInit() {
    this.loadDepartments();
    
    // Subscribe to real-time updates
    this.departmentService.departments$.subscribe(departments => {
      this.departments = departments;
    });

    this.departmentService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.totalCount = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load departments');
        console.error('Error loading departments:', error);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadDepartments();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadDepartments();
  }

  onEdit(department: Department) {
    // Navigate to edit department page (implement as needed)
    console.log('Edit department:', department);
  }

  onDelete(department: Department) {
    this.confirmationService.confirm({
      title: 'Delete Department',
      message: `Are you sure you want to delete ${department.name}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.departmentService.deleteDepartment(department.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Success', 'Department deleted successfully');
          },
          error: (error) => {
            this.toastService.showError('Error', 'Failed to delete department');
            console.error('Error deleting department:', error);
          }
        });
      }
    });
  }

  onCreateDepartment() {
    // Navigate to create department page (implement as needed)
    console.log('Create new department');
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  // Make Math available in template
  Math = Math;
}