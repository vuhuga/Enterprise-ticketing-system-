import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';

export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  user_id: number;
  author_name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/notes';

  private notesSubject = new BehaviorSubject<Note[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  notes$ = this.notesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  getNotes(page = 1, limit = 10, search = ''): Observable<NoteResponse> {
    this.loadingSubject.next(true);
    const params = { page: page.toString(), limit: limit.toString(), search };
    
    return this.http.get<NoteResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Notes loaded:', response);
          this.notesSubject.next(response.notes || []);
          this.loadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Error loading notes:', error);
          this.loadingSubject.next(false);
          this.notesSubject.next([]);
        }
      })
    );
  }

  getNoteById(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.apiUrl}/${id}`);
  }

  createNote(note: Partial<Note>): Observable<Note> {
    return this.http.post<Note>(this.apiUrl, note).pipe(
      tap((newNote) => {
        // Add the new note to the current list
        const currentNotes = this.notesSubject.value;
        this.notesSubject.next([newNote, ...currentNotes]);
      })
    );
  }

  updateNote(id: number, note: Partial<Note>): Observable<Note> {
    return this.http.patch<Note>(`${this.apiUrl}/${id}`, note).pipe(
      tap(() => {
        this.refreshNotes();
      })
    );
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove the deleted note from the current list
        const currentNotes = this.notesSubject.value;
        this.notesSubject.next(currentNotes.filter(n => n.id !== id));
      })
    );
  }

  private refreshNotes(): void {
    // Always refresh notes, regardless of current state
    this.getNotes().subscribe();
  }
}