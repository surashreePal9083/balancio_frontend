import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ToastNotificationService } from '../../services/toast-notification.service';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  showProgress?: boolean;
  progress?: number;
  autoClose?: boolean;
}

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-3">
      <div
        *ngFor="let toast of toasts; trackBy: trackByToast"
        class="transform transition-all duration-300 ease-in-out opacity-100">
        
        <!-- Toast Content -->
        <div class="flex items-start space-x-3 p-4 rounded-lg shadow-lg border max-w-sm bg-white"
             [class]="getBorderClasses(toast.type)">
          
          <!-- Icon -->
          <div class="flex-shrink-0">
            <div class="w-6 h-6 rounded-full flex items-center justify-center"
                 [class]="getIconBackgroundClasses(toast.type)">
              <span class="material-icons text-sm" [class]="getIconColorClasses(toast.type)">
                {{ getIcon(toast.type) }}
              </span>
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium" [class]="getTitleColorClasses(toast.type)">
              {{ toast.title }}
            </p>
            <p *ngIf="toast.message" class="text-sm mt-1" [class]="getMessageColorClasses(toast.type)">
              {{ toast.message }}
            </p>
          </div>
          
          <!-- Close Button -->
          <button
            (click)="dismissToast(toast.id)"
            class="flex-shrink-0 p-1 rounded-md transition-colors"
            [class]="getCloseButtonClasses(toast.type)">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div *ngIf="toast.showProgress" 
             class="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full transition-all duration-100 ease-linear"
               [class]="getProgressBarClasses(toast.type)"
               [style.width.%]="toast.progress">
          </div>
        </div>
      </div>
    </div>
  `
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private destroy$ = new Subject<void>();

  constructor(private toastService: ToastNotificationService) {}

  ngOnInit(): void {
    this.toastService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe((toasts: Toast[]) => {
        this.toasts = toasts;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismissToast(id: string): void {
    this.toastService.dismiss(id);
  }

  trackByToast(index: number, toast: Toast): string {
    return toast.id;
  }

  getBorderClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-yellow-200';
      case 'info':
        return 'border-blue-200';
      default:
        return 'border-gray-200';
    }
  }

  getIconBackgroundClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'error':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  }

  getIconColorClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

  getTitleColorClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  }

  getMessageColorClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  }

  getCloseButtonClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-400 hover:text-green-600 hover:bg-green-50';
      case 'error':
        return 'text-red-400 hover:text-red-600 hover:bg-red-50';
      case 'warning':
        return 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50';
      case 'info':
        return 'text-blue-400 hover:text-blue-600 hover:bg-blue-50';
      default:
        return 'text-gray-400 hover:text-gray-600 hover:bg-gray-50';
    }
  }

  getProgressBarClasses(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }

  getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'notifications';
    }
  }
}