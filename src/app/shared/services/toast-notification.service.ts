import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // Duration in milliseconds
  showProgress?: boolean;
  progress?: number; // Progress percentage (0-100)
  autoClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastNotificationService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private defaultDuration = 4000; // 4 seconds
  private progressInterval = 100; // Update progress every 100ms

  constructor() {}

  show(toast: Omit<Toast, 'id' | 'progress'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      progress: 100,
      autoClose: toast.autoClose !== false, // Default to true
      duration: toast.duration || this.defaultDuration,
      showProgress: toast.showProgress !== false // Default to true
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    if (newToast.autoClose) {
      this.startAutoClose(newToast);
    }
  }

  success(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      title,
      message,
      type: 'success',
      ...options
    });
  }

  error(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      title,
      message,
      type: 'error',
      autoClose: false, // Errors should stay until manually dismissed
      ...options
    });
  }

  warning(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      title,
      message,
      type: 'warning',
      ...options
    });
  }

  info(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      title,
      message,
      type: 'info',
      ...options
    });
  }

  dismiss(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const updatedToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(updatedToasts);
  }

  dismissAll(): void {
    this.toastsSubject.next([]);
  }

  private startAutoClose(toast: Toast): void {
    if (!toast.duration || !toast.autoClose) return;

    const steps = toast.duration / this.progressInterval;
    let currentStep = 0;

    const progressTimer = timer(0, this.progressInterval).subscribe(() => {
      currentStep++;
      const progressPercentage = 100 - (currentStep / steps) * 100;

      if (progressPercentage <= 0) {
        this.dismiss(toast.id);
        progressTimer.unsubscribe();
        return;
      }

      // Update progress
      const currentToasts = this.toastsSubject.value;
      const updatedToasts = currentToasts.map(t => 
        t.id === toast.id ? { ...t, progress: progressPercentage } : t
      );
      this.toastsSubject.next(updatedToasts);
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}