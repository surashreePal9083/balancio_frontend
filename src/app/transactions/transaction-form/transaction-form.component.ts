import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TransactionService } from '../../shared/services/transaction.service';
import { CategoryService } from '../../shared/services/category.service';
import { CurrencyService } from '../../shared/services/currency.service';
import { ToastNotificationService } from '../../shared/services/toast-notification.service';
import { Transaction } from '../../shared/models/transaction.model';
import { Category } from '../../shared/models/category.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit, OnDestroy {
  transactionForm: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  transactionId: string | null = null;
  isLoading = false;
  currencySymbol = '$';
  
  // Title suggestions functionality
  titleSuggestions: string[] = [];
  showSuggestions = false;
  
  // Form error messages
  formErrors: { [key: string]: string } = {};
  
  // Static title suggestions for better UX
  private static expenseSuggestions = [
    'Groceries', 'Gas', 'Restaurant', 'Coffee', 'Uber/Taxi', 'Shopping',
    'Utilities', 'Rent', 'Internet', 'Phone Bill', 'Insurance', 'Gym Membership',
    'Subscription', 'Medical', 'Pharmacy', 'Car Maintenance', 'Parking',
    'Entertainment', 'Movies', 'Books', 'Clothing', 'Home Maintenance',
    'Office Supplies', 'Gifts', 'Travel', 'Hotel', 'Flight', 'Public Transport'
  ];

  private static incomeSuggestions = [
    'Salary', 'Freelance', 'Bonus', 'Investment', 'Dividend', 'Interest',
    'Side Hustle', 'Consulting', 'Rental Income', 'Refund', 'Gift',
    'Cashback', 'Commission', 'Part-time Job', 'Overtime', 'Tips',
    'Business Income', 'Royalties', 'Prize', 'Sale'
  ];
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private toastService: ToastNotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.transactionForm = this.fb.group({
      title: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['expense', [Validators.required]],
      categoryId: ['', [Validators.required]],
      description: [''],
      date: [new Date().toISOString().split('T')[0], [Validators.required]]
    });
    
    // Subscribe to form value changes to clear errors
    this.transactionForm.valueChanges.subscribe(() => {
      this.clearFormErrors();
    });
  }

  ngOnInit() {
    this.currencySymbol = this.currencyService.getCurrentCurrency().symbol;
    this.loadCategories();
    this.transactionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.transactionId;
    
    // Listen for transaction type changes to update suggestions and categories
    this.transactionForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showSuggestions = false;
        this.transactionForm.patchValue({ categoryId: '' });
        const titleControl = this.transactionForm.get('title');
        if (titleControl?.value?.trim()) {
          this.onTitleInput({ target: { value: titleControl.value } });
        }
      });
    
    if (this.isEditMode && this.transactionId) {
      this.loadTransaction(this.transactionId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories() {
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.toastService.error('Error', 'Failed to load categories. Please try again later.');
        }
      });
  }

  loadTransaction(id: string) {
    this.transactionService.getTransaction(id).subscribe({
      next: (transaction) => {
        if (transaction) {
          this.transactionForm.patchValue({
            title: transaction.title,
            amount: transaction.amount,
            type: transaction.type,
            categoryId: transaction.categoryId,
            description: transaction.description,
            date: new Date(transaction.date).toISOString().split('T')[0]
          });
        }
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.toastService.error('Error', 'Failed to load transaction details. Please try again later.');
        this.router.navigate(['/transactions']);
      }
    });
  }

  onSubmit() {
    if (this.transactionForm.valid) {
      this.isLoading = true;
      const formData = this.transactionForm.value;
      
      const transactionData = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: parseInt(formData.categoryId, 10),
        description: formData.description?.trim() || '',
        date: formData.date
      };

      const operation = this.isEditMode && this.transactionId
        ? this.transactionService.updateTransaction(this.transactionId, transactionData)
        : this.transactionService.createTransaction(transactionData);

      operation.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          const action = this.isEditMode ? 'updated' : 'added';
          this.toastService.success(
            `Transaction ${action.charAt(0).toUpperCase() + action.slice(1)}!`,
            `${formData.type === 'income' ? 'Income' : 'Expense'} of ${this.currencySymbol}${formData.amount} ${action} successfully`
          );
          this.router.navigate(['/transactions']);
        },
        error: (error) => {
          console.error('Error saving transaction:', error);
          this.handleTransactionError(error);
          this.isLoading = false;
        }
      });
    } else {
      this.validateForm();
      this.toastService.warning('Form Invalid', 'Please fill in all required fields correctly');
    }
  }

  cancel() {
    this.router.navigate(['/transactions']);
  }

  // Title suggestion methods
  onTitleInput(event: any): void {
    const value = event.target.value.toLowerCase().trim();
    const currentType = this.transactionForm.get('type')?.value || 'expense';
    const suggestions = currentType === 'expense' 
      ? TransactionFormComponent.expenseSuggestions
      : TransactionFormComponent.incomeSuggestions;
    
    if (value.length === 0) {
      this.titleSuggestions = suggestions.slice(0, 6);
      this.showSuggestions = true;
      return;
    }
    
    this.titleSuggestions = suggestions
      .filter(suggestion => suggestion.toLowerCase().includes(value))
      .slice(0, 6);
    
    this.showSuggestions = this.titleSuggestions.length > 0;
  }

  onTitleFocus(event: any): void {
    this.onTitleInput(event);
  }

  onTitleBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  selectSuggestion(suggestion: string): void {
    this.transactionForm.patchValue({ title: suggestion });
    if (!this.transactionForm.get('description')?.value?.trim()) {
      this.transactionForm.patchValue({ description: suggestion });
    }
    this.showSuggestions = false;
  }

  trackBySuggestion(index: number, suggestion: string): string {
    return suggestion;
  }

  get filteredCategories(): Category[] {
    const currentType = this.transactionForm.get('type')?.value || 'expense';
    return this.categories.filter(cat => cat.type === currentType);
  }

  // Form validation methods
  private validateForm(): void {
    this.clearFormErrors();
    
    const controls = this.transactionForm.controls;
    
    Object.keys(controls).forEach(controlName => {
      const control = controls[controlName];
      if (control.errors) {
        this.formErrors[controlName] = this.getErrorMessage(controlName, control.errors);
      }
    });
  }

  private getErrorMessage(controlName: string, errors: any): string {
    const errorMessages: { [key: string]: { [key: string]: string } } = {
      'title': {
        'required': 'Title is required'
      },
      'amount': {
        'required': 'Amount is required',
        'min': 'Amount must be greater than 0'
      },
      'type': {
        'required': 'Transaction type is required'
      },
      'categoryId': {
        'required': 'Category is required'
      },
      'date': {
        'required': 'Date is required'
      }
    };
    
    const controlErrors = errorMessages[controlName];
    if (controlErrors) {
      for (const errorKey in errors) {
        if (controlErrors[errorKey]) {
          return controlErrors[errorKey];
        }
      }
    }
    
    return 'This field is invalid';
  }

  private clearFormErrors(): void {
    this.formErrors = {};
  }

  private handleTransactionError(error: any): void {
    // Handle specific error cases
    if (error.status === 400) {
      // Validation errors
      if (error.error && typeof error.error === 'object') {
        // Extract field-specific errors
        Object.keys(error.error).forEach(field => {
          const fieldErrors = error.error[field];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            this.formErrors[field] = fieldErrors[0];
          }
        });
        
        // Show a general error message
        this.toastService.error('Validation Error', 'Please check the form for errors');
      } else {
        this.toastService.error('Invalid Data', 'Please check your input and try again');
      }
    } else if (error.status === 401) {
      this.toastService.error('Authentication Required', 'Please log in to continue');
    } else if (error.status === 403) {
      this.toastService.error('Access Denied', 'You do not have permission to perform this action');
    } else if (error.status === 404) {
      this.toastService.error('Not Found', 'The requested resource could not be found');
    } else if (error.status >= 500) {
      this.toastService.error('Server Error', 'An unexpected error occurred on the server. Please try again later.');
    } else {
      this.toastService.error('Error', 'An unexpected error occurred. Please try again later.');
    }
  }
}