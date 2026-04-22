import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * AdminGuard ensures that only users with the ROLE_ADMIN claim in their JWT 
 * can access administrative routes like /admin.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  // Unauthorized access attempt — redirect to dashboard
  console.warn('Access Denied: Admin role required.');
  router.navigate(['/dashboard']);
  return false;
};
