import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  employeeCount?: number;
  ticketCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  managerId?: string;
  status?: 'active' | 'inactive';
}

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  totalEmployees: number;
  totalTickets: number;
}

export interface DepartmentListResponse {
  departments: Department[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/api/departments';

  private departmentsSubject = new BehaviorSubject<Department[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  departments$ = this.departmentsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  selectedDepartment = signal<Department | null>(null);
  totalCount = signal<number>(0);

  getDepartments(page = 1, limit = 10, search?: string): Observable<DepartmentListResponse> {
    this.loadingSubject.next(true);
    const params: Record<string, string> = { page: page.toString(), limit: limit.toString() };
    if (search) params['search'] = search;

    return this.http.get<DepartmentListResponse>(`${this.baseUrl}`, { params }).pipe(
      tap(response => {
        this.departmentsSubject.next(response.departments);
        this.totalCount.set(response.total);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error fetching departments:', error);
        return of({ departments: [], total: 0, page: 1, limit: 10 });
      })
    );
  }

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/all`).pipe(
      catchError(error => {
        console.error('Error fetching all departments:', error);
        return of([]);
      })
    );
  }

  getDepartmentById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.baseUrl}/${id}`).pipe(
      tap(department => this.selectedDepartment.set(department)),
      catchError(error => {
        console.error('Error fetching department:', error);
        throw error;
      })
    );
  }

  createDepartment(departmentData: CreateDepartmentRequest): Observable<Department> {
    this.loadingSubject.next(true);
    return this.http.post<Department>(`${this.baseUrl}`, departmentData).pipe(
      tap(newDepartment => {
        const currentDepartments = this.departmentsSubject.value;
        this.departmentsSubject.next([newDepartment, ...currentDepartments]);
        this.totalCount.update(count => count + 1);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error creating department:', error);
        throw error;
      })
    );
  }

  updateDepartment(id: string, updates: Partial<Department>): Observable<Department> {
    this.loadingSubject.next(true);
    return this.http.patch<Department>(`${this.baseUrl}/${id}`, updates).pipe(
      tap(updatedDepartment => {
        const currentDepartments = this.departmentsSubject.value;
        const updatedDepartments = currentDepartments.map(department =>
          department.id === id ? updatedDepartment : department
        );
        this.departmentsSubject.next(updatedDepartments);
        if (this.selectedDepartment()?.id === id) {
          this.selectedDepartment.set(updatedDepartment);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error updating department:', error);
        throw error;
      })
    );
  }

  deleteDepartment(id: string): Observable<void> {
    this.loadingSubject.next(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const currentDepartments = this.departmentsSubject.value;
        const filteredDepartments = currentDepartments.filter(department => department.id !== id);
        this.departmentsSubject.next(filteredDepartments);
        this.totalCount.update(count => count - 1);
        if (this.selectedDepartment()?.id === id) {
          this.selectedDepartment.set(null);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error deleting department:', error);
        throw error;
      })
    );
  }

  searchDepartments(query: string): Observable<Department[]> {
    return this.getDepartments(1, 50, query).pipe(map(response => response.departments));
  }

  getDepartmentStats(): Observable<DepartmentStats> {
    return this.http.get<DepartmentStats>(`${this.baseUrl}/stats`).pipe(
      catchError(error => {
        console.error('Error fetching department stats:', error);
        return of({
          total: 0,
          active: 0,
          inactive: 0,
          totalEmployees: 0,
          totalTickets: 0
        });
      })
    );
  }

  clearState(): void {
    this.departmentsSubject.next([]);
    this.selectedDepartment.set(null);
    this.totalCount.set(0);
    this.loadingSubject.next(false);
  }
}