import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Subject, takeUntil, retry, catchError, of, forkJoin, Observable, tap } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../shared/services/user.service';
import { CurrencyService } from '../../shared/services/currency.service';
import { BudgetService } from '../../shared/services/budget.service';
import { TransactionService } from '../../shared/services/transaction.service';
import { CategoryService } from '../../shared/services/category.service';
import { ApiService } from '../../shared/services/api.service';
import { NotificationService } from '../../shared/services/notification.service';
import { API_CONFIG } from '../../shared/utils/constants';
import { User } from '../../shared/models/user.model';
import { MonthlyBudget, BudgetOverview } from '../../shared/models/budget.model';
import { Transaction } from '../../shared/models/transaction.model';
import { Category } from '../../shared/models/category.model';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

interface UserProfile {
  fullName: string;
  email: string;
  initials: string;
  memberType: string;
  memberSince: Date;
  accountStatus: 'Active' | 'Inactive';
  daysActive: number;
  transactions: number;
  categoriesUsed: number;
  totalSaved: number;
  isPremium: boolean;
  avatar?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  budgetAlerts: boolean;
  monthlyReports: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}
@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,LoaderComponent],
  templateUrl:'./profile-view.component.html'
})
export class ProfileViewComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  dataLoadingError: string = '';
  uploadingAvatar: boolean = false;
  uploadProgress: number = 0;
  retryCount: number = 0;
  maxRetries: number = 3;
  
  // User activity
  userActivity: ActivityItem[] = [];
  showActivity: boolean = false;
  loadingActivity: boolean = false;
  
  // Budget related properties
  currentBudget: MonthlyBudget | null = null;
  budgetOverview: BudgetOverview | null = null;
  transactions: Transaction[] = [];
  categories: Category[] = [];
  budgetChartData: any[] = [];
  
  private destroy$ = new Subject<void>();
  userProfile: UserProfile = {
    fullName: '',
    email: '',
    initials: '',
    memberType: 'Free Member',
    memberSince: new Date(),
    accountStatus: 'Active',
    daysActive: 0,
    transactions: 0,
    categoriesUsed: 0,
    totalSaved: 0,
    isPremium: false,
    avatar: ''
  };

  // Notification settings
  notificationSettings: NotificationSettings = {
    emailNotifications: true,
    budgetAlerts: true,
    monthlyReports: false
  };
  
  reportFormat: string = 'excel';
  currencySymbol: string = '₹';

  // Edit mode states
  editingPersonalInfo: boolean = false;
  showChangePasswordModal: boolean = false;
  showTwoFactorModal: boolean = false;

  // Form data for editing
  editForm = {
    fullName: '',
    email: ''
  };

  // Password change form
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Security settings
  passwordLastChanged: Date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 2 months ago
  twoFactorEnabled: boolean = false;
  showLogoutModal: boolean = false;
  
  Math = Math; // Make Math available in template

  constructor(
    private authService: AuthService, 
    private router: Router,
    private userService: UserService,
    private http: HttpClient,
    private currencyService: CurrencyService,
    private budgetService: BudgetService,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.currencySymbol = this.currencyService.getCurrentCurrency().symbol;
    
    // Initialize with default values to prevent NaN/undefined issues
    this.userProfile = {
      fullName: 'Loading...',
      email: '',
      initials: 'L',
      memberType: 'Free Member',
      memberSince: new Date(),
      accountStatus: 'Active',
      daysActive: 0,
      transactions: 0,
      categoriesUsed: 0,
      totalSaved: 0,
      isPremium: false
    };
    
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.dataLoadingError = '';
    
    // Load all data in parallel for better performance
    forkJoin({
      user: this.loadUserProfile(),
      budget: this.loadBudgetDataObservable(),
      transactions: this.loadTransactionsObservable(),
      categories: this.loadCategoriesObservable()
    }).pipe(
      takeUntil(this.destroy$),
      retry(this.maxRetries),
      catchError(error => {
        console.error('Error loading profile data:', error);
        this.dataLoadingError = 'Failed to load profile data. Please refresh the page.';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        if (data) {
          this.updateBudgetWithTransactionData();
          this.prepareBudgetChartData();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Critical error loading profile:', error);
        this.isLoading = false;
        this.dataLoadingError = 'Unable to load profile data.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile(): Observable<User | null> {
    return this.userService.getCurrentUser().pipe(
      takeUntil(this.destroy$),
      retry(2),
      tap((user: User) => {
        // console.log('User data received in profile component:', user); // Debug log - uncomment if needed
        if (user) {
          // Handle name properly - check both naming conventions
          const firstName = user.firstName || user.first_name || '';
          const lastName = user.lastName || user.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          // console.log('Processed name data:', { firstName, lastName, fullName }); // Debug log - uncomment if needed
          
          // Handle dates properly
          let memberSince = new Date();
          if (user.createdAt) {
            memberSince = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
          } else if (user.created_at) {
            memberSince = new Date(user.created_at);
          }
          
          // Calculate days active safely
          const now = Date.now();
          const memberSinceTime = memberSince.getTime();
          const daysActive = !isNaN(memberSinceTime) ? Math.floor((now - memberSinceTime) / (1000 * 60 * 60 * 24)) : 0;
          
          this.userProfile = {
            fullName: fullName || user.email.split('@')[0] || 'User',
            email: user.email,
            initials: this.generateInitials(firstName, lastName, user.email),
            memberType: 'Free Member',
            memberSince: memberSince,
            accountStatus: 'Active',
            daysActive: Math.max(0, daysActive), // Ensure non-negative
            transactions: 0,
            categoriesUsed: 0,
            totalSaved: 0,
            isPremium: false,
            avatar: user.avatar && user.avatar !== 'https://via.placeholder.com/150' ? user.avatar : undefined
          };
          
          this.loadUserStatistics();
          
          if (user.settings) {
            this.notificationSettings = {
              emailNotifications: user.settings.emailNotifications,
              budgetAlerts: user.settings.budgetAlerts,
              monthlyReports: user.settings.monthlyReports
            };
            this.reportFormat = user.settings.reportFormat || 'excel';
            this.twoFactorEnabled = user.settings.twoFactorEnabled;
          }
          
          this.initializeEditForm();
        }
      }),
      catchError(error => {
        console.error('Error loading user profile:', error);
        this.notificationService.addNotification({
          title: 'Error',
          message: 'Failed to load profile information',
          type: 'error'
        });
        return of(null);
      })
    );
  }

  loadBudgetDataObservable(): Observable<any> {
    return forkJoin({
      budget: this.budgetService.getBudget(),
      overview: this.budgetService.getBudgetOverview()
    }).pipe(
      tap(({ budget, overview }) => {
        this.currentBudget = budget;
        this.budgetOverview = overview;
      }),
      catchError(error => {
        console.error('Error loading budget data:', error);
        return of({ budget: null, overview: null });
      })
    );
  }

  loadTransactionsObservable(): Observable<Transaction[]> {
    return this.transactionService.getTransactions().pipe(
      tap((transactions: Transaction[]) => {
        this.transactions = transactions;
      }),
      catchError(error => {
        console.error('Error loading transactions:', error);
        return of([]);
      })
    );
  }

  loadCategoriesObservable(): Observable<Category[]> {
    return this.categoryService.getCategories().pipe(
      tap((categories: Category[]) => {
        this.categories = categories;
      }),
      catchError(error => {
        console.error('Error loading categories:', error);
        return of([]);
      })
    );
  }

  // Initialize edit form with current values
  initializeEditForm(): void {
    this.editForm = {
      fullName: this.userProfile.fullName || '',
      email: this.userProfile.email || ''
    };
  }

  // Personal Information Section
  startEditingPersonalInfo(): void {
    this.editingPersonalInfo = true;
    this.initializeEditForm();
  }

  cancelEditingPersonalInfo(): void {
    this.editingPersonalInfo = false;
    this.initializeEditForm();
  }

  savePersonalInfo(): void {
    if (this.editForm.fullName.trim() && this.editForm.email.trim()) {
      const names = this.editForm.fullName.split(' ');
      const updateData = {
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: this.editForm.email
      };
      
      this.userService.updateUser(updateData).subscribe({
        next: (user) => {
          this.userProfile.fullName = this.editForm.fullName;
          this.userProfile.email = this.editForm.email;
          this.userProfile.initials = names.map(name => name.charAt(0)).join('').toUpperCase();
          this.editingPersonalInfo = false;
          this.notificationService.addNotification({
            title: 'Success',
            message: 'Profile updated successfully',
            type: 'success'
          });
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.notificationService.addNotification({
            title: 'Error',
            message: 'Failed to update profile',
            type: 'error'
          });
        }
      });
    }
  }

  // Security Settings
  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
  }

  changePassword(): void {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.notificationService.addNotification({
        title: 'Error',
        message: 'New passwords do not match',
        type: 'error'
      });
      return;
    }

    if (this.passwordForm.newPassword.length < 8) {
      this.notificationService.addNotification({
        title: 'Error',
        message: 'Password must be at least 8 characters long',
        type: 'error'
      });
      return;
    }

    this.userService.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: () => {
        this.passwordLastChanged = new Date();
        this.showChangePasswordModal = false;
        this.notificationService.addNotification({
          title: 'Success',
          message: 'Password changed successfully. Please log in again.',
          type: 'success'
        });
        
        // Force logout to ensure new password is required
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Password change error:', error);
        let errorMessage = 'Failed to change password';
        
        if (error.status === 400) {
          errorMessage = 'Current password is incorrect';
        } else if (error.status === 404) {
          errorMessage = 'Password change service unavailable';
        }
        
        this.notificationService.addNotification({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
      }
    });
  }

  // Two-Factor Authentication
  openTwoFactorModal(): void {
    this.showTwoFactorModal = true;
  }

  closeTwoFactorModal(): void {
    this.showTwoFactorModal = false;
  }

  toggleTwoFactor(): void {
    const newValue = !this.twoFactorEnabled;
    
    const updateData = {
      ...this.notificationSettings,
      reportFormat: this.reportFormat,
      twoFactorEnabled: newValue
    };
    
    this.userService.updateSettings(updateData).subscribe({
      next: () => {
        this.twoFactorEnabled = newValue;
        this.showTwoFactorModal = false;
        const status = this.twoFactorEnabled ? 'enabled' : 'disabled';
        this.notificationService.addNotification({
          title: 'Success',
          message: `Two-factor authentication ${status}`,
          type: 'success'
        });
      },
      error: (error) => {
        console.error('Error updating 2FA:', error);
        this.notificationService.addNotification({
          title: 'Error',
          message: 'Failed to update two-factor authentication',
          type: 'error'
        });
      }
    });
  }

  // Enhanced notification settings update
  updateNotificationSetting(setting: keyof NotificationSettings): void {
    this.notificationSettings[setting] = !this.notificationSettings[setting];
    
    const updateData = {
      settings: {
        ...this.notificationSettings,
        reportFormat: this.reportFormat,
        twoFactorEnabled: this.twoFactorEnabled
      }
    };
    
    this.userService.updateSettings(updateData.settings).subscribe({
      next: () => {
        this.notificationService.addNotification({
          title: 'Success',
          message: 'Notification settings updated',
          type: 'success'
        });
      },
      error: (error) => {
        console.error('Error updating settings:', error);
        // Revert the change on error
        this.notificationSettings[setting] = !this.notificationSettings[setting];
        this.notificationService.addNotification({
          title: 'Error',
          message: 'Failed to update notification settings',
          type: 'error'
        });
      }
    });
  }

  configureEmailNotifications(): void {
    this.notificationService.addNotification({
      title: 'Info',
      message: 'Email notification configuration coming soon',
      type: 'info'
    });
  }

  configureBudgetAlerts(): void {
    this.notificationService.addNotification({
      title: 'Info', 
      message: 'Budget alert configuration coming soon',
      type: 'info'
    });
  }

  configureMonthlyReports(): void {
    this.notificationService.addNotification({
      title: 'Info',
      message: 'Monthly report configuration coming soon', 
      type: 'info'
    });
  }
  
  updateReportFormat(): void {
    const updateData = {
      ...this.notificationSettings,
      reportFormat: this.reportFormat,
      twoFactorEnabled: this.twoFactorEnabled
    };
    
    this.userService.updateSettings(updateData).subscribe({
      next: () => {
        this.notificationService.addNotification({
          title: 'Success',
          message: 'Report format updated',
          type: 'success'
        });
      },
      error: (error) => {
        console.error('Error updating report format:', error);
        this.notificationService.addNotification({
          title: 'Error',
          message: 'Failed to update report format',
          type: 'error'
        });
      }
    });
  }

  // Avatar upload functionality
  onAvatarFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadAvatar(file);
    }
  }

  uploadAvatar(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.notificationService.addNotification({
        title: 'Error',
        message: 'Please select a valid image file',
        type: 'error'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      this.notificationService.addNotification({
        title: 'Error',
        message: 'Image size must be less than 5MB',
        type: 'error'
      });
      return;
    }

    this.uploadingAvatar = true;
    this.uploadProgress = 0;

    this.userService.uploadAvatar(file).subscribe({
      next: (updatedUser) => {
        this.uploadingAvatar = false;
        this.uploadProgress = 100;
        this.userProfile.avatar = updatedUser.avatar;
        this.notificationService.addNotification({
          title: 'Success',
          message: 'Profile picture updated successfully',
          type: 'success'
        });
      },
      error: (error) => {
        this.uploadingAvatar = false;
        this.uploadProgress = 0;
        console.error('Avatar upload error:', error);
        this.notificationService.addNotification({
          title: 'Error',
          message: 'Failed to upload profile picture',
          type: 'error'
        });
      }
    });
  }

  deleteAvatar(): void {
    this.userService.deleteAvatar().subscribe({
      next: (updatedUser) => {
        this.userProfile.avatar = undefined;
        this.notificationService.addNotification({
          title: 'Success',
          message: 'Profile picture removed successfully',
          type: 'success'
        });
      },
      error: (error) => {
        console.error('Avatar delete error:', error);
        this.notificationService.addNotification({
          title: 'Error',
          message: 'Failed to remove profile picture',
          type: 'error'
        });
      }
    });
  }

  // User activity functionality
  loadUserActivity(): void {
    if (this.loadingActivity) return;
    
    this.loadingActivity = true;
    this.userService.getUserActivity(10).subscribe({
      next: (activities) => {
        this.userActivity = activities.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
        this.showActivity = true;
        this.loadingActivity = false;
      },
      error: (error) => {
        console.error('Error loading user activity:', error);
        this.loadingActivity = false;
        this.notificationService.addNotification({
          title: 'Error',
          message: 'Failed to load user activity',
          type: 'error'
        });
      }
    });
  }

  toggleActivity(): void {
    if (!this.showActivity && this.userActivity.length === 0) {
      this.loadUserActivity();
    } else {
      this.showActivity = !this.showActivity;
    }
  }

  // Enhanced data refresh with proper error handling
  refreshProfileData(): void {
    this.retryCount = 0; // Reset retry count
    this.loadAllData();
  }
  retryLoadData(): void {
    this.retryCount++;
    if (this.retryCount <= this.maxRetries) {
      this.loadAllData();
    } else {
      this.notificationService.addNotification({
        title: 'Error',
        message: 'Maximum retry attempts reached. Please refresh the page.',
        type: 'error'
      });
    }
  }
  exportData(): void {
    this.notificationService.addNotification({
      title: 'Info',
      message: 'Preparing data export...',
      type: 'info'
    });
    
    // Simulate data export with comprehensive data
    const data = {
      profile: this.userProfile,
      settings: this.notificationSettings,
      budgetOverview: this.budgetOverview,
      transactions: this.transactions.slice(0, 100), // Limit for performance
      categories: this.categories,
      exportDate: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `balancio-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    window.URL.revokeObjectURL(url);
    
    this.notificationService.addNotification({
      title: 'Success',
      message: 'Data exported successfully',
      type: 'success'
    });
  }

  openPrivacySettings(): void {
    this.notificationService.addNotification({
      title: 'Info',
      message: 'Privacy settings page coming soon',
      type: 'info'
    });
  }

  openAccountHelp(): void {
    this.notificationService.addNotification({
      title: 'Info',
      message: 'Account help page coming soon',
      type: 'info'
    });
  }

  signOut(): void {
    this.showLogoutModal = true;
  }
  
  confirmLogout(): void {
    // Clear all local data
    localStorage.clear();
    sessionStorage.clear();
    
    // Call auth service logout
    this.authService.logout();
    
    // Navigate to login
    this.router.navigate(['/login']).then(() => {
      // Force page reload to clear any cached data
      window.location.reload();
    });
  }
  
  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  // Utility methods
  getPasswordLastChangedText(): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.passwordLastChanged.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    }
  }

  loadUserStatistics(): void {
    // Load transaction statistics
    this.transactionService.getTransactions().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading transaction statistics:', error);
        return of([]);
      })
    ).subscribe({
      next: (transactions) => {
        this.userProfile.transactions = transactions.length;
        
        // Calculate total savings (income - expenses)
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        this.userProfile.totalSaved = income - expenses;
        
        // Count unique categories
        const uniqueCategories = new Set(transactions.map(t => t.categoryId).filter(id => id));
        this.userProfile.categoriesUsed = uniqueCategories.size;
      }
    });
  }

  // Helper method to generate initials safely
  generateInitials(firstName: string, lastName: string, email: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    
    if (first || last) {
      return `${first}${last}`;
    }
    
    // Fallback to email first letter if no name available
    return email?.charAt(0)?.toUpperCase() || 'U';
  }

  getMemberSinceText(): string {
    if (!this.userProfile.memberSince || isNaN(this.userProfile.memberSince.getTime())) {
      return 'Recently';
    }
    return this.userProfile.memberSince.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  getStatusColor(status: string): string {
    return status === 'Active' ? 'text-green-600' : 'text-red-600';
  }

  getStatusBgColor(status: string): string {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // Budget related methods (original methods updated for better error handling)
  loadBudgetData(): void {
    this.budgetService.getBudget()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (budget) => {
          this.currentBudget = budget;
        },
        error: (error) => {
          console.error('Error loading budget:', error);
        }
      });

    this.budgetService.getBudgetOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (overview) => {
          this.budgetOverview = overview;
          // Update with real transaction data after both budget and transactions are loaded
          this.updateBudgetWithTransactionData();
        },
        error: (error) => {
          console.error('Error loading budget overview:', error);
        }
      });
  }

  formatCurrencyAmount(amount: number): string {
    return this.budgetService.formatCurrency(amount, this.currentBudget?.currency || 'USD');
  }

  getBudgetStatusColorClass(): string {
    if (!this.budgetOverview) return 'text-gray-600';
    return this.budgetService.getBudgetStatusColor(
      this.budgetOverview.percentageUsed || 0,
      this.budgetOverview.thresholds
    );
  }

  getBudgetProgressColorClass(): string {
    if (!this.budgetOverview) return 'bg-gray-400';
    return this.budgetService.getBudgetProgressColor(
      this.budgetOverview.percentageUsed || 0,
      this.budgetOverview.thresholds
    );
  }

  getBudgetStatusMessage(): string {
    if (!this.budgetOverview) return 'No budget data available';
    return this.budgetService.getBudgetStatusMessage(this.budgetOverview);
  }

  loadTransactions(): void {
    this.transactionService.getTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions: Transaction[]) => {
          this.transactions = transactions;
          // Update budget data with actual transaction amounts
          this.updateBudgetWithTransactionData();
          this.prepareBudgetChartData();
        },
        error: (error: any) => {
          console.error('Error loading transactions:', error);
        }
      });
  }

  private updateBudgetWithTransactionData(): void {
    if (this.budgetOverview && this.transactions.length > 0) {
      // Calculate current month expenses from actual transactions
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthExpenses = this.transactions
        .filter(t => t.type === 'expense')
        .filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Update budget overview with actual expense data
      this.budgetOverview = {
        ...this.budgetOverview,
        spent: currentMonthExpenses,
        remaining: (this.budgetOverview.budget || 0) - currentMonthExpenses,
        percentageUsed: this.budgetOverview.budget ? (currentMonthExpenses / this.budgetOverview.budget) * 100 : 0
      };
      
      console.log('Profile View - Updated budget overview with transaction data:', this.budgetOverview);
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories: Category[]) => {
          this.categories = categories;
        },
        error: (error: any) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  prepareBudgetChartData(): void {
    if (!this.budgetOverview || !this.transactions.length) return;
    
    // Get last 6 months data
    const months = this.getLastSixMonths();
    this.budgetChartData = months.map(month => {
      const monthTransactions = this.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === month.index && 
               transactionDate.getFullYear() === month.year;
      });
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: month.name,
        budget: this.budgetOverview?.budget || 0,
        expenses: expenses,
        remaining: (this.budgetOverview?.budget || 0) - expenses
      };
    });
  }

  getLastSixMonths() {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        index: date.getMonth(),
        year: date.getFullYear()
      });
    }
    
    return months;
  }

  getChartBarHeight(value: number): number {
    if (!this.budgetChartData.length) return 0;
    const maxValue = Math.max(
      ...this.budgetChartData.map(d => Math.max(d.budget, d.expenses))
    );
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  getTopExpenseCategories() {
    if (!this.transactions.length || !this.categories.length) return [];
    
    // Get current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthExpenses = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    // Group by category and calculate totals
    const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
      // Find the category name by ID
      const category = this.categories.find(cat => cat.id === expense.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      
      acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to array and sort by amount (descending)
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3); // Top 3 categories
  }
}