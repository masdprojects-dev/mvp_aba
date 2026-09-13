import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  UserRole,
} from '../models/current-user.model';

import {
  AuthService,
} from '../services/auth.service';

import {
  UserSessionService,
} from '../services/user-session.service';


export const roleGuard: CanActivateFn =
  async (route) => {

    const authService =
      inject(AuthService);

    const userSession =
      inject(UserSessionService);

    const router =
      inject(Router);


    let user =
      userSession.currentUser;


    // Si Angular acaba de recargar,
    // restauramos primero la sesión.
    if (!user) {

      user =
        await authService.restoreSession();
    }


    // No está autenticado.
    if (!user) {

      return router.createUrlTree([
        '/login',
      ]);
    }


    const allowedRoles =
      route.data['roles'] as
        UserRole[] | undefined;


    // Si pusimos roleGuard pero olvidamos
    // configurar los roles, bloqueamos.
    if (
      !allowedRoles ||
      allowedRoles.length === 0
    ) {

      return router.createUrlTree([
        '/forbidden',
      ]);
    }


    if (
      !allowedRoles.includes(
        user.role,
      )
    ) {

      return router.createUrlTree([
        '/forbidden',
      ]);
    }


    return true;
  };