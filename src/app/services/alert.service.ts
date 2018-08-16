import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {NavigationStart, Router} from '@angular/router';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class AlertService {

  private subject = new Subject<any>();
  private keepAfterNavigationChange = false;

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.keepAfterNavigationChange = false;
      } else {
        this.subject.next();
      }
    });
  }

  public getMessage(): Observable<any> {
    return null;
  }

}
