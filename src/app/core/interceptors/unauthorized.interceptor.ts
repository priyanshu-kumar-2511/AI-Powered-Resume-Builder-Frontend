import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Globally catches 401 Unauthorized responses from any API call.
 * Clears the stored token and redirects to /login so the user can re-authenticate.
 * This is the correct place to handle expired / revoked tokens — not in the route guard.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.removeToken();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, reason: 'session-expired' }
        });
      }
      return throwError(() => err);
    })
  );
};
