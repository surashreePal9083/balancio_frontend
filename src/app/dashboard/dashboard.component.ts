import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IncomeCardComponent } from './components/income-card/income-card.component';
import { ExpenseCardComponent } from './components/expense-card/expense-card.component';
import { BalanceCardComponent } from './components/balance-card/balance-card.component';
import { TransactionCountCardComponent } from './components/transaction-count-card/transaction-count-card.component';
import { ExpenseChartComponent } from './components/expense-chart/expense-chart.component';
import { IncomeExpenseBarChartComponent } from './components/income-expense-bar-chart/income-expense-bar-chart.component';
import { TransactionService } from '../shared/services/transaction.service';
import { CategoryService } from '../shared/services/category.service';
import { CurrencyService } from '../shared/services/currency.service';
import { BudgetService } from '../shared/services/budget.service';
import { DashboardService, DashboardStatistics } from '../shared/services/dashboard.service';
import { Transaction } from '../shared/models/transaction.model';
import { Category } from '../shared/models/category.model';
import { BudgetOverview } from '../shared/models/budget.model';
import { LoaderComponent } from '../shared/components/loader/loader.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IncomeCardComponent,
    ExpenseCardComponent,
    BalanceCardComponent,
    TransactionCountCardComponent,
    ExpenseChartComponent,
    IncomeExpenseBarChartComponent,
    LoaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  categories: Category[] = [];
  totalIncome = 0;
  totalExpenses = 0;
  balance = 0;
  totalTransactionCount = 0;
  incomeTransactionCount = 0;
  expenseTransactionCount = 0;
  currencySymbol = '$';
  isLoading = false;
  budgetOverview: BudgetOverview | null = null;
  dashboardStats: DashboardStatistics | null = null;
  
  private destroy$ = new Subject<void>();
  
  Math = Math; // Make Math available in template

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private budgetService: BudgetService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.currencySymbol = this.currencyService.getCurrentCurrency().symbol;
    this.loadCategories();
    this.loadTransactions();
    this.loadBudgetData();
    this.loadDashboardStatistics();
    
    // Listen for global transaction added events
    window.addEventListener('transactionAdded', () => {
      this.loadTransactions();
      this.loadDashboardStatistics();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
      }
    });
  }

  loadBudgetData() {
    this.budgetService.getBudgetOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (overview) => {
          this.budgetOverview = overview;
          // Update spent amount based on actual transactions
          this.updateBudgetWithTransactionData();
        },
        error: (error) => {
          console.error('Error loading budget overview:', error);
        }
      });
  }

  loadDashboardStatistics() {
    this.dashboardService.getDashboardStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.dashboardStats = stats;
          console.log('Dashboard statistics loaded:', stats);
        },
        error: (error) => {
          console.error('Error loading dashboard statistics:', error);
          // Set default values if API fails
          this.dashboardStats = {
            current_month: { income: 0, expenses: 0, balance: 0 },
            last_month: { income: 0, expenses: 0, balance: 0 },
            changes: { income_percentage: 0, expense_percentage: 0, income_direction: 'up', expense_direction: 'up' },
            transaction_counts: { current_month: 0, last_month: 0, current_income_count: 0, current_expense_count: 0 }
          };
        }
      });
  }

  private updateBudgetWithTransactionData() {
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
      
      console.log('Updated budget overview with transaction data:', this.budgetOverview);
    }
  }

  loadTransactions() {
    this.isLoading = true;
    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.calculateTotals();
        // Update budget data after transactions are loaded
        this.updateBudgetWithTransactionData();
        this.isLoading = false;
        console.log('Transactions loaded:', transactions.length, 'transactions');
        console.log('Transaction counts - Total:', this.totalTransactionCount, 'Income:', this.incomeTransactionCount, 'Expense:', this.expenseTransactionCount);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.transactions = [];
        this.calculateTotals();
        this.isLoading = false;
      }
    });
  }

  calculateTotals() {
    const incomeTransactions = this.transactions.filter(t => t.type === 'income');
    const expenseTransactions = this.transactions.filter(t => t.type === 'expense');
    
    this.totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    this.totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    this.balance = this.totalIncome - this.totalExpenses;
    
    // Calculate transaction counts
    this.totalTransactionCount = this.transactions.length;
    this.incomeTransactionCount = incomeTransactions.length;
    this.expenseTransactionCount = expenseTransactions.length;
  }

  // Budget helper methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getBudgetStatusClass(): string {
    if (!this.budgetOverview) return 'bg-gray-100 text-gray-800';
    const percentage = this.budgetOverview.percentageUsed || 0;
    
    if (percentage >= 95) {
      return 'bg-red-100 text-red-800';
    } else if (percentage >= 80) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  }

  getBudgetProgressClass(): string {
    if (!this.budgetOverview) return 'bg-gray-400';
    const percentage = this.budgetOverview.percentageUsed || 0;
    
    if (percentage >= 95) {
      return 'bg-red-500';
    } else if (percentage >= 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  }
}
