export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  user?: number | string;
  userId?: string; // For compatibility
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: string; // Backend format
  updated_at?: string; // Backend format
}