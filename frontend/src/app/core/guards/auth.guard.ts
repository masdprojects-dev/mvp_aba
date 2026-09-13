import { inject } from '@angular/core';

import {
  CanActivateFn,
  CanActivateChildFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserSessionService } from '../services/user-session.service';


async function validateSession(): Promise<boolean> {
  const authService = inject(AuthService);
  const userSession = inject(UserSessionService);
  const router = inject(Router);

  // Si ya tenemos al usuario cargado en memoria,
  // no necesitamos volver a consultar Firebase.
  if (userSession.currentUser) {
    return true;
  }

  // Al recargar la página, UserSessionService vuelve a null.
  // Firebase Auth, en cambio, puede conservar la sesión.
  const user =
    await authService.restoreSession();

  if (user) {
    return true;
  }

  await router.navigateByUrl('/login');

  return false;
}


export const authGuard: CanActivateFn =
  async () => validateSession();


export const authChildGuard: CanActivateChildFn =
  async () => validateSession();