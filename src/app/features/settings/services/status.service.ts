import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TicketStatus {
  id: number;
  value: string; // e.g., 'new', 'open', 'in_progress', 'resolved', 'closed'
  label: string; // e.g., 'New', 'In Progress', 'Resolved'
  color?: string; // Hex color for UI display
  sortOrder: number; // Order for workflow progression
  isActive: boolean;
  isFinal: boolean; // True for statuses like 'closed', 'resolved'
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateStatusRequest {
  value: string;
  label: string;
  color?: string;
  sortOrder: number;
  isActive?: boolean;
  isFinal?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl + '/api/statuses';

  getStatuses(): Observable<TicketStatus[]> {
    return this.http.get<TicketStatus[]>(this.apiUrl);
  }

  createStatus(statusData: CreateStatusRequest): Observable<TicketStatus> {
    return this.http.post<TicketStatus>(this.apiUrl, statusData);
  }

  updateStatus(id: number, statusData: Partial<TicketStatus>): Observable<TicketStatus> {
    return this.http.put<TicketStatus>(`${this.apiUrl}/${id}`, statusData);
  }

  deleteStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStatusById(id: number): Observable<TicketStatus> {
    return this.http.get<TicketStatus>(`${this.apiUrl}/${id}`);
  }
}