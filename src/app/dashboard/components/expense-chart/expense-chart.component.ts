import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service';
import { CurrencyService } from '../../../shared/services/currency.service';
import { ApiService } from '../../../shared/services/api.service';
import { API_CONFIG } from '../../../shared/utils/constants';
import { Transaction } from '../../../shared/models/transaction.model';

declare var ApexCharts: any;

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-chart.component.html'
})
export class ExpenseChartComponent implements OnChanges, AfterViewInit {
  @Input() transactions: Transaction[] = [];
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  private chart!: ApexCharts;

  totalIncome = 0;
  totalExpenses = 0;
  balance = 0;
  categories: any[] = [];
  currencySymbol: string = '₹';

  colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private currencyService: CurrencyService,
    private apiService: ApiService
  ) {}

  ngAfterViewInit() {
    this.currencySymbol = this.currencyService.getCurrentCurrency().symbol;
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.get<any[]>(API_CONFIG.ENDPOINTS.CATEGORIES.BASE).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.initChart();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
        this.initChart();
      }
    });
  }

  ngOnChanges() {
    this.processExpenseData();
    if (this.chart) {
      this.updateChart();
    }
  }

  private async initChart() {
    const ApexCharts = (await import('apexcharts')).default;
    
    const options = {
      series: [100],
      chart: {
        type: 'donut',
        height: 280,
        toolbar: {
          show: false
        }
      },
      labels: ['No Data'],
      colors: ['#E5E7EB'],
      legend: {
        position: 'right',
        offsetY: 0,
        height: 230,
        fontSize: '12px',
        markers: {
          width: 8,
          height: 8
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '11px'
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                showAlways: true,
                label: 'Total Expenses',
                fontSize: '14px',
                formatter: () => {
                  return this.currencySymbol + this.totalExpenses.toLocaleString();
                }
              }
            }
          }
        }
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: {
              height: 200
            },
            legend: {
              position: 'bottom',
              fontSize: '10px',
              height: 'auto'
            },
            dataLabels: {
              style: {
                fontSize: '9px'
              }
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '70%',
                  labels: {
                    total: {
                      fontSize: '12px'
                    }
                  }
                }
              }
            }
          }
        },
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 240
            },
            legend: {
              position: 'bottom',
              fontSize: '11px'
            }
          }
        }
      ]
    };

    this.chart = new ApexCharts(this.chartContainer.nativeElement, options);
    await this.chart.render();
    
    this.updateChart();
  }

  processExpenseData() {
    if (!this.transactions || this.transactions.length === 0) {
      this.totalIncome = 0;
      this.totalExpenses = 0;
      this.balance = 0;
      return;
    }

    this.totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    this.balance = this.totalIncome - this.totalExpenses;
  }

  private updateChart() {
    if (!this.chart) return;
    
    if (!this.transactions || this.transactions.length === 0) {
      this.chart.updateOptions({
        series: [100],
        labels: ['No Data'],
        colors: ['#E5E7EB']
      });
      return;
    }

    const categoryTotals = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, expense) => {
        const categoryName = this.getCategoryName(expense.categoryId || '');
        acc.set(categoryName, (acc.get(categoryName) || 0) + expense.amount);
        return acc;
      }, new Map<string, number>());

    if (categoryTotals.size > 0) {
      this.chart.updateOptions({
        series: Array.from(categoryTotals.values()),
        labels: Array.from(categoryTotals.keys()),
        colors: this.colors.slice(0, categoryTotals.size)
      });
    } else {
      this.chart.updateOptions({
        series: [100],
        labels: ['No Expenses'],
        colors: ['#E5E7EB']
      });
    }
  }

  private getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }
}
