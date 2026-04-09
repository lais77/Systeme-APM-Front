import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      // Redirection par défaut
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },

      // Reporting → dashboard/reporting
      {
        path: 'reporting',
        loadComponent: () =>
          import('./features/dashboard/reporting/reporting.component').then(m => m.ReportingComponent)
      },

      // Admin
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      },

      // Plans usine → plans/
      {
        path: 'plans-usine',
        loadComponent: () =>
          import('./features/plans/plans-usine/plans-usine.component').then(m => m.PlansUsineComponent)
      },

      // Mes plans → plans/mes-plans
      {
        path: 'mes-plans',
        loadComponent: () =>
          import('./features/plans/mes-plans/mes-plans.component').then(m => m.MesPlansComponent)
      },

      // Plans (routes internes gardées)
      {
        path: 'plans',
        loadChildren: () =>
          import('./features/plans/plans.routes').then(m => m.PLANS_ROUTES)
      },

      // Mes actions → actions/mes-actions
      {
        path: 'mes-actions',
        loadComponent: () =>
          import('./features/actions/mes-actions/mes-actions.component').then(m => m.MesActionsComponent)
      },

      // Actions (routes internes gardées)
      {
        path: 'actions',
        loadChildren: () =>
          import('./features/actions/actions.routes').then(m => m.ACTIONS_ROUTES)
      },

      // Notifications
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then(m => m.NOTIFICATIONS_ROUTES)
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/support/support.component').then(m => m.SupportComponent)
      },
    ]
  },

  // Wildcard — redirige vers dashboard et non auth/login
  { path: '**', redirectTo: 'dashboard' }
];