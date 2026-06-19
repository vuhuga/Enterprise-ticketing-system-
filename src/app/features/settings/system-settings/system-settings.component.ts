import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Edit, Trash2, Lock, Unlock } from 'lucide-angular';
import { SystemSettingsService, SystemSetting, CreateSystemSettingRequest } from '../services/system-settings.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="system-settings-page">
      <div class="page-header">
        <h1>System Settings</h1>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>System Settings</span>
        </div>
      </div>

      <div class="content-container">
        <div class="search-section">
          <div class="search-left">
            <input 
              type="text" 
              placeholder="Search settings..." 
              [(ngModel)]="searchTerm"
              (input)="applySearch()"
              class="search-input"
            >
            <button class="reset-btn" (click)="resetSearch()">Reset</button>
          </div>
          
          <div class="search-right">
            <button class="new-btn" (click)="openCreateModal()">Create New Setting</button>
          </div>
        </div>

        <div class="table-container">
          <div *ngIf="isLoading" class="loading-state">
            <p>Loading system settings...</p>
          </div>
          
          <table class="data-table" *ngIf="!isLoading">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Key</th>
                <th>Value</th>
                <th>Description</th>
                <th>Category</th>
                <th>Data Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let setting of filteredSettings" class="data-row" (click)="editSetting(setting)">
                <td class="id-cell">{{ setting.id }}</td>
                <td class="key-cell">{{ setting.key }}</td>
                <td class="value-cell">
                  <div class="value-display" [ngSwitch]="setting.dataType">
                    <span *ngSwitchCase="'boolean'" class="boolean-value" [class.true]="setting.value === 'true'">
                      {{ setting.value === 'true' ? '✓ True' : '✗ False' }}
                    </span>
                    <span *ngSwitchCase="'number'" class="number-value">{{ setting.value }}</span>
                    <span *ngSwitchDefault class="text-value">{{ setting.value }}</span>
                  </div>
                </td>
                <td class="description-cell">{{ setting.description }}</td>
                <td class="category-cell">
                  <span class="category-badge">{{ setting.category }}</span>
                </td>
                <td class="type-cell">
                  <span class="type-badge" [class]="setting.dataType">{{ setting.dataType }}</span>
                </td>
                <td class="status-cell">
                  <span class="status-badge" [class.active]="setting.isActive" [class.inactive]="!setting.isActive">
                    {{ setting.isActive ? 'Active' : 'Inactive' }}
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
            <h3>{{ isEditMode ? 'Edit System Setting' : 'Create New Setting' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="settingForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="key">Key *</label>
              <input 
                type="text" 
                id="key" 
                formControlName="key" 
                placeholder="Enter setting key (e.g., max_file_size, email_enabled)"
                class="form-input"
                [readonly]="isEditMode"
              >
              <div class="error-message" *ngIf="settingForm.get('key')?.errors?.['required'] && settingForm.get('key')?.touched">
                Key is required
              </div>
              <div class="help-text" *ngIf="!isEditMode">
                Use underscore_case format. Key cannot be changed after creation.
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="category">Category *</label>
                <select id="category" formControlName="category" class="form-input">
                  <option value="">Select category</option>
                  <option value="general">General</option>
                  <option value="security">Security</option>
                  <option value="performance">Performance</option>
                  <option value="notifications">Notifications</option>
                  <option value="integrations">Integrations</option>
                  <option value="ui">User Interface</option>
                  <option value="business">Business Rules</option>
                </select>
                <div class="error-message" *ngIf="settingForm.get('category')?.errors?.['required'] && settingForm.get('category')?.touched">
                  Category is required
                </div>
              </div>

              <div class="form-group">
                <label for="dataType">Data Type *</label>
                <select id="dataType" formControlName="dataType" class="form-input" (change)="onDataTypeChange()">
                  <option value="">Select type</option>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
                <div class="error-message" *ngIf="settingForm.get('dataType')?.errors?.['required'] && settingForm.get('dataType')?.touched">
                  Data type is required
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="value">Value *</label>
              <div [ngSwitch]="settingForm.get('dataType')?.value">
                <select *ngSwitchCase="'boolean'" id="value" formControlName="value" class="form-input">
                  <option value="">Select value</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
                <input 
                  *ngSwitchCase="'number'" 
                  type="number" 
                  id="value" 
                  formControlName="value" 
                  placeholder="Enter numeric value"
                  class="form-input"
                >
                <textarea 
                  *ngSwitchCase="'json'" 
                  id="value" 
                  formControlName="value" 
                  placeholder="Enter valid JSON"
                  class="form-input textarea"
                  rows="4"
                ></textarea>
                <input 
                  *ngSwitchDefault 
                  type="text" 
                  id="value" 
                  formControlName="value" 
                  placeholder="Enter setting value"
                  class="form-input"
                >
              </div>
              <div class="error-message" *ngIf="settingForm.get('value')?.errors?.['required'] && settingForm.get('value')?.touched">
                Value is required
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description *</label>
              <textarea 
                id="description" 
                formControlName="description" 
                placeholder="Describe what this setting controls"
                class="form-input textarea"
                rows="3"
              ></textarea>
              <div class="error-message" *ngIf="settingForm.get('description')?.errors?.['required'] && settingForm.get('description')?.touched">
                Description is required
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
              <button 
                *ngIf="isEditMode && currentSetting" 
                type="button" 
                class="delete-btn" 
                (click)="deleteSetting(currentSetting)"
              >
                Delete
              </button>
              <button type="submit" class="submit-btn" [disabled]="settingForm.invalid || isSubmitting">
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
export class SystemSettingsComponent implements OnInit {
  private systemSettingsService = inject(SystemSettingsService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  searchTerm = '';
  settings: SystemSetting[] = [];
  filteredSettings: SystemSetting[] = [];
  isLoading = false;
  showModal = false;
  isEditMode = false;
  isSubmitting = false;
  currentSetting: SystemSetting | null = null;
  
  settingForm: FormGroup;

  // Lucide icons
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Lock = Lock;
  readonly Unlock = Unlock;

  constructor() {
    this.settingForm = this.fb.group({
      key: ['', [Validators.required, Validators.minLength(2)]],
      value: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', [Validators.required]],
      dataType: ['', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.systemSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings.sort((a, b) => a.category.localeCompare(b.category) || a.key.localeCompare(b.key));
        this.filteredSettings = [...this.settings];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading system settings:', error);
        this.isLoading = false;
      }
    });
  }

  applySearch(): void {
    this.filteredSettings = this.settings.filter(setting =>
      setting.key.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      setting.value.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (setting.description && setting.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      setting.category.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredSettings = [...this.settings];
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentSetting = null;
    this.settingForm.reset({
      key: '',
      value: '',
      description: '',
      category: '',
      dataType: '',
      isActive: true
    });
    this.showModal = true;
  }

  editSetting(setting: SystemSetting): void {
    this.isEditMode = true;
    this.currentSetting = setting;
    this.settingForm.patchValue({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      category: setting.category,
      dataType: setting.dataType,
      isActive: setting.isActive
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentSetting = null;
    this.settingForm.reset();
  }

  onDataTypeChange(): void {
    const dataType = this.settingForm.get('dataType')?.value;
    const valueControl = this.settingForm.get('value');
    
    // Reset value when data type changes
    if (dataType === 'boolean') {
      valueControl?.setValue('');
    } else if (dataType === 'number') {
      valueControl?.setValue('');
    } else {
      valueControl?.setValue('');
    }
  }

  onSubmit(): void {
    if (this.settingForm.valid) {
      this.isSubmitting = true;
      const formData = this.settingForm.value;

      const request = this.isEditMode && this.currentSetting
        ? this.systemSettingsService.updateSetting(this.currentSetting.id, formData)
        : this.systemSettingsService.createSetting(formData as CreateSystemSettingRequest);

      request.subscribe({
        next: (setting) => {
          this.isSubmitting = false;
          this.closeModal();
          this.loadSettings(); // Reload the list
          console.log(`System setting ${this.isEditMode ? 'updated' : 'created'} successfully:`, setting);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} system setting:`, error);
        }
      });
    }
  }

  toggleSettingStatus(setting: SystemSetting): void {
    const updatedStatus = !setting.isActive;
    this.systemSettingsService.updateSetting(setting.id, { isActive: updatedStatus }).subscribe({
      next: (updatedSetting) => {
        // Update the local array
        const index = this.settings.findIndex(s => s.id === setting.id);
        if (index !== -1) {
          this.settings[index] = { ...this.settings[index], isActive: updatedSetting.isActive };
          this.applySearch(); // Refresh filtered list
        }
        console.log('System setting updated:', updatedSetting);
      },
      error: (error) => {
        console.error('Error updating system setting:', error);
      }
    });
  }

  deleteSetting(setting: SystemSetting): void {
    this.confirmationService.confirm({
      title: 'Delete System Setting',
      message: `Are you sure you want to delete the setting "${setting.key}"? This action cannot be undone and may affect system functionality.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.systemSettingsService.deleteSetting(setting.id).subscribe({
          next: () => {
            this.loadSettings(); // Reload the list
            this.toastService.showSuccess('Success', 'System setting deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting system setting:', error);
            this.toastService.showError('Error', 'Failed to delete system setting. It may be required for system operation.');
          }
        });
      }
    });
  }
}