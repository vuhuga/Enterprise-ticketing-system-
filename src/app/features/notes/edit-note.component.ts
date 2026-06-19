import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NoteService } from './services/note.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-edit-note',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="edit-note-container">
      <div class="page-header">
        <h1>Edit Note</h1>
        <p>Update note information</p>
      </div>

      @if (loading) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Loading note...</p>
        </div>
      }

      @if (!loading) {
        <div class="form-container">
          <form [formGroup]="noteForm" (ngSubmit)="onSubmit()" class="note-form">
            <div class="form-grid">
              <!-- Row 1: Title (span 2), Category -->
              <div class="form-group span-2">
                <label for="title">Title *</label>
                <input type="text" id="title" formControlName="title" class="form-control" [class.is-invalid]="isFieldInvalid('title')" placeholder="Note title" />
                @if (isFieldInvalid('title')) {
                  <div class="invalid-feedback">{{ getFieldError('title') }}</div>
                }
              </div>

              <div class="form-group">
                <label for="category">Category</label>
                <select id="category" formControlName="category" class="form-control">
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Task">Task</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Important">Important</option>
                </select>
              </div>

              <!-- Row 2: Content (full width horizontal) -->
              <div class="form-group span-3">
                <label for="content">Content *</label>
                <textarea id="content" formControlName="content" class="form-control" [class.is-invalid]="isFieldInvalid('content')" placeholder="Note content"></textarea>
                @if (isFieldInvalid('content')) {
                  <div class="invalid-feedback">{{ getFieldError('content') }}</div>
                }
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-danger" (click)="onDelete()" [disabled]="isSubmitting">
                Delete
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="isSubmitting || noteForm.invalid">
                @if (isSubmitting) {
                  <span class="spinner-sm"></span>
                  Updating...
                } @else {
                  Update
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .edit-note-container {
      padding: 24px;
      max-width: 100%;
      margin: 0 auto;
      height: calc(100vh - 70px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      margin-bottom: 20px;
      flex-shrink: 0;
    }

    .page-header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 4px 0;
    }

    .page-header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .form-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    .note-form {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px 16px;
      flex: 1;
      align-content: start;
      overflow: hidden;
    }

    .form-group {
      margin-bottom: 0;
    }

    .form-group.span-2 {
      grid-column: span 2;
    }

    .form-group.span-3 {
      grid-column: span 3;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
      font-size: 13px;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    textarea.form-control {
      resize: none;
      height: 150px;
      font-family: inherit;
    }

    .invalid-feedback {
      display: block;
      color: #dc3545;
      font-size: 11px;
      margin-top: 3px;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid #e1e5e9;
      flex-shrink: 0;
      overflow: hidden;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 1024px) {
      .form-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .form-group.span-2, .form-group.span-3 {
        grid-column: span 2;
      }
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .form-group.span-2, .form-group.span-3 {
        grid-column: span 1;
      }
    }
  `]
})
export class EditNoteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private noteService = inject(NoteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  noteForm!: FormGroup;
  isSubmitting = false;
  loading = true;
  noteId!: number;

  ngOnInit() {
    this.initForm();
    this.noteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadNote();
  }

  initForm() {
    this.noteForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      category: [''],
      priority: ['Medium', Validators.required]
    });
  }

  loadNote() {
    this.noteService.getNoteById(this.noteId).subscribe({
      next: (note) => {
        this.noteForm.patchValue(note);
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load note');
        console.error('Error loading note:', error);
        this.router.navigate(['/notes']);
      }
    });
  }

  onSubmit() {
    if (this.noteForm.valid) {
      this.isSubmitting = true;
      const noteData = this.noteForm.value;
      
      this.noteService.updateNote(this.noteId, noteData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', 'Note updated successfully');
          this.router.navigate(['/notes']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.showError('Error', 'Failed to update note: ' + (error.error?.message || error.message));
          console.error('Error updating note:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/notes']);
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this note?')) {
      this.noteService.deleteNote(this.noteId).subscribe({
        next: () => {
          this.toastService.showSuccess('Success', 'Note deleted successfully');
          this.router.navigate(['/notes']);
        },
        error: (error) => {
          this.toastService.showError('Error', 'Failed to delete note');
          console.error('Error deleting note:', error);
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.noteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.noteForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private markFormGroupTouched() {
    Object.keys(this.noteForm.controls).forEach(key => {
      const control = this.noteForm.get(key);
      control?.markAsTouched();
    });
  }
}