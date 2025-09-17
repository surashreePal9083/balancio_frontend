import { Injectable } from '@angular/core';
import { Observable, map, tap, catchError, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { Transaction } from '../models/transaction.model';
import { API_CONFIG } from '../utils/constants';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  getTransactions(): Observable<Transaction[]> {
    return this.apiService.get<any>(API_CONFIG.ENDPOINTS.TRANSACTIONS.BASE).pipe(
      map((response: any) => {
        // Handle both paginated and non-paginated responses
        const transactions = response.results || response;
        return transactions.map((t: any) => ({
          id: t.id || t._id,
          amount: t.amount,
          title: t.title || '',
          type: t.type,
          categoryId: t.category || t.categoryId, // Handle Django response format
          description: t.description || '',
          date: new Date(t.date),
          userId: t.user || t.userId,
          createdAt: new Date(t.created_at || t.createdAt || Date.now()),
          updatedAt: new Date(t.updated_at || t.updatedAt || Date.now())
        }));
      })
    );
  }

  getTransaction(id: string): Observable<Transaction> {
    return this.apiService.get<any>(API_CONFIG.ENDPOINTS.TRANSACTIONS.BY_ID(id)).pipe(
      map(t => ({
        id: t._id,
        amount: t.amount,
        title: t.title || '',
        type: t.type,
        categoryId: t.categoryId,
        description: t.description || '',
        date: new Date(t.date),
        userId: t.userId,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }))
    );
  }

  createTransaction(transaction: any): Observable<Transaction> {
    // Handle both old interface (with categoryId) and new format (with category)
    const payload = {
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category || transaction.categoryId, // Backend expects 'category'
      description: transaction.description,
      date: transaction.date
    };
    return this.apiService.post<any>(API_CONFIG.ENDPOINTS.TRANSACTIONS.BASE, payload).pipe(
      map(t => ({
        id: t.id || t._id,
        amount: t.amount,
        title: t.title || '',
        type: t.type,
        categoryId: t.category || t.categoryId, // Map back to frontend format
        description: t.description || '',
        date: new Date(t.date),
        userId: t.user || t.userId,
        createdAt: new Date(t.created_at || t.createdAt),
        updatedAt: new Date(t.updated_at || t.updatedAt)
      })),
      tap(t => {
        this.notificationService.addNotification({
          title: `${t.type === 'income' ? 'Income' : 'Expense'} Added`,
          message: `${t.title} - $${t.amount}`,
          type: t.type === 'income' ? 'success' : 'info'
        });
      })
    );
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    const payload = {
      ...(transaction.title && { title: transaction.title }),
      ...(transaction.amount && { amount: transaction.amount }),
      ...(transaction.type && { type: transaction.type }),
      ...(transaction.categoryId && { categoryId: transaction.categoryId }),
      ...(transaction.description && { description: transaction.description }),
      ...(transaction.date && { date: transaction.date })
    };
    return this.apiService.put<any>(API_CONFIG.ENDPOINTS.TRANSACTIONS.BY_ID(id), payload).pipe(
      map(t => ({
        id: t._id,
        amount: t.amount,
        title: t.title || '',
        type: t.type,
        categoryId: t.categoryId,
        description: t.description || '',
        date: new Date(t.date),
        userId: t.userId,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }))
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.apiService.delete<void>(API_CONFIG.ENDPOINTS.TRANSACTIONS.BY_ID(id)).pipe(
      tap(() => {
        this.notificationService.addNotification({
          title: 'Transaction Deleted',
          message: 'Transaction has been successfully removed',
          type: 'info'
        });
      })
    );
  }

  exportTransactions(fileType: string): Observable<Blob> {
    return this.apiService.getBlob(`${API_CONFIG.ENDPOINTS.TRANSACTIONS.EXPORT}?fileType=${fileType}`);
  }

  // Get transaction suggestions from API
  getTransactionSuggestions(type: string, query?: string): Observable<string[]> {
    let url = `${API_CONFIG.ENDPOINTS.TRANSACTIONS.SUGGESTIONS}?type=${type}`;
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }
    
    return this.apiService.get<{suggestions: string[]}>(url).pipe(
      map(response => response.suggestions || [])
    );
  }
}