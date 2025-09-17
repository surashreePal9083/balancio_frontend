export interface User {
  id: string;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string; // For compatibility with existing code
  lastName?: string;  // For compatibility with existing code
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  profile_picture?: string;
  bio?: string;
  monthly_budget_amount?: number;
  monthly_budget_currency?: string;
  budget_warning_threshold?: number;
  budget_critical_threshold?: number;
  email_notifications?: boolean;
  budget_alerts?: boolean;
  monthly_reports?: boolean;
  preferred_currency?: string;
  date_format_preference?: string;
  timezone_preference?: string;
  avatar?: string; // For compatibility
  settings?: {
    emailNotifications: boolean;
    budgetAlerts: boolean;
    monthlyReports: boolean;
    reportFormat?: string;
    twoFactorEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  created_at?: string; // Backend format
  updated_at?: string; // Backend format
}