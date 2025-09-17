import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { API_CONFIG } from '../utils/constants';

export const externalApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const notificationService = inject(NotificationService);

  // Only process requests that are NOT to our internal API
  if (req.url.includes(API_CONFIG.BASE_URL) || req.url.startsWith('/')) {
    // Skip this interceptor for internal API calls and relative URLs
    return next(req);
  }

  // Clone the request and add headers for external APIs
  let externalReq = req.clone({
    headers: addExternalApiHeaders(req.headers)
  });

  // Add timeout for external API calls (30 seconds)
  return next(externalReq).pipe(
    timeout(30000),
    retry({
      count: 2,
      delay: (error) => {
        // Only retry on network errors or 5xx server errors
        if (error instanceof HttpErrorResponse) {
          if (error.status >= 500 || error.status === 0) {
            console.warn(`Retrying external API request to ${req.url} due to error:`, error.status);
            return Promise.resolve(); // Immediate retry
          }
        }
        throw error; // Don't retry for client errors (4xx)
      }
    }),
    catchError((error: HttpErrorResponse) => {
      return handleExternalApiError(error, req.url, notificationService);
    })
  );
};

/**
 * Add common headers for external API requests
 */
function addExternalApiHeaders(existingHeaders: HttpHeaders): HttpHeaders {
  let headers = existingHeaders;

  // Add User-Agent if not already present
  if (!headers.has('User-Agent')) {
    headers = headers.set('User-Agent', 'Balancio-App/1.0');
  }

  // Add Accept header if not already present
  if (!headers.has('Accept')) {
    headers = headers.set('Accept', 'application/json, text/plain, */*');
  }

  // Add Cache-Control for external APIs
  if (!headers.has('Cache-Control')) {
    headers = headers.set('Cache-Control', 'no-cache');
  }

  // Add CORS headers for external APIs
  if (!headers.has('Access-Control-Request-Method')) {
    headers = headers.set('Access-Control-Request-Headers', 'Content-Type, Authorization');
  }

  return headers;
}

/**
 * Handle errors from external API calls
 */
function handleExternalApiError(
  error: HttpErrorResponse, 
  url: string, 
  notificationService: NotificationService
): Observable<never> {
  
  const apiName = getApiNameFromUrl(url);
  
  if (error.status === 0) {
    // Network error or CORS issue
    console.error(`Network error when calling ${apiName}:`, error);
    notificationService.addNotification({
      title: 'Network Error',
      message: `Unable to connect to ${apiName}. Please check your internet connection.`,
      type: 'error'
    });
  } else if (error.status === 429) {
    // Rate limiting
    console.warn(`Rate limit exceeded for ${apiName}:`, error);
    notificationService.addNotification({
      title: 'Rate Limit Exceeded',
      message: `Too many requests to ${apiName}. Please try again later.`,
      type: 'warning'
    });
  } else if (error.status >= 400 && error.status < 500) {
    // Client errors
    console.warn(`Client error when calling ${apiName}:`, error.status, error.message);
    notificationService.addNotification({
      title: 'External API Error',
      message: `Error accessing ${apiName}: ${error.status} ${error.statusText}`,
      type: 'error'
    });
  } else if (error.status >= 500) {
    // Server errors
    console.error(`Server error when calling ${apiName}:`, error);
    notificationService.addNotification({
      title: 'External Service Unavailable',
      message: `${apiName} is currently unavailable. Please try again later.`,
      type: 'error'
    });
  } else {
    // Unknown error
    console.error(`Unknown error when calling ${apiName}:`, error);
    notificationService.addNotification({
      title: 'External API Error',
      message: `An unexpected error occurred while accessing ${apiName}.`,
      type: 'error'
    });
  }

  return throwError(() => error);
}

/**
 * Extract a friendly API name from the URL for error messages
 */
function getApiNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Extract service name from common patterns
    if (hostname.includes('api.')) {
      return hostname.replace('api.', '').split('.')[0];
    } else if (hostname.includes('www.')) {
      return hostname.replace('www.', '').split('.')[0];
    } else {
      return hostname.split('.')[0];
    }
  } catch {
    return 'External Service';
  }
}