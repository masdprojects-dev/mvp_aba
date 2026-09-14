import { Routes } from '@angular/router';

import { authGuard, authChildGuard } from './core/guards/auth.guard';

import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',

    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forbidden',

    loadComponent: () => import('./features/auth/forbidden/forbidden').then((m) => m.Forbidden),
  },

  {
    path: '',

    canActivate: [authGuard],

    canActivateChild: [authChildGuard],

    loadComponent: () =>
      import('./shared/layouts/main-layout/main-layout').then((m) => m.MainLayout),

    children: [
      {
        path: 'kanban',

        loadComponent: () => import('./features/kanban/kanban').then((m) => m.Kanban),
      },
      {
        path: 'admin',

        canActivate: [adminGuard],

        loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
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
