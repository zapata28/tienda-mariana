import { Component, Input } from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="product-card">
      <img [src]="img" [alt]="name" />
      <h4>{{ name }}</h4>
      <p>{{ price | currency:'COP':'symbol':'1.0-0' }}</p>
      <button (click)="addToCart()">Añadir al carrito</button>
    </div>
  `,
  styles: [`
    .product-card {
      background: #fff;
      border-radius: 12px;
      padding: 15px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transition: transform 0.2s;
    }
    .product-card:hover { transform: translateY(-5px); }
    img { width: 100%; border-radius: 8px; }
    h4 { margin: 10px 0; font-size: 16px; color: #2f7d5a; }
    p { font-weight: bold; margin-bottom: 10px; }
    button {
      background-color: #2f7d5a;
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    button:hover { background-color: #256349; }
  `]
})
export class ProductCardComponent {
  @Input() name!: string;
  @Input() price!: number;
  @Input() img!: string;

  addToCart() {
    alert(`${this.name} agregado al carrito`);
  }
}
