/**
 * Authentication Service
 * 
 * Handles all user authentication operations including login, logout,
 * password reset, and session management. Uses JWT tokens for secure
 * communication with the backend and provides reactive state management
 * for the entire application.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';
import { User } from '../../models/user.model';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = environment.apiUrl + '/api';

  // Reactive state management for authentication status
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Modern Angular signals for reactive UI updates
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.setCurrentUser(user);
    }
  }

  /**
   * Authenticate user with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.setCurrentUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  /**
   * Register a new user
   */
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, userData).pipe(
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  /**
   * Request a password reset link
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email }).pipe(
      catchError(error => {
        console.error('Forgot password error:', error);
        throw error;
      })
    );
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, { token, newPassword }).pipe(
      catchError(error => {
        console.error('Reset password error:', error);
        throw error;
      })
    );
  }

  /**
   * Logout the current user and clear session
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get current user profile
   */
  getProfile(): Observable<User> {
    // For now, return the stored user since we don't have a profile endpoint
    const user = this.getStoredUser();
    if (user) {
      return of(user);
    }

    // If no stored user, logout
    this.logout();
    throw new Error('No user found');
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  isStaff(): boolean {
    return this.currentUser()?.role === 'staff';
  }

  isCustomer(): boolean {
    return this.currentUser()?.role === 'customer';
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }

  // Check if user can access settings (admin or staff)
  canAccessSettings(): boolean {
    const user = this.currentUser();
    return user?.role === 'admin' || user?.role === 'staff';
  }
}