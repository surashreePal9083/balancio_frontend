export const APP_CONSTANTS = {
  APP_NAME: 'Finance Tracker',
  CURRENCY: 'USD',
  DATE_FORMAT: 'MM/dd/yyyy',
  TRANSACTION_TYPES: {
    INCOME: 'income',
    EXPENSE: 'expense'
  },
  COLORS: {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#06B6D4'
  }
};

// API Configuration
export const API_CONFIG = {
  // BASE_URL: 'https://balancio-backend.vercel.app/api',
  // You can add different environments here:
  // BASE_URL: 'http://localhost:8000/api',
  BASE_URL: 'balancio-backend-3kzs.vercel.app',
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: 'auth/login',
      SIGNUP: 'auth/signup',
      REFRESH: 'auth/refresh',
      VERIFY: 'auth/verify',
      GOOGLE: 'auth/google',
      GITHUB: 'auth/github',
      LOGOUT: 'auth/logout'
    },
    DASHBOARD: {
      STATISTICS: 'dashboard/statistics'
    },
    USERS: {
      PROFILE: 'users/profile',
      CHANGE_PASSWORD: 'users/change-password',
      SETTINGS: 'users/settings',
      AVATAR: 'users/avatar',
      ACTIVITY: 'users/activity',
      BUDGET: 'users/budget',
      BUDGET_OVERVIEW: 'users/budget/overview',
      BUDGET_ALERTS: 'users/budget/alerts'
    },
    TRANSACTIONS: {
      BASE: 'transactions',
      BY_ID: (id: string) => `transactions/${id}`,
      EXPORT: 'transactions/export',
      SUGGESTIONS: 'transactions/suggestions'
    },
    CATEGORIES: {
      BASE: 'categories',
      BY_ID: (id: string) => `categories/${id}`
    },
    REPORTS: {
      MONTHLY: 'reports/monthly',
      DOWNLOAD: (year: number, month: number) => `reports/monthly/${year}/${month}/download`
    },
    BUDGET: {
      BASE: 'budget',
      ALERTS: 'budget/alerts'
    }
  }
};