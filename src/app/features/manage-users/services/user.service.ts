import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  departmentId?: number;
  departmentName?: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  photo?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/users';

  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  users$ = this.usersSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  getUsers(page = 1, limit = 10, search = ''): Observable<UserResponse> {
    this.loadingSubject.next(true);
    const params = { page: page.toString(), limit: limit.toString(), search };

    return this.http.get<UserResponse>(this.apiUrl, { params }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Users loaded:', response);
          this.usersSubject.next(response.users || []);
          this.loadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Error loading users:', error);
          this.loadingSubject.next(false);
          this.usersSubject.next([]);
        }
      })
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: Partial<User> & { password: string }): Observable<User> {
    console.log('🚀 Creating user:', user);
    return this.http.post<User>(this.apiUrl, user).pipe(
      tap((newUser) => {
        console.log('✅ User created successfully:', newUser);
        // Add the new user to the current list
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([newUser, ...currentUsers]);
      }),
      tap({
        error: (error) => {
          console.error('❌ Error in createUser service:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);
        }
      })
    );
  }

  updateUser(id: number, user: Partial<User>): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/${id}`, user).pipe(
      tap(() => {
        this.refreshUsers();
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove the deleted user from the current list
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next(currentUsers.filter(u => u.id !== id));
      })
    );
  }

  private refreshUsers(): void {
    // Always refresh users, regardless of current state
    this.getUsers().subscribe();
  }
}