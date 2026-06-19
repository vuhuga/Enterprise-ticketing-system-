import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roleId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignRoleRequest {
  userId: number;
  roleId: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?simple=true`);
  }

  assignRole(assignRoleData: AssignRoleRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/assign-role`, assignRoleData);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUserStatus(id: number, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/status`, { isActive });
  }
}