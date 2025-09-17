import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { loaderInterceptor } from './shared/interceptors/loader.interceptor';
import { externalApiInterceptor } from './shared/interceptors/external-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([externalApiInterceptor, loaderInterceptor])
    )
  ]
};
