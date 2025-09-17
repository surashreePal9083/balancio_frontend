import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExternalApiService {
  constructor(private http: HttpClient) {}

  /**
   * Example method for calling external APIs
   * This will be handled by the externalApiInterceptor
   */
  
  // Example: Get exchange rates from an external API
  getExchangeRates(): Observable<any> {
    return this.http.get('https://api.exchangerate-api.com/v4/latest/USD');
  }

  // Example: Get placeholder image data
  getPlaceholderImage(width: number = 150, height: number = 150): Observable<Blob> {
    return this.http.get(`https://via.placeholder.com/${width}x${height}`, { 
      responseType: 'blob' 
    });
  }

  // Example: Get weather data (would require API key in real implementation)
  getWeatherData(city: string): Observable<any> {
    // This is just an example - would need actual API key
    return this.http.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}`);
  }

  // Example: Send data to external analytics service
  sendAnalytics(eventData: any): Observable<any> {
    return this.http.post('https://analytics.example.com/events', eventData);
  }

  // Example: Get public API data (no auth required)
  getPublicApiData(): Observable<any> {
    return this.http.get('https://jsonplaceholder.typicode.com/posts/1');
  }
}