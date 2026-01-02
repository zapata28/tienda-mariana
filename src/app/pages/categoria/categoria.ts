import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

type CategoriaSlug = 'maquillaje' | 'skincare' | 'capilar' | 'accesorios';

type SubGrupo = {
  nombre: string;
  items: string[];
};

type Crumb = { label: string; action: 'home' | 'categoria' | 'grupo' | 'subitem' };

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categoria.html',
  styleUrls: ['./categoria.css']
})
export class Categoria implements OnInit {

  titulo = '';
  slugActual: CategoriaSlug = 'maquillaje';

  grupos: SubGrupo[] = [];
  grupoActivo = 'Todos';

  subitems: string[] = [];
  subitemActivo = 'Todos';

  mostrarNivel2 = false;

  // ✅ Breadcrumb
  breadcrumbs: Crumb[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = (params.get('slug') || 'maquillaje') as CategoriaSlug;
      this.slugActual = slug;

      this.cargarCategoria(slug);
      this.cargarGrupos(slug);

      // Defaults
      this.grupoActivo = 'Todos';
      this.subitems = [];
      this.subitemActivo = 'Todos';
      this.mostrarNivel2 = false;

      this.actualizarBreadcrumbs();
    });
  }

  cargarCategoria(slug: CategoriaSlug) {
    switch (slug) {
      case 'maquillaje': this.titulo = 'Maquillaje'; break;
      case 'skincare': this.titulo = 'Cuidado de la piel'; break;
      case 'capilar': this.titulo = 'Cuidado capilar'; break;
      case 'accesorios': this.titulo = 'Accesorios'; break;
    }
  }

  cargarGrupos(slug: CategoriaSlug) {
    if (slug === 'maquillaje') {
      this.grupos = [
        { nombre: 'Todos', items: [] },
        { nombre: 'Rostro', items: ['Bases', 'Bb cream', 'Correctores', 'Polvos', 'Primer', 'Contornos', 'Iluminadores', 'Rubores', 'Bronzer', 'Fijadores'] },
        { nombre: 'Ojos', items: ['Delineadores', 'Pestañinas', 'Sombras', 'Cejas', 'Pestañas postizas'] },
        { nombre: 'Labios', items: ['Bálsamo labial', 'Brillo labial', 'Labial', 'Tinta de labios', 'Delineador de labios'] },
        { nombre: 'Accesorios de maquillaje', items: ['Brochas', 'Cosmetiqueras', 'Encrespadores', 'Esponjas y aplicadores'] },
        { nombre: 'Otros', items: ['Kits de maquillaje', 'Complementos'] }
      ];
      return;
    }

    if (slug === 'skincare') {
      this.grupos = [
        { nombre: 'Todos', items: [] },
        { nombre: 'Cuidado facial', items: ['Limpiadores y desmaquillantes', 'Aguas micelares y tónicos', 'Mascarillas', 'Hidratantes y tratamientos', 'Contorno de ojos', 'Exfoliantes faciales', 'Kits'] },
        { nombre: 'Protección solar', items: ['Protector solar', 'Bronceadores'] },
        { nombre: 'Otros cuidado', items: ['Depilación', 'Masajeadores'] }
      ];
      return;
    }

    if (slug === 'capilar') {
      this.grupos = [
        { nombre: 'Todos', items: [] },
        { nombre: 'Limpieza y tratamientos', items: ['Shampoo', 'Acondicionador', 'Mascarillas y tratamientos', 'Serum y óleos'] },
        { nombre: 'Styling', items: ['Cremas de peinar y desenredantes', 'Fijadores y laca', 'Termoprotectores', 'Mousse y espumas', 'Shampoo seco'] },
        { nombre: 'Eléctricos', items: ['Cepillos eléctricos', 'Planchas', 'Rizadores', 'Secadores'] }
      ];
      return;
    }

    if (slug === 'accesorios') {
      this.grupos = [
        { nombre: 'Todos', items: [] },
        { nombre: 'Accesorios', items: ['Collares', 'Aretes', 'Manillas'] }
      ];
      return;
    }

    this.grupos = [];
  }

  // ✅ Nivel 1
  seleccionarGrupo(nombre: string) {
    this.grupoActivo = nombre;

    if (nombre === 'Todos') {
      this.subitems = [];
      this.subitemActivo = 'Todos';
      this.mostrarNivel2 = false;
      this.actualizarBreadcrumbs();
      return;
    }

    const g = this.grupos.find(x => x.nombre === nombre);
    this.subitems = ['Todos', ...(g?.items ?? [])];
    this.subitemActivo = 'Todos';

    this.mostrarNivel2 = true;
    this.actualizarBreadcrumbs();
  }

  // ✅ Nivel 2
  seleccionarSubitem(nombre: string) {
    this.subitemActivo = nombre;

    if (nombre === 'Todos') {
      this.mostrarNivel2 = false;
      this.actualizarBreadcrumbs();
      return;
    }

    this.actualizarBreadcrumbs();
  }

  // ✅ Genera el breadcrumb automáticamente
  actualizarBreadcrumbs() {
    const crumbs: Crumb[] = [
      { label: 'Inicio', action: 'home' },
      { label: this.titulo, action: 'categoria' }
    ];

    if (this.grupoActivo && this.grupoActivo !== 'Todos') {
      crumbs.push({ label: this.grupoActivo, action: 'grupo' });
    }

    if (this.subitemActivo && this.subitemActivo !== 'Todos') {
      crumbs.push({ label: this.subitemActivo, action: 'subitem' });
    }

    this.breadcrumbs = crumbs;
  }

  // ✅ Click en breadcrumb
  navegarCrumb(action: Crumb['action']) {
    if (action === 'home') {
      this.router.navigate(['/']);
      return;
    }

    if (action === 'categoria') {
      this.grupoActivo = 'Todos';
      this.subitems = [];
      this.subitemActivo = 'Todos';
      this.mostrarNivel2 = false;
      this.actualizarBreadcrumbs();
      return;
    }

    if (action === 'grupo') {
      // volver a solo el grupo (sin subitem)
      this.subitemActivo = 'Todos';
      this.mostrarNivel2 = true; // para poder escoger otra subcategoria
      this.actualizarBreadcrumbs();
      return;
    }

    // action === 'subitem' -> no hace nada (ya estás ahí)
  }
}
