import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Priority {
  id: number;
  value: string; // e.g., 'low', 'medium', 'high', 'urgent'
  label: string; // e.g., 'Low Priority', 'Medium Priority'
  color?: string; // Hex color for UI display
  sortOrder: number; // Order for display (1 = lowest, 4 = highest)
  isActive: boolean;
  assignmentSlaMinutes?: number; // SLA for assignment (in minutes)
  resolutionSlaMinutes?: number; // SLA for resolution (in minutes)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePriorityRequest {
  value: string;
  label: string;
  color?: string;
  sortOrder: number;
  isActive?: boolean;
  assignmentSlaMinutes?: number;
  resolutionSlaMinutes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PriorityService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl + '/api/priorities';

  getPriorities(): Observable<Priority[]> {
    return this.http.get<Priority[]>(this.apiUrl);
  }

  createPriority(priorityData: CreatePriorityRequest): Observable<Priority> {
    return this.http.post<Priority>(this.apiUrl, priorityData);
  }

  updatePriority(id: number, priorityData: Partial<Priority>): Observable<Priority> {
    return this.http.put<Priority>(`${this.apiUrl}/${id}`, priorityData);
  }

  deletePriority(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPriorityById(id: number): Observable<Priority> {
    return this.http.get<Priority>(`${this.apiUrl}/${id}`);
  }
}