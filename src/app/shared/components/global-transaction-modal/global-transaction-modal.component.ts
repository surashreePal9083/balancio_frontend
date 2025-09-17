import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { GlobalTransactionModalService } from '../../services/global-transaction-modal.service';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { CurrencyService } from '../../services/currency.service';
import { ToastNotificationService } from '../../services/toast-notification.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-global-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-transaction-modal.component.html',
  styleUrls: ['./global-transaction-modal.component.scss']
})
export class GlobalTransactionModalComponent implements OnInit, OnDestroy {
  isModalOpen = false;
  isLoading = false;
  categories: Category[] = [];
  currencySymbol = '$';
  
  newTransaction = {
    title: '',
    amount: 0,
    category: '', // Will store category ID
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    description: ''
  };

  titleSuggestions: string[] = [];
  showSuggestions = false;

  // Static title suggestions for better UX
  private static expenseSuggestions = [
    'Groceries',
    'Gas',
    'Restaurant',
    'Coffee',
    'Uber/Taxi',
    'Shopping',
    'Utilities',
    'Rent',
    'Internet',
    'Phone Bill',
    'Insurance',
    'Gym Membership',
    'Subscription',
    'Medical',
    'Pharmacy',
    'Car Maintenance',
    'Parking',
    'Entertainment',
    'Movies',
    'Books',
    'Clothing',
    'Home Maintenance',
    'Office Supplies',
    'Gifts',
    'Travel',
    'Hotel',
    'Flight',
    'Public Transport'
  ];

  private static incomeSuggestions = [
    'Salary',
    'Freelance',
    'Bonus',
    'Investment',
    'Dividend',
    'Interest',
    'Side Hustle',
    'Consulting',
    'Rental Income',
    'Refund',
    'Gift',
    'Cashback',
    'Commission',
    'Part-time Job',
    'Overtime',
    'Tips',
    'Business Income',
    'Royalties',
    'Prize',
    'Sale'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private globalModalService: GlobalTransactionModalService,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private toastService: ToastNotificationService
  ) {}

  ngOnInit(): void {
    this.currencySymbol = this.currencyService.getCurrentCurrency().symbol;
    this.loadCategories();

    // Subscribe to modal state changes
    combineLatest([
      this.globalModalService.isModalOpen$,
      this.globalModalService.transactionType$
    ]).pipe(takeUntil(this.destroy$))
    .subscribe(([isOpen, type]) => {
      this.isModalOpen = isOpen;
      this.newTransaction.type = type;
      if (isOpen) {
        this.resetForm();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.categories = [];
        }
      });
  }

  get filteredCategories(): Category[] {
    return this.categories.filter(cat => cat.type === this.newTransaction.type);
  }

  closeModal(): void {
    this.globalModalService.closeModal();
    this.showSuggestions = false;
  }

  onTitleInput(event: any): void {
    const value = event.target.value.toLowerCase().trim();
    
    // Get static suggestions based on transaction type
    const suggestions = this.newTransaction.type === 'expense' 
      ? GlobalTransactionModalComponent.expenseSuggestions
      : GlobalTransactionModalComponent.incomeSuggestions;
    
    if (value.length === 0) {
      // Show top suggestions when input is empty
      this.titleSuggestions = suggestions.slice(0, 6);
      this.showSuggestions = true;
      return;
    }
    
    // Filter suggestions that match the input
    this.titleSuggestions = suggestions
      .filter(suggestion => suggestion.toLowerCase().includes(value))
      .slice(0, 6); // Show up to 6 suggestions
    
    this.showSuggestions = this.titleSuggestions.length > 0;
  }

  onTitleFocus(event: any): void {
    // Show suggestions when field is focused
    this.onTitleInput(event);
  }

  onTitleBlur(): void {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  selectSuggestion(suggestion: string): void {
    this.newTransaction.title = suggestion;
    if (!this.newTransaction.description.trim()) {
      this.newTransaction.description = suggestion;
    }
    this.showSuggestions = false;
  }

  onTypeChange(): void {
    this.newTransaction.category = '';
    this.showSuggestions = false;
    // Refresh suggestions for the new type if there's already text
    if (this.newTransaction.title.trim()) {
      this.onTitleInput({ target: { value: this.newTransaction.title } });
    }
  }

  addTransaction(): void {
    if (!this.newTransaction.title.trim() || !this.newTransaction.amount || !this.newTransaction.category) {
      this.toastService.warning(
        'Missing Information',
        'Please fill in all required fields (Title, Amount, Category)'
      );
      return;
    }

    if (this.newTransaction.amount <= 0) {
      this.toastService.warning(
        'Invalid Amount',
        'Amount must be greater than 0'
      );
      return;
    }

    // Validate category ID is a valid number
    const categoryId = parseInt(this.newTransaction.category, 10);
    if (isNaN(categoryId)) {
      this.toastService.warning(
        'Invalid Category',
        'Please select a valid category'
      );
      return;
    }

    this.isLoading = true;

    // Format data according to Django backend expectations
    const transactionData = {
      title: this.newTransaction.title.trim(),
      description: this.newTransaction.description.trim() || this.newTransaction.title.trim(),
      amount: Number(this.newTransaction.amount),
      type: this.newTransaction.type,
      category: categoryId, // Convert string ID to integer for Django
      date: this.newTransaction.date // Send as string, backend will parse
    };
    
    this.transactionService.createTransaction(transactionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Show success toast notification
          this.toastService.success(
            'Transaction Added!',
            `${this.newTransaction.type === 'income' ? 'Income' : 'Expense'} of ${this.currencySymbol}${this.newTransaction.amount} added successfully`
          );
          
          this.closeModal();
          this.isLoading = false;
          // Emit event to refresh other components if needed
          window.dispatchEvent(new CustomEvent('transactionAdded'));
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          let errorMessage = 'Failed to add transaction. Please try again.';
          
          // Handle specific validation errors from backend
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.category) {
              // Handle category-specific errors
              const categoryErrors = Array.isArray(error.error.category) 
                ? error.error.category.join(', ') 
                : error.error.category;
              errorMessage = `Category error: ${categoryErrors}. Please select a valid category.`;
            } else {
              // Handle other field validation errors
              const errors = Object.keys(error.error).map(key => {
                const fieldErrors = Array.isArray(error.error[key]) 
                  ? error.error[key].join(', ') 
                  : error.error[key];
                return `${key}: ${fieldErrors}`;
              }).join('; ');
              errorMessage = `Validation errors: ${errors}`;
            }
          }
          
          // Show error toast notification
          this.toastService.error(
            'Failed to Add Transaction',
            errorMessage
          );
          this.isLoading = false;
        }
      });
  }

  resetForm(): void {
    this.newTransaction = {
      title: '',
      amount: 0,
      category: '',
      type: this.newTransaction.type,
      date: new Date().toISOString().split('T')[0],
      description: ''
    };
    this.showSuggestions = false;
  }

  private showError(message: string): void {
    // Using toast notifications instead of alert
    this.toastService.error('Error', message);
  }

  private showSuccess(message: string): void {
    // Using toast notifications instead of console.log
    this.toastService.success('Success', message);
  }

  // Click outside to close modal
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  // TrackBy function for better performance
  trackBySuggestion(index: number, suggestion: string): string {
    return suggestion;
  }
}