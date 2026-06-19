import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TicketNote {
  id: number;
  ticket_id: number;
  note: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  user_id: number;
  author_id: number; // For compatibility
  author_name: string;
  author_role: string;
}

export interface CreateNoteRequest {
  note: string;
  is_internal?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TicketNotesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets`;

  getNotes(ticketId: string): Observable<TicketNote[]> {
    return this.http.get<TicketNote[]>(`${this.apiUrl}/${ticketId}/notes`);
  }

  addNote(ticketId: string, request: CreateNoteRequest): Observable<TicketNote> {
    return this.http.post<TicketNote>(`${this.apiUrl}/${ticketId}/notes`, request);
  }

  deleteNote(ticketId: string, noteId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${ticketId}/notes/${noteId}`);
  }
}
