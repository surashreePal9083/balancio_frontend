import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Category } from '../models/category.model';
import { API_CONFIG } from '../utils/constants';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(
    private apiService: ApiService
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
      })))
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
      }))
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
      }))
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
      }))
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(API_CONFIG.ENDPOINTS.CATEGORIES.BY_ID(id));
  }
}