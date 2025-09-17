import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_CONFIG } from '../utils/constants';

export interface DashboardStatistics {
  current_month: {
    income: number;
    expenses: number;
    balance: number;
  };
  last_month: {
    income: number;
    expenses: number;
    balance: number;
  };
  changes: {
    income_percentage: number;
    expense_percentage: number;
    income_direction: 'up' | 'down';
    expense_direction: 'up' | 'down';
  };
  transaction_counts: {
    current_month: number;
    last_month: number;
    current_income_count: number;
    current_expense_count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private apiService: ApiService) {}

  getDashboardStatistics(): Observable<DashboardStatistics> {
    return this.apiService.get<DashboardStatistics>(API_CONFIG.ENDPOINTS.DASHBOARD.STATISTICS);
  }
}