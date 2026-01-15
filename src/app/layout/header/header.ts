import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';
import { CartService } from '../../cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent {

  // Estados de UI
  menuOpen: boolean = false;
  cartOpen: boolean = false;
  userMenuOpen: boolean = false;

  constructor(
    public auth: Auth,
    private router: Router,
    public cart: CartService
  ) {}

  /* ===============================
     SESIÓN
  ================================ */
  async salir(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/']);
    this.closeAll();
  }

  /* ===============================
     MENÚ CATEGORÍAS
  ================================ */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;

    if (this.menuOpen) {
      this.cartOpen = false;
      this.userMenuOpen = false;
    }
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  /* ===============================
     CARRITO
  ================================ */
  toggleCart(): void {
    this.cartOpen = !this.cartOpen;

    if (this.cartOpen) {
      this.menuOpen = false;
      this.userMenuOpen = false;
    }
  }

  closeCart(): void {
    this.cartOpen = false;
  }

  /* ===============================
     MENÚ USUARIO
  ================================ */
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;

    if (this.userMenuOpen) {
      this.menuOpen = false;
      this.cartOpen = false;
    }
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  /* ===============================
     CERRAR TODO
  ================================ */
  closeAll(): void {
    this.menuOpen = false;
    this.cartOpen = false;
    this.userMenuOpen = false;
  }
}
