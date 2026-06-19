import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  // Only allow customers to access customer-specific routes
  if (user && user.role === 'customer') {
    return true;
  }

  // Redirect non-customers to dashboard
  router.navigate(['/dashboard']);
  return false;
};