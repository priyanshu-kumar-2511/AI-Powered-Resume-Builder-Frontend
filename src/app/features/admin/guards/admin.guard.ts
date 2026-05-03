import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Check role from profile signal first, then JWT token
  const user = auth.currentUser();
  if (user?.roles?.some((r: any) => r === 'ROLE_ADMIN' || r === 'ADMIN')) {
    return true;
  }

  // Fallback: decode JWT for role claim
  const token = auth.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload?.roles ?? payload?.role ?? [];
      const rolesArr = Array.isArray(roles) ? roles : [roles];
      if (rolesArr.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN')) {
        return true;
      }
    } catch {}
  }

  router.navigate(['/dashboard']);
  return false;
};
