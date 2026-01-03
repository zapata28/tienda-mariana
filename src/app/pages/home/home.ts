import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { supabase } from '../../supabase.client';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit, OnDestroy {

  constructor(private router: Router) {}

  currentSlide = 0;

  // ⏱️ autoplay config
  private autoplayId: any = null;
  private autoplayMs = 5000;

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
      image: '',
      title: 'Tu rutina empieza aquí',
      text: 'Mensaje promocional.',
      button: 'Ver todo',
    }
  ];

  categorias = [
    { name: 'Maquillaje', slug: 'maquillaje', img: 'assets/icons/icono-maquillaje.png' },
    { name: 'Cuidado de la piel', slug: 'skincare', img: 'assets/icons/icono-cuidado-facial.png' },
    { name: 'Cuidado capilar', slug: 'capilar', img: 'assets/icons/icono-cuidado-capilar.png' },
    { name: 'Accesorios', slug: 'accesorios', img: 'assets/icons/icono-accesorios.png' }
  ];

  // ✅ NOVEDADES
  novedades = [
    {
      id: 1,
      nombre: 'Espuma de ampolla de centella',
      descripcion: 'Limpieza suave, ideal para piel sensible.',
      precio: 58000,
      img: '',
      esNuevo: true,
    },
    {
      id: 2,
      nombre: 'Serum hidratante',
      descripcion: 'Hidratación ligera para uso diario.',
      precio: 72000,
      img: '',
      esNuevo: true,
    },
    {
      id: 3,
      nombre: 'Shampoo reparación',
      descripcion: 'Fortalece y aporta brillo.',
      precio: 45000,
      img: '',
      esNuevo: true,
    },
    {
      id: 4,
      nombre: 'Protector solar',
      descripcion: 'Protección UV de uso diario.',
      precio: 69000,
      img: '',
      esNuevo: true,
    },
  ];

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }



async subirImagen(file: File) {
  const ext = file.name.split('.').pop() || 'png';
  const filePath = `imgs/${Date.now()}.${ext}`;

  const { data: s } = await supabase.auth.getSession();
  console.log('SESSION EN UPLOAD:', s.session?.user?.email, s.session?.user?.id);

  const { error: upErr } = await supabase.storage
    .from('productos')
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || 'image/png'
    });

  if (upErr) {
    console.error('Error subiendo imagen:', upErr);
    return null;
  }

  const { data } = supabase.storage.from('productos').getPublicUrl(filePath);
  console.log('✅ URL pública:', data.publicUrl);
  return data.publicUrl;
}


onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  this.subirImagen(file);
}






  // ✅ Dots
  goToSlide(index: number) {
    this.currentSlide = index;
    this.restartAutoplay();
  }

  // ✅ Next (autoplay)
  private nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  // ✅ Autoplay controls
  private startAutoplay() {
    if (this.autoplayId) return;
    this.autoplayId = setInterval(() => {
      this.nextSlide();
    }, this.autoplayMs);
  }

  private stopAutoplay() {
    if (!this.autoplayId) return;
    clearInterval(this.autoplayId);
    this.autoplayId = null;
  }

  private restartAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  // ✅ Para pausar desde el HTML )
  pauseAutoplay() {
    this.stopAutoplay();
  }

  resumeAutoplay() {
    this.startAutoplay();
  }

  irACategoria(slug: string) {
    this.router.navigate(['/categoria', slug]);
  }

  verProducto(id: number) {
    this.router.navigate(['/producto', id]);
  }
}
