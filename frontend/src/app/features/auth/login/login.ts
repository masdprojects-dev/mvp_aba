import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

async login(): Promise<void> {

  if (
    !this.email.trim() ||
    !this.password
  ) {

    this.errorMessage =
      'Ingresa tu correo electrónico y contraseña.';

    return;
  }


  this.loading = true;

  this.errorMessage = '';


  try {

    await this.authService.login(
      this.email.trim(),
      this.password,
    );


    await this.router.navigateByUrl(
      '/kanban',
    );

  } catch (error: any) {

    this.errorMessage =
      this.getErrorMessage(
        error,
      );

  } finally {

    this.loading = false;
  }
}

private getErrorMessage(
  error: any,
): string {

  switch (error?.code) {

    case 'auth/invalid-credential':
      return 'Correo electrónico o contraseña incorrectos.';

    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';

    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta nuevamente más tarde.';

    case 'auth/network-request-failed':
      return 'No fue posible conectar con el servidor.';
  }


  switch (error?.message) {

    case 'USER_PROFILE_NOT_FOUND':
      return 'Tu cuenta no tiene un perfil configurado en el CRM.';

    case 'USER_PROFILE_AMBIGUOUS':
      return 'Tu cuenta tiene más de un perfil asociado.';

    case 'USER_INACTIVE':
      return 'Tu cuenta se encuentra desactivada.';

    case 'USER_ROLE_INVALID':
      return 'Tu cuenta tiene un rol no válido.';

    case 'ROLE_NOT_FOUND':
      return 'No se encontró la configuración de tu rol.';
  }


  return 'No fue posible iniciar sesión.';
}
}