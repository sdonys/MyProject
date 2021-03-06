import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError(err => {
        if (err.status === 401) {
          // auto log out if 401 response return form API
          this.authenticationService.logout();
          location.reload(true);
        }
        const error = err.error.message || err.statusText;
        return throwError(error);
      }));
  }


}
