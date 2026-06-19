import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Edit, Trash2 } from 'lucide-angular';
import { RoleService, Role, CreateRoleRequest } from '../services/role.service';
import { ToastService } from '../../../shared/toast.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './user-roles.component.html',
  styleUrls: ['./user-roles.component.scss']
})
export class UserRolesComponent implements OnInit {
  private roleService = inject(RoleService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  // Roles management
  searchTerm = '';
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  isLoading = false;
  showRoleModal = false;
  isEditMode = false;
  isSubmitting = false;
  currentRole: Role | null = null;
  roleForm: FormGroup;

  // Lucide icons
  readonly Edit = Edit;
  readonly Trash2 = Trash2;

  constructor() {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.minLength(2)]],
      permissions: [[]]
    });
  }

  ngOnInit(): void {
    console.log('🔍 UserRoles component initializing...');
    this.loadRoles();
  }

  // Roles management methods
  loadRoles(): void {
    console.log('🔍 Loading roles...');
    this.isLoading = true;
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        console.log('✅ Roles loaded successfully:', roles);
        this.roles = roles;
        this.filteredRoles = [...roles];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading roles:', error);
        this.isLoading = false;
        this.toastService.showError('Failed to load roles. Please try again.', 'Load Error');
      }
    });
  }

  applySearch(): void {
    this.filteredRoles = this.roles.filter(role =>
      role.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      role.slug.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredRoles = [...this.roles];
  }

  createNewRole(): void {
    console.log('🔍 Creating new role...');
    this.isEditMode = false;
    this.currentRole = null;
    this.roleForm.reset({
      name: '',
      slug: '',
      permissions: []
    });
    console.log('🔍 Form reset, showing modal...');
    this.showRoleModal = true;
    console.log('🔍 Modal should be visible now. showRoleModal =', this.showRoleModal);
  }

  editRole(role: Role): void {
    console.log('🔍 Editing role:', role);
    this.isEditMode = true;
    this.currentRole = role;
    this.roleForm.patchValue({
      name: role.name,
      slug: role.slug,
      permissions: role.permissions || []
    });
    console.log('🔍 Form patched with values:', this.roleForm.value);
    this.showRoleModal = true;
    console.log('🔍 Edit modal should be visible. showRoleModal =', this.showRoleModal);
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.isEditMode = false;
    this.currentRole = null;
    this.roleForm.reset();
  }

  onRoleSubmit(): void {
    console.log('🔍 Role submit triggered');
    console.log('🔍 Form valid:', this.roleForm.valid);
    console.log('🔍 Form value:', this.roleForm.value);
    console.log('🔍 Form errors:', this.roleForm.errors);
    
    if (this.roleForm.valid) {
      this.isSubmitting = true;
      const formData = this.roleForm.value;

      // Auto-generate slug from name if not provided
      if (!formData.slug) {
        formData.slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      }

      console.log('🔍 Sending role data:', formData);

      const request = this.isEditMode && this.currentRole
        ? this.roleService.updateRole(this.currentRole.id, formData)
        : this.roleService.createRole(formData as CreateRoleRequest);

      request.subscribe({
        next: (role) => {
          this.isSubmitting = false;
          this.closeRoleModal();
          this.loadRoles(); // Reload the list
          console.log(`✅ Role ${this.isEditMode ? 'updated' : 'created'} successfully:`, role);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error(`❌ Error ${this.isEditMode ? 'updating' : 'creating'} role:`, error);
          const message = error.error?.error || error.message || 'An unexpected error occurred';
          this.toastService.showError(`Failed to ${this.isEditMode ? 'update' : 'create'} role: ${message}`, 'Role Error');
        }
      });
    } else {
      console.log('❌ Form is invalid');
      // Mark all fields as touched to show validation errors
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
    }
  }

  async deleteRole(role: Role): Promise<void> {
    console.log('🔍 Delete role requested for:', role);
    
    try {
      const confirmed = await this.confirmationService.confirm({
        title: 'Delete Role',
        message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
        confirmText: 'Delete Role',
        cancelText: 'Cancel',
        confirmButtonClass: 'danger'
      });

      if (confirmed) {
        console.log('🔍 User confirmed deletion, proceeding...');
        this.roleService.deleteRole(role.id).subscribe({
          next: () => {
            console.log('✅ Role deleted successfully from backend');
            this.loadRoles(); // Reload the list
            this.toastService.showSuccess('Role deleted successfully', 'Success');
          },
          error: (error) => {
            console.error('❌ Full error object:', error);
            console.error('❌ Error status:', error.status);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error body:', error.error);
            
            let errorMessage = 'Unknown error occurred';
            if (error.error && error.error.error) {
              errorMessage = error.error.error;
            } else if (error.message) {
              errorMessage = error.message;
            } else if (error.statusText) {
              errorMessage = error.statusText;
            }
            
            this.toastService.showError(`Failed to delete role: ${errorMessage}`, 'Delete Error');
          }
        });
      } else {
        console.log('🔍 User cancelled deletion');
      }
    } catch (error) {
      console.error('❌ Error in confirmation dialog:', error);
    }
  }
}
