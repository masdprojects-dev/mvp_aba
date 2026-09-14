import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserSessionService } from '../services/user-session.service';


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


    // Si la página fue recargada,
    // restauramos la sesión desde Firebase.
    if (!user) {

      user =
        await authService.restoreSession();
    }


    // Sin sesión válida -> Login
    if (!user) {

      return router.createUrlTree([
        '/login',
      ]);
    }


    // Usuario autenticado, pero no administrador.
    if (user.is_admin !== true) {

      return router.createUrlTree([
        '/forbidden',
      ]);
    }


    return true;
  };