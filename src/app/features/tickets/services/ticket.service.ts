import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.prod';
import { Ticket, CreateTicketRequest, TicketListResponse } from '../../../models/ticket.model';
import { TicketImportExportService, ExportOptions, ImportResult, ImportOptions } from './ticket-import-export.service';

export type { Ticket, CreateTicketRequest, TicketListResponse } from '../../../models/ticket.model';

export interface TicketFilter {
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  department?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  created_by?: number;
}

export interface TicketStats {
  total: number;
  pending: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface TicketsByDepartment {
  department: string;
  // Backend returns total_tickets for department aggregation
  total_tickets: number;
}

export interface TicketsByType {
  type: string;
  count: number;
}

export interface TopCreator {
  creator: string;
  tickets_created: number;
}

export interface CRMStats {
  active_customers: number;
  total_contacts: number;
  total_organizations: number;
  total_users: number;
  total_departments: number;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private importExportService = inject(TicketImportExportService);
  private readonly baseUrl = environment.apiUrl + '/api';
  private readonly dashboardUrl = environment.apiUrl + '/api/dashboard';

  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  tickets$ = this.ticketsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  selectedTicket = signal<Ticket | null>(null);
  totalCount = signal<number>(0);

  getTickets(filter: TicketFilter = {}): Observable<TicketListResponse> {
    this.loadingSubject.next(true);
    const params = this.buildQueryParams(filter);
    


    return this.http.get<TicketListResponse>(this.baseUrl + '/tickets', { params }).pipe(
      tap(response => {
        this.ticketsSubject.next(response.tickets);
        this.totalCount.set(response.total);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error fetching tickets:', error);
        throw error;
      })
    );
  }



  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/tickets/${id}`).pipe(
      tap(ticket => this.selectedTicket.set(ticket))
    );
  }

  createTicket(ticketData: CreateTicketRequest): Observable<Ticket> {
    this.loadingSubject.next(true);
    return this.http.post<Ticket>(this.baseUrl + '/tickets', ticketData).pipe(
      tap(newTicket => {
        const currentTickets = this.ticketsSubject.value;
        this.ticketsSubject.next([newTicket, ...currentTickets]);
        this.totalCount.update(count => count + 1);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error creating ticket:', error);
        throw error;
      })
    );
  }





  updateTicket(id: string, updates: Partial<Ticket>): Observable<Ticket> {
    this.loadingSubject.next(true);
    return this.http.put<Ticket>(`${this.baseUrl}/tickets/${id}`, updates).pipe(
      tap(updatedTicket => {
        const currentTickets = this.ticketsSubject.value;
        const updatedTickets = currentTickets.map(ticket =>
          ticket.id === id ? updatedTicket : ticket
        );
        this.ticketsSubject.next(updatedTickets);
        if (this.selectedTicket()?.id === id) {
          this.selectedTicket.set(updatedTicket);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  deleteTicket(id: string): Observable<void> {
    this.loadingSubject.next(true);
    return this.http.delete<void>(`${this.baseUrl}/tickets/${id}`).pipe(
      tap(() => {
        const currentTickets = this.ticketsSubject.value;
        const filteredTickets = currentTickets.filter(ticket => ticket.id !== id);
        this.ticketsSubject.next(filteredTickets);
        this.totalCount.update(count => count - 1);
        if (this.selectedTicket()?.id === id) {
          this.selectedTicket.set(null);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  assignTicket(ticketId: string, userId: string): Observable<Ticket> {
    return this.updateTicket(ticketId, { assignedTo: userId });
  }

  changeTicketStatus(ticketId: string, status: Ticket['status']): Observable<Ticket> {
    const updates: Partial<Ticket> = { status };
    if (status === 'resolved') {
      updates.resolvedAt = new Date();
    }
    return this.updateTicket(ticketId, updates);
  }

  getTicketsByStatus(status: Ticket['status']): Observable<Ticket[]> {
    return this.getTickets({ status }).pipe(map(response => response.tickets));
  }

  getAssignedTickets(userId: string): Observable<Ticket[]> {
    return this.getTickets({ assignedTo: userId }).pipe(map(response => response.tickets));
  }

  searchTickets(query: string): Observable<Ticket[]> {
    return this.getTickets({ search: query }).pipe(map(response => response.tickets));
  }

  clearState(): void {
    this.ticketsSubject.next([]);
    this.selectedTicket.set(null);
    this.totalCount.set(0);
    this.loadingSubject.next(false);
  }

  private buildQueryParams(filter: TicketFilter): Record<string, string> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });
    return params;
  }

  getTicketStats(): Observable<TicketStats> {
    return this.http.get<TicketStats>(`${this.baseUrl}/tickets/stats`).pipe(
      catchError(error => {
        console.error('Error fetching ticket stats:', error);
        return of({
          total: 0,
          pending: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0
        });
      })
    );
  }

  // 🆕 Dashboard Metrics Endpoints

  getTicketsByDepartment(): Observable<TicketsByDepartment[]> {
    return this.http.get<TicketsByDepartment[]>(`${this.dashboardUrl}/tickets-by-department`).pipe(
      catchError(error => {
        console.error('Error fetching tickets by department:', error);
        return of([]);
      })
    );
  }

  getTicketsByType(): Observable<TicketsByType[]> {
    return this.http.get<TicketsByType[]>(`${this.dashboardUrl}/tickets-by-type`).pipe(
      catchError(error => {
        console.error('Error fetching tickets by type:', error);
        return of([]);
      })
    );
  }

  getTopCreators(): Observable<TopCreator[]> {
    return this.http.get<TopCreator[]>(`${this.dashboardUrl}/top-creators`).pipe(
      catchError(error => {
        console.error('Error fetching top creators:', error);
        return of([]);
      })
    );
  }

  getCRMStats(): Observable<CRMStats> {
    return this.http.get<CRMStats>(`${this.dashboardUrl}/crm-stats`).pipe(
      catchError(error => {
        console.error('Error fetching CRM stats:', error);
        return of({
          active_customers: 0,
          total_contacts: 0,
          total_organizations: 0,
          total_users: 0,
          total_departments: 0
        });
      })
    );
  }

  getStaffMembers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/staff`).pipe(
      catchError(error => {
        console.error('Error fetching staff members:', error);
        return of([]);
      })
    );
  }

  getTicketHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.dashboardUrl}/ticket-history`).pipe(
      catchError(error => {
        console.error('Error fetching ticket history:', error);
        return of([]);
      })
    );
  }

  // 🆕 Import/Export Methods

  /**
   * Export tickets with specified options
   */
  exportTickets(options: ExportOptions): Observable<Blob> {
    const params = new HttpParams()
      .set('format', options.format)
      .set('fields', options.includeFields.join(','))
      .set('includeFilters', 'true');

    // Add date range if specified
    if (options.dateRange) {
      params.set('startDate', options.dateRange.start.toISOString());
      params.set('endDate', options.dateRange.end.toISOString());
    }

    // Add filters if specified
    if (options.filters) {
      if (options.filters.status) {
        params.set('status', options.filters.status.join(','));
      }
      if (options.filters.priority) {
        params.set('priority', options.filters.priority.join(','));
      }
      if (options.filters.department) {
        params.set('department', options.filters.department.join(','));
      }
      if (options.filters.type) {
        params.set('type', options.filters.type.join(','));
      }
    }

    return this.http.get(`${this.baseUrl}/tickets/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting tickets:', error);
        throw error;
      })
    );
  }

  /**
   * Import tickets from file
   */
  importTickets(file: File, options: ImportOptions): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    return this.http.post<ImportResult>(`${this.baseUrl}/tickets/import`, formData).pipe(
      catchError(error => {
        console.error('Error importing tickets:', error);
        throw error;
      })
    );
  }

  /**
   * Get all tickets for export (bypasses pagination)
   */
  getAllTicketsForExport(filter: TicketFilter = {}): Observable<Ticket[]> {
    const params = this.buildQueryParams({
      ...filter,
      limit: 10000, // Large limit to get all tickets
      page: 1
    });

    return this.http.get<TicketListResponse>(this.baseUrl + '/tickets', { params }).pipe(
      map(response => response.tickets),
      catchError(error => {
        console.error('Error fetching all tickets for export:', error);
        return of([]);
      })
    );
  }

  /**
   * Bulk create tickets (for import)
   */
  bulkCreateTickets(tickets: Partial<Ticket>[]): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.baseUrl}/tickets/bulk`, { tickets }).pipe(
      catchError(error => {
        console.error('Error bulk creating tickets:', error);
        throw error;
      })
    );
  }

  /**
   * Download exported file
   */
  downloadExportedFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get export template
   */
  getExportTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/tickets/export-template`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error getting export template:', error);
        throw error;
      })
    );
  }
}
