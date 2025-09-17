import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExternalApiService } from '../../services/external-api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-external-api-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">External API Demo</h2>
      <p class="text-gray-600 mb-6">
        This demo shows how the external API interceptor handles requests to external services.
        The interceptor adds common headers, implements retry logic, and provides user-friendly error handling.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Exchange Rates Test -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2">Exchange Rates API</h3>
          <p class="text-sm text-gray-600 mb-3">Test external API call with retry and error handling</p>
          <button 
            (click)="testExchangeRates()"
            [disabled]="loading.exchangeRates"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
            {{ loading.exchangeRates ? 'Loading...' : 'Get Exchange Rates' }}
          </button>
          <div *ngIf="results.exchangeRates" class="mt-2 text-sm">
            <strong>Result:</strong> {{ results.exchangeRates.base }} rates loaded
          </div>
        </div>

        <!-- Public API Test -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2">Public API Test</h3>
          <p class="text-sm text-gray-600 mb-3">Test JSONPlaceholder API (should work)</p>
          <button 
            (click)="testPublicApi()"
            [disabled]="loading.publicApi"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50">
            {{ loading.publicApi ? 'Loading...' : 'Test Public API' }}
          </button>
          <div *ngIf="results.publicApi" class="mt-2 text-sm">
            <strong>Result:</strong> {{ results.publicApi.title }}
          </div>
        </div>

        <!-- Analytics Test (will fail) -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2">Analytics API Test</h3>
          <p class="text-sm text-gray-600 mb-3">Test non-existent analytics API (will show error handling)</p>
          <button 
            (click)="testAnalytics()"
            [disabled]="loading.analytics"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50">
            {{ loading.analytics ? 'Loading...' : 'Test Analytics (Will Fail)' }}
          </button>
          <div *ngIf="results.analytics" class="mt-2 text-sm">
            <strong>Result:</strong> {{ results.analytics }}
          </div>
        </div>

        <!-- Weather API Test (will fail without key) -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2">Weather API Test</h3>
          <p class="text-sm text-gray-600 mb-3">Test weather API without key (will show 401 error)</p>
          <button 
            (click)="testWeatherApi()"
            [disabled]="loading.weather"
            class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50">
            {{ loading.weather ? 'Loading...' : 'Test Weather API' }}
          </button>
          <div *ngIf="results.weather" class="mt-2 text-sm">
            <strong>Result:</strong> {{ results.weather }}
          </div>
        </div>
      </div>

      <div class="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 class="font-semibold mb-2">What the External API Interceptor Does:</h3>
        <ul class="text-sm space-y-1">
          <li>• Adds common headers (User-Agent, Accept, Cache-Control)</li>
          <li>• Implements 30-second timeout for external calls</li>
          <li>• Retries failed requests (2 attempts for 5xx errors)</li>
          <li>• Provides user-friendly error notifications</li>
          <li>• Handles CORS and network errors gracefully</li>
          <li>• Only processes external URLs (not internal API calls)</li>
        </ul>
      </div>
    </div>
  `
})
export class ExternalApiDemoComponent {
  loading = {
    exchangeRates: false,
    publicApi: false,
    analytics: false,
    weather: false
  };

  results = {
    exchangeRates: null as any,
    publicApi: null as any,
    analytics: null as any,
    weather: null as any
  };

  constructor(
    private externalApiService: ExternalApiService,
    private notificationService: NotificationService
  ) {}

  testExchangeRates(): void {
    this.loading.exchangeRates = true;
    this.results.exchangeRates = null;

    this.externalApiService.getExchangeRates().subscribe({
      next: (data: any) => {
        this.results.exchangeRates = data;
        this.loading.exchangeRates = false;
        this.notificationService.addNotification({
          title: 'Success',
          message: 'Exchange rates loaded successfully!',
          type: 'success'
        });
      },
      error: (error: any) => {
        this.loading.exchangeRates = false;
        // Error is already handled by the interceptor
      }
    });
  }

  testPublicApi(): void {
    this.loading.publicApi = true;
    this.results.publicApi = null;

    this.externalApiService.getPublicApiData().subscribe({
      next: (data: any) => {
        this.results.publicApi = data;
        this.loading.publicApi = false;
        this.notificationService.addNotification({
          title: 'Success',
          message: 'Public API data loaded successfully!',
          type: 'success'
        });
      },
      error: (error: any) => {
        this.loading.publicApi = false;
        // Error is already handled by the interceptor
      }
    });
  }

  testAnalytics(): void {
    this.loading.analytics = true;
    this.results.analytics = null;

    this.externalApiService.sendAnalytics({ event: 'test', timestamp: new Date() }).subscribe({
      next: (data: any) => {
        this.results.analytics = 'Success';
        this.loading.analytics = false;
      },
      error: (error: any) => {
        this.results.analytics = 'Failed (as expected)';
        this.loading.analytics = false;
        // Error is already handled by the interceptor
      }
    });
  }

  testWeatherApi(): void {
    this.loading.weather = true;
    this.results.weather = null;

    this.externalApiService.getWeatherData('London').subscribe({
      next: (data: any) => {
        this.results.weather = 'Success';
        this.loading.weather = false;
      },
      error: (error: any) => {
        this.results.weather = 'Failed (no API key)';
        this.loading.weather = false;
        // Error is already handled by the interceptor
      }
    });
  }
}