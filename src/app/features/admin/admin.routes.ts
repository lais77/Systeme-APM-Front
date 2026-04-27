import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'departements',
    loadComponent: () =>
      import('./departements/departements.component').then(m => m.DepartementsComponent)
  },
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  }
];