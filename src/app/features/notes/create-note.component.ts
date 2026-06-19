import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';
import { NoteService } from './services/note.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../core/services/auth.service';

// Using the Note interface from the service

@Component({
  selector: 'app-create-note',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './create-note.component.html',
  styleUrls: ['./create-note.component.scss']
})
export class CreateNoteComponent implements OnInit {
  noteForm!: FormGroup;
  isSubmitting = false;

  // Lucide icons
  readonly Home = Home;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private noteService = inject(NoteService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.noteForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required]],
      category: ['general']
    });
  }

  onSubmit(): void {
    if (this.noteForm.valid) {
      this.isSubmitting = true;
      const formData = this.noteForm.value;
      const user = this.authService.currentUser();

      // Add user_id to the note data
      if (user?.id) {
        formData.user_id = user.id;
      }

      this.noteService.createNote(formData).subscribe({
        next: (note) => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Success', `Note "${note.title}" created`);
          this.router.navigate(['/notes']);
        },
        error: () => {
          this.isSubmitting = false;
          this.toastService.showError('Error', 'Failed to create note');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.noteForm.controls).forEach(key => {
      this.noteForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.noteForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.noteForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  goBack(): void {
    this.router.navigate(['/notes']);
  }
}
