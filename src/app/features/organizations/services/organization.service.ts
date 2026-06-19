import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';

// Organization data interface
export interface Organization {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// API response interface for paginated results
export interface OrganizationResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Organization service - manages organization CRUD operations
@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/organizations';

  // Reactive state management
  private organizationsSubject = new BehaviorSubject<Organization[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables for components
  organizations$ = this.organizationsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  // Get paginated organizations with search
  getOrganizations(page = 1, limit = 10, search = ''): Observable<OrganizationResponse> {
    this.loadingSubject.next(true);
    const params = { page: page.toString(), limit: limit.toString(), search };

    return this.http.get<OrganizationResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Organizations loaded:', response);
          this.organizationsSubject.next(response.organizations || []);
          this.loadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Error loading organizations:', error);
          this.loadingSubject.next(false);
          this.organizationsSubject.next([]);
        }
      })
    );
  }

  // Get single organization by ID
  getOrganizationById(id: number): Observable<Organization> {
    return this.http.get<Organization>(`${this.apiUrl}/${id}`);
  }

  // Create new organization
  createOrganization(organization: Partial<Organization>): Observable<Organization> {
    return this.http.post<Organization>(this.apiUrl, organization).pipe(
      tap((newOrganization) => {
        // Add the new organization to the current list
        const currentOrganizations = this.organizationsSubject.value;
        this.organizationsSubject.next([newOrganization, ...currentOrganizations]);
      })
    );
  }

  // Update existing organization
  updateOrganization(id: number, organization: Partial<Organization>): Observable<Organization> {
    return this.http.patch<Organization>(`${this.apiUrl}/${id}`, organization).pipe(
      tap(() => {
        this.refreshOrganizations();
      })
    );
  }

  // Delete organization by ID
  deleteOrganization(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove the deleted organization from the current list
        const currentOrganizations = this.organizationsSubject.value;
        this.organizationsSubject.next(currentOrganizations.filter(o => o.id !== id));
      })
    );
  }

  // Refresh organizations list
  private refreshOrganizations(): void {
    // Always refresh organizations, regardless of current state
    this.getOrganizations().subscribe();
  }
}