import { HttpInterceptorFn } from '@angular/common/http';

/**
 * JWT Interceptor (Functional)
 * 
 * This interceptor automatically attaches the stored Bearer token to every 
 * outgoing HTTP request. This is crucial for microservices architecture 
 * where the API Gateway and downstream services require a valid JWT 
 * for authorization.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrieve the current token from browser localStorage
  const token = localStorage.getItem('auth_token');

  // If a token exists, clone the request and inject the Authorization header
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // Otherwise, pass the request through untouched
  return next(req);
};
