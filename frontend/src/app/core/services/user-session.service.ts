import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { CurrentUser } from '../models/current-user.model';

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  private readonly userSubject =
    new BehaviorSubject<CurrentUser | null>(null);

  readonly user$ = this.userSubject.asObservable();

  get currentUser(): CurrentUser | null {
    return this.userSubject.value;
  }

  setUser(user: CurrentUser): void {
    this.userSubject.next(user);
  }

  clearUser(): void {
    this.userSubject.next(null);
  }
}