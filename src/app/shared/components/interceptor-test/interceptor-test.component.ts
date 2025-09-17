import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../../auth/auth.service';
import { API_CONFIG } from '../../utils/constants';

@Component({
  selector: 'app-interceptor-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">🔍 Interceptor Test & Debug</h2>
      <p class="text-gray-600 mb-6">
        Use this component to test if the authentication interceptor is working properly.
        Open browser console (F12) to see detailed logs.
      </p>

      <!-- Token Status -->
      <div class="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 class="font-semibold mb-2">Current Authentication Status</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Token exists:</strong> 
            <span [class]="tokenExists ? 'text-green-600' : 'text-red-600'">
              {{ tokenExists ? 'YES' : 'NO' }}
            </span>
          </div>
          <div>
            <strong>User authenticated:</strong> 
            <span [class]="isAuthenticated ? 'text-green-600' : 'text-red-600'">
              {{ isAuthenticated ? 'YES' : 'NO' }}
            </span>
          </div>
          <div class="md:col-span-2" *ngIf="tokenPreview">
            <strong>Token preview:</strong> 
            <code class="bg-gray-200 px-2 py-1 rounded text-xs">{{ tokenPreview }}</code>
          </div>
        </div>
      </div>

      <!-- Test Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        <!-- Test Auth Endpoint (No Token Expected) -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2 text-blue-600">🔐 Test Auth Endpoint</h3>
          <p class="text-sm text-gray-600 mb-3">
            This should NOT include Authorization header
          </p>
          <button 
            (click)="testAuthEndpoint()"
            [disabled]="loadingAuth"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 w-full">
            {{ loadingAuth ? 'Testing...' : 'Test /auth/login' }}
          </button>
          <div *ngIf="authResult" class="mt-2 text-xs p-2 rounded" 
               [class]="authResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
            {{ authResult.message }}
          </div>
        </div>

        <!-- Test Protected Endpoint (Token Expected) -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2 text-green-600">🛡️ Test Protected Endpoint</h3>
          <p class="text-sm text-gray-600 mb-3">
            This SHOULD include Authorization header
          </p>
          <button 
            (click)="testProtectedEndpoint()"
            [disabled]="loadingProtected"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 w-full">
            {{ loadingProtected ? 'Testing...' : 'Test /users/profile' }}
          </button>
          <div *ngIf="protectedResult" class="mt-2 text-xs p-2 rounded"
               [class]="protectedResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
            {{ protectedResult.message }}
          </div>
        </div>

        <!-- Test External API (No Token Expected) -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2 text-purple-600">🌐 Test External API</h3>
          <p class="text-sm text-gray-600 mb-3">
            External API should skip auth interceptor
          </p>
          <button 
            (click)="testExternalApi()"
            [disabled]="loadingExternal"
            class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 w-full">
            {{ loadingExternal ? 'Testing...' : 'Test External API' }}
          </button>
          <div *ngIf="externalResult" class="mt-2 text-xs p-2 rounded"
               [class]="externalResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
            {{ externalResult.message }}
          </div>
        </div>

        <!-- Manual Token Test -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-2 text-orange-600">🔧 Manual Token Test</h3>
          <p class="text-sm text-gray-600 mb-3">
            Set/clear token manually for testing
          </p>
          <div class="space-y-2">
            <button 
              (click)="setTestToken()"
              class="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm w-full">
              Set Test Token
            </button>
            <button 
              (click)="clearToken()"
              class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm w-full">
              Clear Token
            </button>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-semibold mb-2 text-blue-800">📋 Testing Instructions</h3>
        <ol class="text-sm text-blue-700 space-y-1">
          <li>1. Open browser console (F12 → Console tab)</li>
          <li>2. Click test buttons above to trigger API calls</li>
          <li>3. Watch console for "Auth Interceptor" debug messages</li>
          <li>4. Check Network tab to verify Authorization headers</li>
          <li>5. Expected behavior:
            <ul class="ml-4 mt-1 space-y-1">
              <li>• Auth endpoints: NO Authorization header</li>
              <li>• Protected endpoints: YES Authorization header (if token exists)</li>
              <li>• External APIs: Handled by external interceptor</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  `
})
export class InterceptorTestComponent {
  tokenExists = false;
  isAuthenticated = false;
  tokenPreview = '';

  loadingAuth = false;
  loadingProtected = false;
  loadingExternal = false;

  authResult: { success: boolean; message: string } | null = null;
  protectedResult: { success: boolean; message: string } | null = null;
  externalResult: { success: boolean; message: string } | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.updateTokenStatus();
  }

  updateTokenStatus(): void {
    const token = this.authService.getToken();
    this.tokenExists = !!token;
    this.isAuthenticated = this.authService.isAuthenticated();
    this.tokenPreview = token ? token.substring(0, 30) + '...' : '';
  }

  testAuthEndpoint(): void {
    this.loadingAuth = true;
    this.authResult = null;
    
    console.log('🔍 TESTING AUTH ENDPOINT - Should NOT include Authorization header');
    
    // Test login endpoint (should not include token)
    this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { 
      email: 'test@example.com', 
      password: 'testpass' 
    }).subscribe({
      next: (response) => {
        this.authResult = { 
          success: true, 
          message: 'Request sent successfully (check console logs)' 
        };
        this.loadingAuth = false;
      },
      error: (error) => {
        this.authResult = { 
          success: false, 
          message: `Expected error: ${error.status} - Check console for interceptor logs` 
        };
        this.loadingAuth = false;
      }
    });
  }

  testProtectedEndpoint(): void {
    this.loadingProtected = true;
    this.protectedResult = null;
    
    console.log('🔍 TESTING PROTECTED ENDPOINT - Should include Authorization header if token exists');
    
    // Test profile endpoint (should include token if available)
    this.apiService.get(API_CONFIG.ENDPOINTS.USERS.PROFILE).subscribe({
      next: (response) => {
        this.protectedResult = { 
          success: true, 
          message: 'Protected endpoint accessed successfully!' 
        };
        this.loadingProtected = false;
      },
      error: (error) => {
        const message = error.status === 401 
          ? 'Auth error (expected if no valid token) - Check console logs'
          : `Error ${error.status} - Check console for interceptor logs`;
        this.protectedResult = { 
          success: false, 
          message 
        };
        this.loadingProtected = false;
      }
    });
  }

  testExternalApi(): void {
    this.loadingExternal = true;
    this.externalResult = null;
    
    console.log('🔍 TESTING EXTERNAL API - Should be handled by external interceptor');
    
    // Test external API (should skip auth interceptor)
    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then(response => response.json())
      .then(data => {
        this.externalResult = { 
          success: true, 
          message: 'External API call successful - Check console for interceptor logs' 
        };
        this.loadingExternal = false;
      })
      .catch(error => {
        this.externalResult = { 
          success: false, 
          message: 'External API failed - Check console for logs' 
        };
        this.loadingExternal = false;
      });
  }

  setTestToken(): void {
    const testToken = 'test-jwt-token-' + Date.now();
    localStorage.setItem('token', testToken);
    console.log('🔧 Test token set:', testToken);
    this.updateTokenStatus();
  }

  clearToken(): void {
    localStorage.removeItem('token');
    console.log('🔧 Token cleared');
    this.updateTokenStatus();
  }
}