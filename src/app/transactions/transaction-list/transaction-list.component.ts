import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../shared/services/transaction.service';
import { CategoryService } from '../../shared/services/category.service';
import { CurrencyService } from '../../shared/services/currency.service';
import { Transaction } from '../../shared/models/transaction.model';
import { Category } from '../../shared/models/category.model';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,LoaderComponent],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categories: Category[] = [];
  currencySymbol: string = '₹';
  isLoading = false;
  
  searchTerm = '';
  selectedCategory = '';
  selectedType = '';
  showActionsMenu: string | null = null;
  showAddModal = false;
  dateFrom = '';
  dateTo = '';
  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  newTransaction = {
    title: '',
    amount: 0,
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  };

  titleSuggestions: string[] = [];
  showSuggestions = false;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.currencySymbol = this.currencyService.getCurrentCurrency().symbol;
    this.loadCategories();

    // Close action menu when clicking outside
    document.addEventListener('click', () => {
      this.showActionsMenu = null;
    });
  }

  loadCategories() {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
        this.loadTransactions();
      }
    });
  }

  loadTransactions() {
    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions.map(t => {
          const category = this.categories.find(cat => cat.id === t.categoryId);
          return {
            ...t,
            title: t.description || t.title,
            category: category ? category.name : 'Unknown Category',
            amount: Number(t.amount)
          } as any;
        });
        this.filteredTransactions = [...this.transactions];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.transactions = [];
        this.filteredTransactions = [];
        this.isLoading = false;
      }
    });
  }

  getTotalIncome() {
    return this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpenses() {
    return this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }

  getNetTotal() {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  onSearch(event: any) {
    this.applyFilters();
  }

  onCategoryFilter(event: any) {
    this.applyFilters();
  }

  onTypeFilter(event: any) {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(t => {
      const matchesSearch = !this.searchTerm || (t as any).title?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = !this.selectedCategory || (t as any).category === this.selectedCategory;
      const matchesType = !this.selectedType || t.type === this.selectedType;
      
      // Date filtering
      let matchesDate = true;
      if (this.dateFrom || this.dateTo) {
        const transactionDate = new Date(t.date);
        if (this.dateFrom) {
          const fromDate = new Date(this.dateFrom);
          matchesDate = matchesDate && transactionDate >= fromDate;
        }
        if (this.dateTo) {
          const toDate = new Date(this.dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          matchesDate = matchesDate && transactionDate <= toDate;
        }
      }
      
      return matchesSearch && matchesCategory && matchesType && matchesDate;
    });
    
    // Apply sorting
    this.applySorting();
  }
  
  applySorting() {
    this.filteredTransactions.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'title':
          comparison = ((a as any).title || '').localeCompare((b as any).title || '');
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  onDateFilter() {
    this.applyFilters();
  }
  
  onSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.applySorting();
  }
  
  getSortText(field: string): string {
    if (this.sortBy !== field) return '↕';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }
  
  clearDateFilter() {
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  trackByTransactionId(index: number, transaction: any) {
    return transaction.id;
  }

  getAmountColor(transaction: any) {
    return transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  }

  getAmountDisplay(transaction: any) {
    const prefix = transaction.type === 'income' ? '+' : '-';
    return `${prefix}${this.currencySymbol}${transaction.amount.toFixed(2)}`;
  }

  getCategoryBadgeColor(category: string) {
    return 'bg-gray-100 text-gray-800';
  }

  getTypeBadgeColor(type: string) {
    return type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  toggleActionsMenu(id: string, event: Event) {
    event.stopPropagation();
    this.showActionsMenu = this.showActionsMenu === id ? null : id;
  }

  closeActionsMenu() {
    this.showActionsMenu = null;
  }

  editTransaction(id: string, event: Event) {
    event.stopPropagation();
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      const newTitle = prompt('Edit transaction title:', transaction.title);
      if (newTitle && newTitle.trim()) {
        const updateData = { title: newTitle.trim(), description: newTitle.trim() };
        this.transactionService.updateTransaction(id, updateData).subscribe({
          next: () => {
            this.loadTransactions();
          },
          error: (error) => {
            console.error('Error updating transaction:', error);
            alert('Failed to update transaction');
          }
        });
      }
    }
    this.closeActionsMenu();
  }

  deleteTransaction(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          alert('Failed to delete transaction');
        }
      });
    }
    this.closeActionsMenu();
  }

exportTransactions() {
  // Default to Excel export
  const fileType = 'excel'; // or 'pdf' - could be made dynamic if needed

  this.isLoading = true;
  this.transactionService.exportTransactions(fileType).subscribe({
    next: (response: Blob) => {
      this.isLoading = false;
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = fileType === 'excel' ? 'xlsx' : 'pdf';
      link.download = `transactions_export.${fileExtension}`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    error: (error) => {
      this.isLoading = false;
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  });
}

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetNewTransaction();
  }

  addTransaction() {
    if (!this.newTransaction.title || !this.newTransaction.amount || !this.newTransaction.category) {
      alert('Please fill in all required fields');
      return;
    }

    const transactionData: any = {
      title: this.newTransaction.title,
      description: this.newTransaction.title,
      amount: this.newTransaction.amount,
      type: this.newTransaction.type,
      categoryId: this.newTransaction.category,
      date: new Date(this.newTransaction.date)
    };
    
    this.transactionService.createTransaction(transactionData).subscribe({
      next: () => {
        this.loadTransactions();
        this.closeAddModal();
      },
      error: (error) => {
        console.error('Error creating transaction:', error);
        alert('Failed to create transaction');
      }
    });
  }

  resetNewTransaction() {
    this.newTransaction = {
      title: '',
      amount: 0,
      category: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    };
    this.showSuggestions = false;
  }

  onTitleInput(event: any) {
    const value = event.target.value;
    
    // Get suggestions from API based on transaction type and query
    if (value.length > 0) {
      this.transactionService.getTransactionSuggestions(this.newTransaction.type, value).subscribe({
        next: (suggestions) => {
          this.titleSuggestions = suggestions.slice(0, 5);
          this.showSuggestions = this.titleSuggestions.length > 0;
        },
        error: (error) => {
          console.error('Error fetching suggestions:', error);
          this.titleSuggestions = [];
          this.showSuggestions = false;
        }
      });
    } else {
      // Get recent transactions of the same type from API
      this.transactionService.getTransactionSuggestions(this.newTransaction.type).subscribe({
        next: (suggestions) => {
          this.titleSuggestions = suggestions.slice(0, 5);
          this.showSuggestions = this.titleSuggestions.length > 0;
        },
        error: (error) => {
          console.error('Error fetching suggestions:', error);
          this.titleSuggestions = [];
          this.showSuggestions = false;
        }
      });
    }
  }

  selectSuggestion(suggestion: string) {
    this.newTransaction.title = suggestion;
    this.showSuggestions = false;
  }

  onTypeChange() {
    this.showSuggestions = false;
    if (this.newTransaction.title) {
      this.onTitleInput({ target: { value: this.newTransaction.title } });
    }
  }
}