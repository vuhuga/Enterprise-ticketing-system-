import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  organizationId?: number;
  city?: string;
  country?: string;
  address?: string;
  notes?: string;
  status?: 'Active' | 'Inactive';
  preferredContactMethod?: 'Email' | 'Phone' | 'SMS';
  createdAt?: string;
}

export interface ContactResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactStats {
  total: number;
  active: number;
  inactive: number;
  byDepartment: { department: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/api';

  private contactsSubject = new BehaviorSubject<Contact[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  contacts$ = this.contactsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  getContacts(page = 1, limit = 10, search = ''): Observable<ContactResponse> {
    this.loadingSubject.next(true);
    const params = { page: page.toString(), limit: limit.toString(), search };
    


    return this.http.get<ContactResponse>(this.baseUrl + '/contacts', { params }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Contacts loaded:', response);
          this.contactsSubject.next(response.contacts || []);
          this.loadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Error loading contacts:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          this.loadingSubject.next(false);
          this.contactsSubject.next([]);
        }
      })
    );
  }

  getContactById(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.baseUrl}/contacts/${id}`);
  }

  createContact(contact: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(this.baseUrl + '/contacts', contact).pipe(
      tap((newContact) => {
        // Add the new contact to the current list
        const currentContacts = this.contactsSubject.value;
        this.contactsSubject.next([newContact, ...currentContacts]);
      })
    );
  }

  updateContact(id: number, contact: Partial<Contact>): Observable<Contact> {
    return this.http.patch<Contact>(`${this.baseUrl}/contacts/${id}`, contact).pipe(
      tap(() => {
        this.refreshContacts();
      })
    );
  }

  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/contacts/${id}`).pipe(
      tap(() => {
        // Remove the deleted contact from the current list
        const currentContacts = this.contactsSubject.value;
        this.contactsSubject.next(currentContacts.filter(c => c.id !== id));
      })
    );
  }

  getContactsByDepartment(department: string): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.baseUrl}/contacts/by-department/${department}`);
  }

  getContactStats(): Observable<ContactStats> {
    return this.http.get<ContactStats>(`${this.baseUrl}/contacts/stats`);
  }

  private refreshContacts(): void {
    // Always refresh contacts, regardless of current state
    this.getContacts().subscribe();
  }
}