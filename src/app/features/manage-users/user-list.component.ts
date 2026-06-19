import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Edit, Trash2, Users, Plus, Search } from 'lucide-angular';
import { UserService, User } from './services/user.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  users: User[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 10;
  expandedRowId: number | null = null;

  ngOnInit() {
    this.loadUsers();
    
    // Subscribe to real-time updates
    this.userService.users$.subscribe(users => {
      this.users = users;
    });

    this.userService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  loadUsers() {
    this.userService.getUsers(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.totalCount = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);
        // The users are automatically updated via the service's observable
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load users');
        console.error('Error loading users:', error);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onEdit(user: User) {
    this.router.navigate(['/manage-users/edit', user.id]);
  }

  onDelete(user: User) {
    if (user.role === 'admin') {
      this.toastService.showError('Error', 'Cannot delete admin users');
      return;
    }

    this.confirmationService.confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Success', 'User deleted successfully');
          },
          error: (error) => {
            const errorMessage = error.error?.error || 'Failed to delete user';
            this.toastService.showError('Error', errorMessage);
            console.error('Error deleting user:', error);
          }
        });
      }
    });
  }

  onCreateUser() {
    this.router.navigate(['/manage-users/create']);
  }

  getRoleClass(role: string): string {
    return `role-${role}`;
  }

  // Make Math available in template
  Math = Math;

  // Lucide icons
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Users = Users;
  readonly Plus = Plus;
  readonly Search = Search;
}