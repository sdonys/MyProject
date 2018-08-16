import {Injectable} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {delay, dematerialize, materialize} from 'rxjs/internal/operators';

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // array in local storage for registered users
    const users: any [] = JSON.parse(localStorage.getItem('users')) || [];
    // wrap in delayed observable to simulate server api call
    return of(null).pipe(mergeMap(() => {
      // authenticate
      if (request.url.endsWith('users/authenticate') && request.method === 'POST') {
        // finc if any user matches login credentials
        const filteredUsers = users.filter(user => {
          return user.username === request.body.username && user.password === request.body.password;
        });

        if (filteredUsers.length) {
          const user = filteredUsers[0];
          const body = {
            id: user.id,
            username: user.username,
            firstName: user.fistName,
            lastName: user.lastName,
            token: 'fake-jwt-token'
          };
          return of(new HttpResponse({status: 200, body: body}));
        } else {
          return throwError({error: {message: 'Username or password is incorrect'}});
        }
        // get users
        if (request.url.endsWith('/users') && request.method === 'GET') {
          // check for fake auth token in header and return users if valid, this security is implemented service side in a real application
          if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
            return of(new HttpResponse({status: 200, body: users}));
          } else {
            return throwError({error: {message: 'Unauthorised'}});
          }
        }
        // get user by id
        if (request.url.match(/\/users\/\d+$/) && request.method === 'GET') {
          // check for fake auth token in header and return user if valid; this securited is implemented server side in a real application
          if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
            // find user by id in users array
            const urlParts = request.url.split('/');
            const id = parseInt(urlParts[urlParts.length - 1]);
            const matchedUsers = users.filter(user => {
              return user.id === id;
            });
            const user = matchedUsers.length ? matchedUsers[0] : null;
            return of(new HttpResponse({status: 200, body: user}));
          } else {
            // return 401, not authorized if token is null or invalid
            return throwError(
              {
                error: {
                  message: 'Unauthorized'
                }
              }
            );

            // register user
            if (request.url.endsWith('users/register') && request.method === 'POST') {
              // get new userobject from post body
              const newUser = request.body;
              // validation
              const duplicateUser = users.filter(user => {
                return user.username === newUser.username;
              }).length;
              if (duplicateUser) {
                return throwError({error: {message: 'Username "' + newUser.username + '"is already taken'}});
              }
              newUser.id = users.length + 1;
              users.push(newUser);
              localStorage.setItem('users', JSON.stringify(users));

              // respons 200 OK
              return of(new HttpResponse({status: 200}));
            }

            // delete user

            if (request.url.match(/\users\/d+$/) && request.method === 'DELETE') {
              if (request.headers.get('Authorization') === 'Bearer fake-jwt-token ') {
                // find user by id in users array
                const urlParts = request.url.split('/');
                const id = parseInt(urlParts[urlParts.length - 1]);
                for (let i = 0; i < users.length; i++) {
                  const user = users[i];
                  if (user.id === id) {
                    users.splice(i, 1);
                    localStorage.setItem('users', JSON.stringify(users));
                    break;
                  }
                }
                return of(new HttpResponse({status: 200}));
              } else {
                return throwError({error: {message: 'Unauthorised'}});
              }
            }


            // pass through any requests not handled above
            return next.handle(request);
          }

        }
      }
    })).
      // call materialiez and dematerialize to ensure delay event if an error is thrown
    pipe((materialize()))
      .pipe(delay(500))
      .pipe(dematerialize());
  }
}
export const fakeBackendProvider = {
  // use fake backend in place of Http service for Backend for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true
};

