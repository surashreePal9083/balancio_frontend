import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastNotificationService } from '../services/toast-notification.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const toastService = inject(ToastNotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different types of HTTP errors
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        handleErrorClientSide(error, toastService);
      } else {
        // Server-side error
        handleErrorServerSide(error, toastService, router);
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Handle client-side errors (network issues, etc.)
 */
function handleErrorClientSide(
  error: HttpErrorResponse, 
  toastService: ToastNotificationService
): void {
  console.error('Client-side error:', error);
  
  toastService.error(
    'Network Error',
    'Please check your internet connection and try again.',
    { duration: 6000 }
  );
}

/**
 * Handle server-side errors
 */
function handleErrorServerSide(
  error: HttpErrorResponse, 
  toastService: ToastNotificationService,
  router: Router
): void {
  console.error('Server-side error:', error);
  
  // Extract error details from response
  const errorDetails = extractErrorDetails(error);
  
  // Handle specific HTTP status codes
  switch (error.status) {
    case 400:
      // Bad Request
      toastService.error(
        errorDetails.title,
        errorDetails.message,
        { duration: 6000 }
      );
      break;
      
    case 401:
      // Unauthorized
      toastService.error(
        'Authentication Required',
        'Please log in to continue.',
        { duration: 6000 }
      );
      // Redirect to login page
      router.navigate(['/auth/login']);
      break;
      
    case 403:
      // Forbidden
      toastService.error(
        'Access Denied',
        'You do not have permission to perform this action.',
        { duration: 6000 }
      );
      break;
      
    case 404:
      // Not Found
      toastService.error(
        'Resource Not Found',
        'The requested resource could not be found.',
        { duration: 6000 }
      );
      break;
      
    case 422:
      // Validation Error
      toastService.error(
        'Validation Error',
        errorDetails.message,
        { duration: 6000 }
      );
      break;
      
    case 500:
      // Internal Server Error
      toastService.error(
        'Server Error',
        'An unexpected error occurred on the server. Please try again later.',
        { duration: 6000 }
      );
      break;
      
    case 503:
      // Service Unavailable
      toastService.error(
        'Service Unavailable',
        'The service is temporarily unavailable. Please try again later.',
        { duration: 6000 }
      );
      break;
      
    default:
      // Generic error
      toastService.error(
        errorDetails.title,
        errorDetails.message,
        { duration: 6000 }
      );
      break;
  }
}

/**
 * Extract error details from HTTP response
 */
function extractErrorDetails(error: HttpErrorResponse): { title: string; message: string } {
  // Try to extract structured error information
  if (error.error && typeof error.error === 'object') {
    // Django REST Framework style errors
    if (error.error.error && error.error.message) {
      return {
        title: error.error.error,
        message: error.error.message
      };
    }
    
    // Django serializer validation errors
    if (error.error.detail) {
      return {
        title: 'Validation Error',
        message: error.error.detail
      };
    }
    
    // Form validation errors
    if (Object.keys(error.error).length > 0) {
      const firstErrorField = Object.keys(error.error)[0];
      const firstErrorMessages = error.error[firstErrorField];
      
      if (Array.isArray(firstErrorMessages) && firstErrorMessages.length > 0) {
        return {
          title: 'Validation Error',
          message: `${firstErrorField}: ${firstErrorMessages[0]}`
        };
      }
    }
  }
  
  // Fallback to generic messages based on status
  switch (error.status) {
    case 400:
      return {
        title: 'Bad Request',
        message: 'The request could not be understood by the server.'
      };
    case 401:
      return {
        title: 'Unauthorized',
        message: 'Authentication is required to access this resource.'
      };
    case 403:
      return {
        title: 'Forbidden',
        message: 'You do not have permission to access this resource.'
      };
    case 404:
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found.'
      };
    case 500:
      return {
        title: 'Server Error',
        message: 'An internal server error occurred.'
      };
    default:
      return {
        title: `Error ${error.status}`,
        message: error.message || 'An unknown error occurred.'
      };
  }
}