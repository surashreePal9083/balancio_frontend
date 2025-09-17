import { Injectable } from '@angular/core';
import { Observable, map, catchError, retry, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';
import { API_CONFIG } from '../utils/constants';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  private handleError(error: any): Observable<never> {
    console.error('UserService Error:', error);
    return throwError(() => error);
  }

  private mapUserResponse(user: any): User {
    // console.log('Raw user response from API:', user); // Debug log - uncomment if needed
    
    // Handle different naming conventions from backend
    const firstName = user.firstName || user.first_name || user.name?.split(' ')[0] || '';
    const lastName = user.lastName || user.last_name || user.name?.split(' ').slice(1).join(' ') || '';
    
    // Handle different date field names and formats
    let createdAt = new Date();
    if (user.createdAt) {
      createdAt = new Date(user.createdAt);
    } else if (user.created_at) {
      createdAt = new Date(user.created_at);
    }
    
    let updatedAt = new Date();
    if (user.updatedAt) {
      updatedAt = new Date(user.updatedAt);
    } else if (user.updated_at) {
      updatedAt = new Date(user.updated_at);
    }
    
    const mappedUser: User = {
      id: user._id || user.id,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      first_name: firstName, // Keep both for compatibility
      last_name: lastName,   // Keep both for compatibility
      full_name: `${firstName} ${lastName}`.trim(),
      username: user.username,
      phone_number: user.phone_number,
      date_of_birth: user.date_of_birth,
      profile_picture: user.profile_picture,
      bio: user.bio,
      avatar: user.avatar && user.avatar !== 'https://via.placeholder.com/150' ? user.avatar : undefined,
      settings: user.settings || {
        emailNotifications: user.email_notifications ?? true,
        budgetAlerts: user.budget_alerts ?? true,
        monthlyReports: user.monthly_reports ?? true,
        reportFormat: user.preferred_currency || 'excel',
        twoFactorEnabled: false
      },
      createdAt: createdAt,
      updatedAt: updatedAt,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    // console.log('Mapped user object:', mappedUser); // Debug log - uncomment if needed
    return mappedUser;
  }

  getCurrentUser(): Observable<User> {
    return this.apiService.get<any>(API_CONFIG.ENDPOINTS.USERS.PROFILE).pipe(
      retry(2),
      map(user => this.mapUserResponse(user)),
      catchError(this.handleError)
    );
  }

  updateUser(user: Partial<User>): Observable<User> {
    const payload: any = {};
    
    // Handle name fields - send both formats for backend compatibility
    if (user.firstName !== undefined) {
      payload.firstName = user.firstName;
      payload.first_name = user.firstName;
    }
    if (user.lastName !== undefined) {
      payload.lastName = user.lastName;
      payload.last_name = user.lastName;
    }
    if (user.firstName || user.lastName) {
      payload.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    
    if (user.email) {
      payload.email = user.email;
    }
    if (user.settings) {
      payload.settings = user.settings;
    }
    
    console.log('Sending user update payload:', payload); // Debug log
    
    return this.apiService.put<any>(API_CONFIG.ENDPOINTS.USERS.PROFILE, payload).pipe(
      map(response => {
        console.log('User update response:', response); // Debug log
        // Handle both direct user data and nested user data
        const userData = response.user || response;
        return this.mapUserResponse(userData);
      }),
      catchError(this.handleError)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.apiService.put<any>(API_CONFIG.ENDPOINTS.USERS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
      confirmPassword: newPassword  // Backend expects this field
    }).pipe(
      catchError(this.handleError)
    );
  }

  uploadAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.apiService.postFormData<any>(API_CONFIG.ENDPOINTS.USERS.AVATAR, formData).pipe(
      map(response => this.mapUserResponse(response.user)),
      catchError(this.handleError)
    );
  }

  deleteAvatar(): Observable<User> {
    return this.apiService.delete<any>(API_CONFIG.ENDPOINTS.USERS.AVATAR).pipe(
      map(response => this.mapUserResponse(response.user)),
      catchError(this.handleError)
    );
  }

  getUserActivity(limit: number = 10): Observable<any[]> {
    return this.apiService.get<any[]>(`${API_CONFIG.ENDPOINTS.USERS.ACTIVITY}?limit=${limit}`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  updateSettings(settings: Partial<User['settings']>): Observable<User> {
    console.log('Sending settings update:', settings); // Debug log
    
    return this.apiService.put<any>(API_CONFIG.ENDPOINTS.USERS.SETTINGS, settings).pipe(
      map(response => {
        console.log('Settings update response:', response); // Debug log
        // Handle both direct user data and nested user data
        const userData = response.user || response;
        return this.mapUserResponse(userData);
      }),
      catchError(this.handleError)
    );
  }
}