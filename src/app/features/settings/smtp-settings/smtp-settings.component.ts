import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface SmtpSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  mailEncryption: string;
  fromAddress: string;
  fromName: string;
}

@Component({
  selector: 'app-smtp-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="smtp-settings-container">
      <div class="page-header">
        <h1>SMTP Settings</h1>
        <div class="breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span>SMTP Settings</span>
        </div>
      </div>

      <div class="settings-card">
        <form [formGroup]="smtpForm" (ngSubmit)="onSave()">
          <div class="form-grid">
            <!-- SMTP Host -->
            <div class="form-group">
              <label for="smtpHost">SMTP Host</label>
              <input
                type="text"
                id="smtpHost"
                formControlName="smtpHost"
                class="form-control"
                [class.error]="smtpForm.get('smtpHost')?.invalid && smtpForm.get('smtpHost')?.touched"
              />
              <div class="error-message" *ngIf="smtpForm.get('smtpHost')?.invalid && smtpForm.get('smtpHost')?.touched">
                SMTP Host is required
              </div>
            </div>

            <!-- SMTP Port -->
            <div class="form-group">
              <label for="smtpPort">SMTP Port</label>
              <input
                type="number"
                id="smtpPort"
                formControlName="smtpPort"
                class="form-control"
                [class.error]="smtpForm.get('smtpPort')?.invalid && smtpForm.get('smtpPort')?.touched"
              />
              <div class="error-message" *ngIf="smtpForm.get('smtpPort')?.invalid && smtpForm.get('smtpPort')?.touched">
                SMTP Port is required
              </div>
            </div>

            <!-- SMTP Username -->
            <div class="form-group">
              <label for="smtpUsername">SMTP Username</label>
              <input
                type="text"
                id="smtpUsername"
                formControlName="smtpUsername"
                class="form-control"
                [class.error]="smtpForm.get('smtpUsername')?.invalid && smtpForm.get('smtpUsername')?.touched"
              />
              <div class="error-message" *ngIf="smtpForm.get('smtpUsername')?.invalid && smtpForm.get('smtpUsername')?.touched">
                SMTP Username is required
              </div>
            </div>

            <!-- SMTP Password -->
            <div class="form-group">
              <label for="smtpPassword">SMTP Password</label>
              <input
                type="password"
                id="smtpPassword"
                formControlName="smtpPassword"
                class="form-control"
                [class.error]="smtpForm.get('smtpPassword')?.invalid && smtpForm.get('smtpPassword')?.touched"
              />
              <div class="error-message" *ngIf="smtpForm.get('smtpPassword')?.invalid && smtpForm.get('smtpPassword')?.touched">
                SMTP Password is required
              </div>
            </div>

            <!-- Mail Encryption -->
            <div class="form-group">
              <label for="mailEncryption">Mail Encryption</label>
              <input
                type="text"
                id="mailEncryption"
                formControlName="mailEncryption"
                class="form-control"
                [class.error]="smtpForm.get('mailEncryption')?.invalid && smtpForm.get('mailEncryption')?.touched"
              />
              <div class="error-message" *ngIf="smtpForm.get('mailEncryption')?.invalid && smtpForm.get('mailEncryption')?.touched">
                Mail Encryption is required
              </div>
            </div>

            <!-- From Address -->
            <div class="form-group">
              <label for="fromAddress">From Address</label>
              <input
                type="email"
                id="fromAddress"
                formControlName="fromAddress"
                class="form-control"
                [class.error]="smtpForm.get('fromAddress')?.invalid && smtpForm.get('fromAddress')?.touched"
              />
              <div class="error-message" *ngIf="smtpForm.get('fromAddress')?.invalid && smtpForm.get('fromAddress')?.touched">
                <span *ngIf="smtpForm.get('fromAddress')?.errors?.['required']">From Address is required</span>
                <span *ngIf="smtpForm.get('fromAddress')?.errors?.['email']">Please enter a valid email address</span>
              </div>
            </div>
          </div>

          <!-- From Name (full width) -->
          <div class="form-group full-width">
            <label for="fromName">From Name</label>
            <input
              type="text"
              id="fromName"
              formControlName="fromName"
              class="form-control"
              [class.error]="smtpForm.get('fromName')?.invalid && smtpForm.get('fromName')?.touched"
            />
            <div class="error-message" *ngIf="smtpForm.get('fromName')?.invalid && smtpForm.get('fromName')?.touched">
              From Name is required
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="onReset()">
              Reset
            </button>
            <button type="button" class="btn btn-test" (click)="onTestConnection()" [disabled]="smtpForm.invalid || isLoading || isTesting">
              <span *ngIf="isTesting">Testing...</span>
              <span *ngIf="!isTesting">Test Connection</span>
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="smtpForm.invalid || isLoading">
              <span *ngIf="isLoading">Saving...</span>
              <span *ngIf="!isLoading">Save</span>
            </button>
          </div>
        </form>

        <!-- Success/Error Messages -->
        <div class="alert alert-success" *ngIf="successMessage">
          {{ successMessage }}
        </div>
        <div class="alert alert-error" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
        <div class="alert alert-info" *ngIf="testMessage">
          {{ testMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .smtp-settings-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .settings-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-control {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control.error {
      border-color: #ef4444;
    }

    .form-control.error:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-message {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-secondary {
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background-color: #e5e7eb;
    }

    .btn-test {
      background-color: #17a2b8;
      color: white;
    }

    .btn-test:hover:not(:disabled) {
      background-color: #138496;
    }

    .alert {
      padding: 1rem;
      border-radius: 6px;
      margin-top: 1rem;
      font-size: 0.875rem;
    }

    .alert-success {
      background-color: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .alert-error {
      background-color: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .alert-info {
      background-color: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }

    @media (max-width: 768px) {
      .smtp-settings-container {
        padding: 1rem;
      }

      .settings-card {
        padding: 1.5rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class SmtpSettingsComponent implements OnInit {
  smtpForm: FormGroup;
  isLoading = false;
  isTesting = false;
  successMessage = '';
  errorMessage = '';
  testMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.smtpForm = this.fb.group({
      smtpHost: ['', [Validators.required]],
      smtpPort: ['', [Validators.required, Validators.min(1), Validators.max(65535)]],
      smtpUsername: ['', [Validators.required]],
      smtpPassword: ['', [Validators.required]],
      mailEncryption: ['', [Validators.required]],
      fromAddress: ['', [Validators.required, Validators.email]],
      fromName: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadSmtpSettings();
  }

  loadSmtpSettings() {
    // Keep fields empty initially as requested
    // Optionally load existing settings in the background for reference
    this.isLoading = false;
  }

  onSave() {
    if (this.smtpForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const formData = this.smtpForm.value;
      
      this.http.post('/api/smtp-settings', formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'SMTP settings saved successfully!';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to save SMTP settings. Please try again.';
          console.error('Error saving SMTP settings:', error);
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.smtpForm.controls).forEach(key => {
        this.smtpForm.get(key)?.markAsTouched();
      });
    }
  }

  onReset() {
    this.smtpForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.testMessage = '';
    
    // Reset to empty values to ensure fields are truly empty
    this.smtpForm.patchValue({
      smtpHost: '',
      smtpPort: '',
      smtpUsername: '',
      smtpPassword: '',
      mailEncryption: '',
      fromAddress: '',
      fromName: ''
    });
  }

  onTestConnection() {
    if (this.smtpForm.valid) {
      this.isTesting = true;
      this.testMessage = '';
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.smtpForm.value;
      
      this.http.post('/api/smtp-settings/test', formData).subscribe({
        next: (response: any) => {
          this.isTesting = false;
          this.testMessage = response.message || 'SMTP connection test successful!';
          setTimeout(() => {
            this.testMessage = '';
          }, 5000);
        },
        error: (error) => {
          this.isTesting = false;
          this.errorMessage = error.error?.error || 'SMTP connection test failed. Please check your settings.';
          console.error('Error testing SMTP connection:', error);
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.smtpForm.controls).forEach(key => {
        this.smtpForm.get(key)?.markAsTouched();
      });
      this.errorMessage = 'Please fill in all required fields before testing the connection.';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }
}