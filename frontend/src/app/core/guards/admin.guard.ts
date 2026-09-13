import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  AuthService,
} from '../services/auth.service';

import {
  UserSessionService,
} from '../services/user-session.service';


export const adminGuard: CanActivateFn =
  async () => {

    const authService =
      inject(AuthService);

    const userSession =
      inject(UserSessionService);

    const router =
      inject(Router);


    let user =
      userSession.currentUser;


    // Si se recargó la página,
    // intentamos recuperar la sesión de Firebase.
    if (!user) {

      user =
        await authService.restoreSession();
    }


    // Sin sesión -> login
    if (!user) {

      return router.createUrlTree([
        '/login',
      ]);
    }


    // Tiene sesión, pero no es administrador.
    if (!user.is_admin) {

      return router.createUrlTree([
        '/forbidden',
      ]);
    }


    return true;
  };