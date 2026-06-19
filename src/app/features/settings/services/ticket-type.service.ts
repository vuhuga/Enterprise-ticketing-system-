import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface TicketType {
  id: number;
  name: string;
  description?: string;
  category?: string;
  priorityLevel?: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTicketTypeRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TicketTypeService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl + '/api/ticket-types';

  getTicketTypes(): Observable<TicketType[]> {
    console.log('🔍 TicketTypeService: Making API call to:', this.apiUrl);
    return this.http.get<TicketType[]>(this.apiUrl).pipe(
      tap((response: TicketType[]) => console.log('🔍 TicketTypeService: API Response:', response)),
      catchError((error: unknown) => {
        console.error('🔍 TicketTypeService: API Error:', error);
        return throwError(error);
      })
    );
  }

  createTicketType(ticketTypeData: CreateTicketTypeRequest): Observable<TicketType> {
    return this.http.post<TicketType>(this.apiUrl, ticketTypeData);
  }

  updateTicketType(id: number, ticketTypeData: Partial<TicketType>): Observable<TicketType> {
    return this.http.put<TicketType>(`${this.apiUrl}/${id}`, ticketTypeData);
  }

  deleteTicketType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTicketTypeById(id: number): Observable<TicketType> {
    return this.http.get<TicketType>(`${this.apiUrl}/${id}`);
  }
}