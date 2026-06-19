import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface Role {
  id: number;
  name: string;
  slug: string;
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRoleRequest {
  name: string;
  slug: string;
  permissions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/roles';

  getRoles(): Observable<Role[]> {
    console.log('🔍 RoleService: Fetching roles...');
    return this.http.get<Role[]>(this.apiUrl).pipe(
      tap(roles => console.log('🔍 RoleService: Fetched roles:', roles)),
      catchError(error => {
        console.error('❌ RoleService: Error fetching roles:', error);
        return throwError(() => error);
      })
    );
  }

  createRole(roleData: CreateRoleRequest): Observable<Role> {
    console.log('🔍 RoleService: Creating role with data:', roleData);
    console.log('🔍 RoleService: API URL:', this.apiUrl);
    return this.http.post<Role>(this.apiUrl, roleData).pipe(
      tap(role => console.log('✅ RoleService: Role created successfully:', role)),
      catchError(error => {
        console.error('❌ RoleService: Error creating role:', error);
        return throwError(() => error);
      })
    );
  }

  updateRole(id: number, roleData: Partial<Role>): Observable<Role> {
    console.log('🔍 RoleService: Updating role', id, 'with data:', roleData);
    const url = `${this.apiUrl}/${id}`;
    console.log('🔍 RoleService: Update URL:', url);
    return this.http.put<Role>(url, roleData).pipe(
      tap(role => console.log('✅ RoleService: Role updated successfully:', role)),
      catchError(error => {
        console.error('❌ RoleService: Error updating role:', error);
        return throwError(() => error);
      })
    );
  }

  deleteRole(id: number): Observable<void> {
    console.log('🔍 RoleService: Deleting role:', id);
    const url = `${this.apiUrl}/${id}`;
    console.log('🔍 RoleService: Delete URL:', url);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log('✅ RoleService: Role deleted successfully')),
      catchError(error => {
        console.error('❌ RoleService: Error deleting role:', error);
        return throwError(() => error);
      })
    );
  }

  getRoleById(id: number): Observable<Role> {
    console.log('🔍 RoleService: Fetching role by ID:', id);
    return this.http.get<Role>(`${this.apiUrl}/${id}`).pipe(
      tap(role => console.log('🔍 RoleService: Fetched role:', role)),
      catchError(error => {
        console.error('❌ RoleService: Error fetching role by ID:', error);
        return throwError(() => error);
      })
    );
  }
}