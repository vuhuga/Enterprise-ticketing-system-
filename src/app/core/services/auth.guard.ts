import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private router = inject(Router);


  canActivate(): boolean {
    // Dev mode: allow access to all routes
    const isDevMode = true;

    if (isDevMode) {
      console.log('AuthGuard: Dev mode active, allowing access');
      return true;
    }

    // Production logic: check for auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('AuthGuard: Authenticated');
      return true;
    } else {
      console.warn('AuthGuard: Not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}
