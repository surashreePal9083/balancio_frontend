import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { User } from '../shared/models/user.model';
import { API_CONFIG } from '../shared/utils/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;

  constructor(private apiService: ApiService) {
    // Initialize currentUser from localStorage on service instantiation
    const token = localStorage.getItem('token');
    if (token) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
      }
    }
  }

  login(email: string, password: string): Observable<{ success: boolean; user?: User; message?: string }> {
    return this.apiService.login_signup<{ access: string; refresh: string; user: any; message: string }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password })
      .pipe(
        map(response => {
          localStorage.setItem('token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          
          // Map Django user response to our User interface
          this.currentUser = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.first_name || '',
            lastName: response.user.last_name || '',
            first_name: response.user.first_name,
            last_name: response.user.last_name,
            full_name: response.user.full_name,
            username: response.user.username,
            createdAt: new Date(response.user.created_at || Date.now()),
            updatedAt: new Date(response.user.updated_at || Date.now())
          };
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          return { success: true, user: this.currentUser };
        }),
        catchError(error => {
          console.error('Login error:', error);
          return of({ 
            success: false, 
            message: error.error?.message || error.message || 'Login failed' 
          });
        })
      );
  }

  signup(userData: any): Observable<{ success: boolean; user?: User; message?: string }> {
    return this.apiService.login_signup<{ access?: string; refresh?: string; user: any; message: string }>(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password
    }).pipe(
      map(response => {
        // Django signup might not return tokens immediately, handle both cases
        if (response.access) {
          localStorage.setItem('token', response.access);
          localStorage.setItem('refresh_token', response.refresh || '');
        }
        
        this.currentUser = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.first_name || userData.firstName,
          lastName: response.user.last_name || userData.lastName,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          full_name: response.user.full_name,
          username: response.user.username,
          createdAt: new Date(response.user.created_at || Date.now()),
          updatedAt: new Date(response.user.updated_at || Date.now())
        };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser, message: response.message };
      }),
      catchError(error => {
        console.error('Signup error:', error);
        return of({ 
          success: false, 
          message: error.error?.message || error.message || 'Signup failed' 
        });
      })
    );
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
      }
      return true;
    }
    return false;
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
      }
    }
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  loginWithGoogle(): Observable<{ success: boolean; user?: User; message?: string }> {
    return new Observable(observer => {
      const popup = this.apiService.openAuthPopup(API_CONFIG.ENDPOINTS.AUTH.GOOGLE, 'google-login');
      
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          const token = localStorage.getItem('token');
          if (token) {
            observer.next({ success: true });
          } else {
            observer.next({ success: false, message: 'Login cancelled' });
          }
          observer.complete();
        }
      }, 1000);
    });
  }

  loginWithGitHub(): Observable<{ success: boolean; user?: User; message?: string }> {
    return new Observable(observer => {
      const popup = this.apiService.openAuthPopup(API_CONFIG.ENDPOINTS.AUTH.GITHUB, 'github-login');
      
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          const token = localStorage.getItem('token');
          if (token) {
            observer.next({ success: true });
          } else {
            observer.next({ success: false, message: 'Login cancelled' });
          }
          observer.complete();
        }
      }, 1000);
    });
  }
}