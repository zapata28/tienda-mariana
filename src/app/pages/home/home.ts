import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from './product-card/product-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {

  currentSlide = 0;

  slides = [
    {
      image: 'img/centella-ampoule.jpg',
      title: 'Espuma de ampolla de centella',
      text: `Es un limpiador facial suave y eficaz diseñado para limpiar
      la piel de impurezas sin agredirla. Está formulado con extracto de
      Centella Asiática, una planta conocida por sus propiedades calmantes
      y reparadoras.`,
      button: 'Ver producto',
    },
    {
      image: 'img/Mixsoon_Centella.jpg',
      title: 'Espuma limpiadora calmante para piel sensible',
      text: `Es una espuma limpiadora facial suave y eficaz, formulada con
      Centella Asiática, ideal para limpiar la piel en pocos segundos sin causar
      irritación.`,
      button: 'Explorar',
    },
    {
      image: 'img/slide3.jpg',
      title: 'Tu rutina empieza aquí',
      text: 'Mensaje promocional.',
      button: 'Ver todo',
    }
  ];

  ngOnInit(): void {
    setInterval(() => {
      this.currentSlide =
        (this.currentSlide + 1) % this.slides.length;
    }, 5000);
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }
  maquillaje = [
  { name: 'Base líquida', price: 120000, img: 'assets/img/base.jpg' },
  { name: 'BB Cream', price: 95000, img: 'assets/img/bb-cream.jpg' },
  { name: 'Corrector', price: 80000, img: 'assets/img/corrector.jpg' }
];

piel = [
  { name: 'Limpiador facial', price: 45000, img: 'assets/img/limpiador.jpg' },
  { name: 'Mascarilla', price: 60000, img: 'assets/img/mascarilla.jpg' }
];

capilar = [
  { name: 'Shampoo', price: 70000, img: 'assets/img/shampoo.jpg' },
  { name: 'Acondicionador', price: 65000, img: 'assets/img/acondicionador.jpg' }
];

accesorios = [
  { name: 'Brochas', price: 35000, img: 'assets/img/brochas.jpg' },
  { name: 'Cosmetiquera', price: 40000, img: 'assets/img/cosmetiquera.jpg' }
];

}


