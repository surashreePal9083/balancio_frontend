export interface Transaction {
  id: string;
  amount: number;
  title: string;
  type: 'income' | 'expense';
  category?: number | string;
  categoryId?: string; // For compatibility
  category_name?: string; // From backend
  category_color?: string; // From backend
  description?: string;
  date: Date | string;
  user?: number | string;
  userId?: string; // For compatibility
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: string; // Backend format
  updated_at?: string; // Backend format
}