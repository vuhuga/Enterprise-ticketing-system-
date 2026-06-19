import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Global HTTP error handling interceptor
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', {
        url: error.url,
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });

      return throwError(() => error);
    })
  );
};
