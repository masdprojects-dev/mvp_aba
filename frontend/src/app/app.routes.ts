import { Routes } from '@angular/router';

import {
  authGuard,
  authChildGuard,
} from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',

    loadComponent: () =>
      import('./features/auth/login/login')
        .then((m) => m.Login),
  },

  {
    path: '',

    canActivate: [
      authGuard,
    ],

    canActivateChild: [
      authChildGuard,
    ],

    loadComponent: () =>
      import(
        './shared/layouts/main-layout/main-layout'
      ).then(
        (m) => m.MainLayout,
      ),

    children: [
      {
        path: 'kanban',

        loadComponent: () =>
          import(
            './features/kanban/kanban'
          ).then(
            (m) => m.Kanban,
          ),
      },
    ],
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];