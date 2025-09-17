# External API Interceptor Documentation

## Overview

The External API Interceptor is designed to handle HTTP requests to external APIs (non-internal APIs) with enhanced functionality including retry logic, timeout handling, error management, and automatic header configuration.

## Features

### 🔍 **Smart Request Detection**
- Only processes requests to external URLs (not to your internal API)
- Skips requests to `API_CONFIG.BASE_URL` and relative URLs
- Allows internal authentication and other interceptors to handle internal API calls

### 🔧 **Automatic Header Management**
```typescript
// Automatically adds these headers for external API calls:
{
  'User-Agent': 'Balancio-App/1.0',
  'Accept': 'application/json, text/plain, */*',
  'Cache-Control': 'no-cache',
  'Access-Control-Request-Headers': 'Content-Type, Authorization'
}
```

### ⏱️ **Timeout & Retry Logic**
- **30-second timeout** for all external API calls
- **Smart retry mechanism**:
  - Retries up to 2 times
  - Only retries on network errors (status 0) or server errors (5xx)
  - No retry for client errors (4xx) to avoid unnecessary requests

### 🚨 **Enhanced Error Handling**
Provides user-friendly notifications for different error types:

| Error Type | Status Code | User Notification |
|------------|-------------|-------------------|
| Network/CORS | 0 | "Network Error - Unable to connect to [service]" |
| Rate Limiting | 429 | "Rate Limit Exceeded - Too many requests" |
| Client Errors | 4xx | "External API Error - [status] [statusText]" |
| Server Errors | 5xx | "External Service Unavailable - Please try again later" |

### 🏷️ **Service Name Extraction**
Automatically extracts friendly service names from URLs for error messages:
- `https://api.github.com/users` → "github"
- `https://www.example.com/api` → "example"
- `https://jsonplaceholder.typicode.com/posts` → "jsonplaceholder"

## Usage Examples

### 1. Exchange Rate API
```typescript
// This will be handled by the external API interceptor
this.http.get('https://api.exchangerate-api.com/v4/latest/USD')
```

### 2. Weather API
```typescript
// External weather service call
this.http.get('https://api.openweathermap.org/data/2.5/weather?q=London')
```

### 3. Analytics Service
```typescript
// Send data to external analytics
this.http.post('https://analytics.example.com/events', eventData)
```

## Interceptor Order

The interceptors are executed in this order:
1. **[Auth Interceptor](auth.interceptor.ts)** - Handles internal API authentication
2. **[External API Interceptor](external-api.interceptor.ts)** - Handles external API calls
3. **[Loader Interceptor](loader.interceptor.ts)** - Shows/hides loading spinner

This order ensures:
- Internal APIs get authentication tokens
- External APIs get proper headers and error handling
- Loading states are managed for all requests

## Configuration

The interceptor is automatically registered in [`app.config.ts`](../app.config.ts):

```typescript
provideHttpClient(
  withInterceptors([authInterceptor, externalApiInterceptor, loaderInterceptor])
)
```

## Testing

Use the [`ExternalApiDemoComponent`](../shared/components/external-api-demo/external-api-demo.component.ts) to test the interceptor functionality:

1. **Exchange Rates Test** - Tests successful external API call
2. **Public API Test** - Tests JSONPlaceholder API (should work)
3. **Analytics Test** - Tests non-existent service (shows error handling)
4. **Weather Test** - Tests API without authentication (shows 401 handling)

## Benefits

✅ **Centralized External API Management**
- All external API calls automatically get proper headers
- Consistent error handling across the application
- No need to manually configure headers for each external service

✅ **Improved User Experience**
- User-friendly error messages instead of technical HTTP errors
- Automatic retry for transient failures
- Timeout protection prevents hanging requests

✅ **Developer Experience**
- No need to implement retry logic in each service
- Automatic error notifications
- Easy to extend with additional external API features

✅ **Performance & Reliability**
- Smart retry logic reduces failed requests
- Timeout prevents resource leaks
- Minimal impact on internal API performance

## Extending the Interceptor

To add new features:

1. **Custom Headers for Specific Services**:
```typescript
// Add API key for specific services
if (req.url.includes('api.example.com')) {
  headers = headers.set('X-API-Key', 'your-key-here');
}
```

2. **Rate Limiting**:
```typescript
// Add rate limiting logic
if (shouldRateLimit(req.url)) {
  return throwError(() => new Error('Rate limited'));
}
```

3. **Caching**:
```typescript
// Add response caching
if (shouldCache(req)) {
  // Implement caching logic
}
```

## Best Practices

1. **Always use the ExternalApiService** for external API calls
2. **Test error scenarios** using the demo component
3. **Monitor external API usage** through browser network tab
4. **Configure appropriate timeouts** for different service types
5. **Handle offline scenarios** in your components

## Troubleshooting

### Common Issues:

1. **CORS Errors**: The interceptor adds CORS headers, but the external service must also support CORS
2. **Timeout Issues**: 30-second timeout might be too short for slow APIs - adjust in interceptor
3. **Rate Limiting**: Some APIs have strict rate limits - implement exponential backoff if needed

### Debug Mode:

Enable console logging to see interceptor activity:
```typescript
console.log('External API request:', req.url);
```