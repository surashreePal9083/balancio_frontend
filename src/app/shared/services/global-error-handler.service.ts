import { Injectable, ErrorHandler } from '@angular/core';
import { ToastNotificationService } from './toast-notification.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {
  
  constructor(private toastService: ToastNotificationService) {}

  handleError(error: any): void {
    // Log the error to the console
    console.error('Global Error Handler caught an error:', error);
    
    // Extract error message
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && error.message) {
      errorMessage = error.message;
    }
    
    // Don't show toast for certain common errors that are handled elsewhere
    if (!this.shouldIgnoreError(error)) {
      // Show error notification to user
      this.toastService.error(
        'Unexpected Error', 
        errorMessage,
        { duration: 8000 }
      );
    }
  }
  
  private shouldIgnoreError(error: any): boolean {
    // Ignore certain errors that are handled by other mechanisms
    if (error && typeof error === 'object') {
      // Ignore HTTP errors (handled by error interceptor)
      if (error.status || error.statusText) {
        return true;
      }
      
      // Ignore navigation errors
      if (error.name === 'NavigationError') {
        return true;
      }
      
      // Ignore cancelled navigation errors
      if (error.message && error.message.includes('Navigation cancelled')) {
        return true;
      }
    }
    
    return false;
  }
}