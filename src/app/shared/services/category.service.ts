import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { ToastNotificationService } from './toast-notification.service';
import { Category } from '../models/category.model';
import { API_CONFIG } from '../utils/constants';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(
    private apiService: ApiService,
    private toastService: ToastNotificationService
  ) {}

  getCategories(): Observable<Category[]> {
    return this.apiService.get<any[]>(API_CONFIG.ENDPOINTS.CATEGORIES.BASE).pipe(
      map(categories => categories.map(c => ({
        id: String(c.id), // Convert Django integer ID to string for frontend consistency
        name: c.name,
        color: c.color,
        icon: c.icon || 'category',
        type: c.type,
        user: c.user,
        userId: String(c.user), // For compatibility
        createdAt: new Date(c.created_at || c.createdAt),
        updatedAt: new Date(c.updated_at || c.updatedAt),
        created_at: c.created_at, // Backend format
        updated_at: c.updated_at // Backend format
      }))),
      catchError((error) => {
        console.error('Error fetching categories:', error);
        this.toastService.error(
          'Failed to Load Categories',
          'Unable to fetch categories. Please try again later.'
        );
        return throwError(() => error);
      })
    );
  }

  getCategory(id: string): Observable<Category> {
    return this.apiService.get<any>(API_CONFIG.ENDPOINTS.CATEGORIES.BY_ID(id)).pipe(
      map(c => ({
        id: String(c.id), // Convert Django integer ID to string for frontend consistency
        name: c.name,
        color: c.color,
        icon: c.icon || 'category',
        type: c.type,
        user: c.user,
        userId: String(c.user), // For compatibility
        createdAt: new Date(c.created_at || c.createdAt),
        updatedAt: new Date(c.updated_at || c.updatedAt),
        created_at: c.created_at, // Backend format
        updated_at: c.updated_at // Backend format
      })),
      catchError((error) => {
        console.error(`Error fetching category ${id}:`, error);
        this.toastService.error(
          'Failed to Load Category',
          'Unable to fetch category details. Please try again later.'
        );
        return throwError(() => error);
      })
    );
  }

  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Observable<Category> {
    const payload = {
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    };
    return this.apiService.post<any>(API_CONFIG.ENDPOINTS.CATEGORIES.BASE, payload).pipe(
      map(c => ({
        id: String(c.id), // Convert Django integer ID to string for frontend consistency
        name: c.name,
        color: c.color,
        icon: c.icon || 'category',
        type: c.type,
        user: c.user,
        userId: String(c.user), // For compatibility
        createdAt: new Date(c.created_at || c.createdAt),
        updatedAt: new Date(c.updated_at || c.updatedAt),
        created_at: c.created_at, // Backend format
        updated_at: c.updated_at // Backend format
      })),
      catchError((error) => {
        console.error('Error creating category:', error);
        let errorMessage = 'Unable to create category. Please try again later.';
        
        // Handle specific error cases
        if (error.status === 400) {
          errorMessage = 'Invalid category data. Please check your input.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.toastService.error('Failed to Create Category', errorMessage);
        return throwError(() => error);
      })
    );
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    const payload = {
      ...(category.name && { name: category.name }),
      ...(category.type && { type: category.type }),
      ...(category.color && { color: category.color }),
      ...(category.icon && { icon: category.icon })
    };
    return this.apiService.put<any>(API_CONFIG.ENDPOINTS.CATEGORIES.BY_ID(id), payload).pipe(
      map(c => ({
        id: String(c.id), // Convert Django integer ID to string for frontend consistency
        name: c.name,
        color: c.color,
        icon: c.icon || 'category',
        type: c.type,
        user: c.user,
        userId: String(c.user), // For compatibility
        createdAt: new Date(c.created_at || c.createdAt),
        updatedAt: new Date(c.updated_at || c.updatedAt),
        created_at: c.created_at, // Backend format
        updated_at: c.updated_at // Backend format
      })),
      catchError((error) => {
        console.error(`Error updating category ${id}:`, error);
        let errorMessage = 'Unable to update category. Please try again later.';
        
        // Handle specific error cases
        if (error.status === 400) {
          errorMessage = 'Invalid category data. Please check your input.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (error.status === 404) {
          errorMessage = 'Category not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.toastService.error('Failed to Update Category', errorMessage);
        return throwError(() => error);
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(API_CONFIG.ENDPOINTS.CATEGORIES.BY_ID(id)).pipe(
      catchError((error) => {
        console.error(`Error deleting category ${id}:`, error);
        let errorMessage = 'Unable to delete category. Please try again later.';
        
        // Handle specific error cases
        if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (error.status === 404) {
          errorMessage = 'Category not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.toastService.error('Failed to Delete Category', errorMessage);
        return throwError(() => error);
      })
    );
  }
}