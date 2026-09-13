import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  CurrentUser,
  UserRole,
} from '../../../core/models/current-user.model';

import { UserSessionService } from '../../../core/services/user-session.service';

@Component({
  selector: 'app-navbar',
  imports: [
    NgIf,
    AsyncPipe,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly userSessionService = inject(UserSessionService);

  readonly user$ = this.userSessionService.user$;

  canViewSales(user: CurrentUser): boolean {
    return this.hasRole(user, [
      'ADMIN',
      'MANAGER',
      'ADVISOR',
      'MARKETING',
    ]);
  }

  canViewInventory(user: CurrentUser): boolean {
    return this.hasRole(user, [
      'ADMIN',
      'MANAGER',
      'ADVISOR',
    ]);
  }

  canViewOperations(user: CurrentUser): boolean {
    return this.hasRole(user, [
      'ADMIN',
      'MANAGER',
    ]);
  }

  canViewAdministration(user: CurrentUser): boolean {
    return user.is_admin || user.role === 'ADMIN';
  }

  private hasRole(
    user: CurrentUser,
    roles: UserRole[],
  ): boolean {
    return roles.includes(user.role);
  }
}