// Application configuration for Angular providers and services
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Global error handling for unhandled exceptions
    provideBrowserGlobalErrorListeners(),

    // Optimized change detection for better performance
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Application routing with lazy-loaded modules
    provideRouter(routes),

    // HTTP client with custom interceptors for auth and error handling
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor]))
  ]
};