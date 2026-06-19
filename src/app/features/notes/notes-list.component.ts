import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, FileText, Plus, Search, Edit, Trash2, Home } from 'lucide-angular';
import { NoteService, Note } from './services/note.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss']
})
export class NotesListComponent implements OnInit {
  private noteService = inject(NoteService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);

  notes: Note[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 12; // Grid layout works better with 12

  // Lucide icons
  readonly FileText = FileText;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Home = Home;

  ngOnInit() {
    this.loadNotes();
    
    // Subscribe to real-time updates
    this.noteService.notes$.subscribe(notes => {
      const user = this.authService.currentUser();
      // For customers, only show their own notes
      if (this.authService.isCustomer()) {
        this.notes = notes.filter(note => note.user_id === user?.id);
      } else {
        this.notes = notes;
      }
    });

    this.noteService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  loadNotes() {
    this.noteService.getNotes(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.totalCount = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);
        // The notes are automatically updated via the service's observable
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load notes');
        console.error('Error loading notes:', error);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadNotes();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadNotes();
  }

  onEdit(note: Note) {
    const user = this.authService.currentUser();
    
    // Customers can only edit their own notes
    if (this.authService.isCustomer() && note.user_id !== user?.id) {
      this.toastService.showError('Error', 'You can only edit your own notes');
      return;
    }

    this.router.navigate(['/notes/edit', note.id]);
  }

  onDelete(note: Note) {
    const user = this.authService.currentUser();
    
    // Customers can only delete their own notes
    if (this.authService.isCustomer() && note.user_id !== user?.id) {
      this.toastService.showError('Error', 'You can only delete your own notes');
      return;
    }

    this.confirmationService.confirm({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.noteService.deleteNote(note.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Success', 'Note deleted successfully');
          },
          error: (error) => {
            this.toastService.showError('Error', 'Failed to delete note');
            console.error('Error deleting note:', error);
          }
        });
      }
    });
  }

  onCreateNote() {
    this.router.navigate(['/notes/create']);
  }

  // Make Math available in template
  Math = Math;
}