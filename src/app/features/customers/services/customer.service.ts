import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  country?: string;
  photo?: string;
  role: string; // Will be 'customer'
  totalTickets?: number;
  openTickets?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/customers';

  private customersSubject = new BehaviorSubject<Customer[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  customers$ = this.customersSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  getCustomers(page = 1, limit = 10, search = ''): Observable<CustomerResponse> {
    this.loadingSubject.next(true);
    const params = { page: page.toString(), limit: limit.toString(), search };
    
    return this.http.get<CustomerResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Customers loaded:', response);
          this.customersSubject.next(response.customers || []);
          this.loadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Error loading customers:', error);
          this.loadingSubject.next(false);
          this.customersSubject.next([]);
        }
      })
    );
  }

  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer).pipe(
      tap((newCustomer) => {
        // Add the new customer to the current list
        const currentCustomers = this.customersSubject.value;
        this.customersSubject.next([newCustomer, ...currentCustomers]);
      })
    );
  }

  updateCustomer(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/${id}`, customer).pipe(
      tap(() => {
        // Refresh the list after update
        this.refreshCustomers();
      })
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove the deleted customer from the current list
        const currentCustomers = this.customersSubject.value;
        this.customersSubject.next(currentCustomers.filter(c => c.id !== id));
      })
    );
  }

  getCustomerStats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.apiUrl}/stats`);
  }

  private refreshCustomers(): void {
    // Always refresh customers, regardless of current state
    this.getCustomers().subscribe();
  }
}