import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { loaderInterceptor } from './shared/interceptors/loader.interceptor';
import { externalApiInterceptor } from './shared/interceptors/external-api.interceptor';
import { errorInterceptor } from './shared/interceptors/error.interceptor';
import { GlobalErrorHandlerService } from './shared/services/global-error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([errorInterceptor, externalApiInterceptor, loaderInterceptor])
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService }
  ]
};
