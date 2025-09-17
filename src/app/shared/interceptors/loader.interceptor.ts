import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const loaderService = inject(LoaderService);
  
  // Start loading
  loaderService.show();
  
  // Handle the request and hide loader when complete
  return next(req).pipe(
    finalize(() => {
      // Hide loading when request completes (success or error)
      loaderService.hide();
    })
  );
};
