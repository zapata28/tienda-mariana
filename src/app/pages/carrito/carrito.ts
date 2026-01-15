import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../cart.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoComponent {
  constructor(public cart: CartService) {}

  // ===== CONFIG ENVÍO =====
  envioBase = 12000;
  envioGratisDesde = 150000;

  // ===== DATOS CLIENTE =====
  cliente = {
    nombre: '',
    direccion: '',
    ciudad: '',
    correo: '',
    telefono: '',
    pago: '', // Nequi | Daviplata
  };

  // ===== TOTALES =====
  get subtotal(): number {
    return this.cart.subtotalSig();
  }

  get envio(): number {
    return this.subtotal >= this.envioGratisDesde ? 0 : this.envioBase;
  }

  get total(): number {
    return this.subtotal + this.envio;
  }

  // ===== WHATSAPP =====
  get whatsappLink(): string {
    const items = this.cart.itemsSig();

    const lineas = items.map(it => {
      const lineTotal = it.precio * it.qty;
      return `• ${it.nombre} x${it.qty} = ${this.money(lineTotal)}`;
    });

    const msg =
`Hola 👋 Quiero hacer este pedido:

👤 *DATOS DEL CLIENTE*
Nombre: ${this.cliente.nombre}
Dirección: ${this.cliente.direccion}
Ciudad: ${this.cliente.ciudad}
Correo: ${this.cliente.correo}
Teléfono: ${this.cliente.telefono}

💳 *MÉTODO DE PAGO*
${this.cliente.pago}

🛒 *PEDIDO*
${lineas.join('\n')}

Subtotal: ${this.money(this.subtotal)}
Envío: ${this.envio === 0 ? 'Gratis' : this.money(this.envio)}
Total: ${this.money(this.total)}

¿Me confirmas disponibilidad y tiempo de entrega?`;

    return `https://wa.me/573202507109?text=${encodeURIComponent(msg)}`;
  }

  finalizarWhatsApp() {
    const c = this.cliente;

    if (
      !c.nombre ||
      !c.direccion ||
      !c.ciudad ||
      !c.correo ||
      !c.telefono ||
      !c.pago
    ) {
      alert('Por favor completa todos los datos del pedido');
      return;
    }

    window.open(this.whatsappLink, '_blank', 'noopener');
  }

  money(v: number) {
    return v.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }
}
