import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';
import { noAuthGuard } from './auth/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home),
  },

  {
    path: 'categoria/:slug',
    loadComponent: () =>
      import('./pages/categoria/categoria').then(m => m.Categoria),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
    canActivate: [noAuthGuard],
  },

  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin').then(m => m.Admin),
    canActivate: [authGuard],
  },

  {
    path: 'carrito',
    loadComponent: () =>
      import('./pages/carrito/carrito').then(m => m.CarritoComponent),
  },

  {
    path: 'producto/:id',
    loadComponent: () =>
      import('./pages/producto/producto').then(m => m.Producto),
  },

  { path: '**', redirectTo: '' },
];
