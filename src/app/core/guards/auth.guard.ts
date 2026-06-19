/**
 * Route Guards for Access Control
 * 
 * Implements security guards to protect routes based on authentication
 * status and user roles. These guards ensure proper access control
 * throughout the application and handle unauthorized access attempts.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Basic authentication guard - protects routes requiring login
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Save the attempted URL for redirecting after login
  const returnUrl = state.url;
  // Redirect to login page with return URL
  router.navigate(['/auth/login'], { queryParams: { returnUrl } });
  return false;
};

/**
 * Admin-level access guard - restricts access to admin-only features
 */
export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  if (!authService.isAuthenticated()) {
    const returnUrl = state.url;
    router.navigate(['/auth/login'], { queryParams: { returnUrl } });
  } else {
    // User is logged in but lacks admin privileges
    router.navigate(['/dashboard']);
  }
  return false;
};