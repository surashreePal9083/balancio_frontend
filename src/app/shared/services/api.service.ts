import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../utils/constants';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) {}

  getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  }

  getFormDataHeaders(): HttpHeaders {
    // Don't set Content-Type for FormData - let browser set it with boundary
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  }

  // Core HTTP methods
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}/`, { headers: this.getHeaders() });
  }

  getBlob(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${endpoint}/`, { 
      responseType: 'blob',
      headers: this.getHeaders()
    });
  }

  getBlobWithResponse(endpoint: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${endpoint}/`, { 
      responseType: 'blob',
      observe: 'response',
      headers: this.getHeaders()
    });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}/`, data, { headers: this.getHeaders() });
  }
  login_signup<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}/`, data);
  }

  postFormData<T>(endpoint: string, data: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}/`, data, { headers: this.getFormDataHeaders() });
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}/`, data, { headers: this.getHeaders() });
  }

  putFormData<T>(endpoint: string, data: FormData): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}/`, data, { headers: this.getFormDataHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}/`, { headers: this.getHeaders() });
  }

  // Convenience methods for specific endpoints
  openAuthPopup(authUrl: string, windowName: string): Window | null {
    return window.open(
      `${this.baseUrl}/${authUrl}/`,
      windowName,
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  }

  // Get full URL for a given endpoint
  getFullUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}/`;
  }
}