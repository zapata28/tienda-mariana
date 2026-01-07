import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { supabase } from '../../supabase.client';
import { CartService } from '../../cart.service';


type CategoriaSlug = 'maquillaje' | 'skincare' | 'capilar' | 'accesorios';

type SubGrupo = { nombre: string; items: string[] };

type CrumbAction = 'home' | 'categoria' | 'grupo' | 'subitem';
type Crumb = { label: string; action: CrumbAction };

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria: CategoriaSlug;
  grupo?: string | null;
  subgrupo?: string | null;
  imagen?: string | null;
  es_nuevo?: boolean | null;
  en_oferta?: boolean | null;
  precio_antes?: number | null;
  created_at?: string | null;
};

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
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

  loading = true;
  productosFiltrados: Producto[] = [];

  breadcrumbs: Crumb[] = [];

  // ✅ PAGINACIÓN
  pageSize = 12;
  page = 1;
  total = 0;
  totalPages = 1;

  // ✅ PAGINACIÓN NUMÉRICA (incluye "...")
  paginasVisibles: number[] = []; // ej: [1, -1, 5, 6, 7, -1, 20]

  constructor(private route: ActivatedRoute, private router: Router, private cart: CartService) {}

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.route.paramMap.subscribe(async params => {
      const slug = (params.get('slug') || 'maquillaje') as CategoriaSlug;
      this.slugActual = slug;

      this.cargarCategoria(slug);
      this.cargarGrupos(slug);

      // defaults filtros
      this.grupoActivo = 'Todos';
      this.subitems = [];
      this.subitemActivo = 'Todos';

      // reset paginación
      this.page = 1;
      this.total = 0;
      this.totalPages = 1;
      this.paginasVisibles = [];

      this.actualizarBreadcrumbs();
      await this.cargarProductosFiltrados();
    });
  }

  // =========================
  // TITULO
  // =========================
  cargarCategoria(slug: CategoriaSlug) {
    switch (slug) {
      case 'maquillaje': this.titulo = 'Maquillaje'; break;
      case 'skincare': this.titulo = 'Cuidado de la piel'; break;
      case 'capilar': this.titulo = 'Cuidado capilar'; break;
      case 'accesorios': this.titulo = 'Accesorios'; break;
    }
  }

  // =========================
  // GRUPOS / SUBGRUPOS
  // =========================
  cargarGrupos(slug: CategoriaSlug) {
    if (slug === 'maquillaje') {
      this.grupos = [
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
        { nombre: 'Cuidado facial', items: ['Limpiadores y desmaquillantes', 'Aguas micelares y tónicos', 'Mascarillas', 'Hidratantes y tratamientos', 'Contorno de ojos', 'Exfoliantes faciales', 'Kits'] },
        { nombre: 'Protección solar', items: ['Protector solar', 'Bronceadores'] },
        { nombre: 'Otros cuidado', items: ['Depilación', 'Masajeadores'] }
      ];
      return;
    }

    if (slug === 'capilar') {
      this.grupos = [
        { nombre: 'Limpieza y tratamientos', items: ['Shampoo', 'Acondicionador', 'Mascarillas y tratamientos', 'Serum y óleos'] },
        { nombre: 'Styling', items: ['Cremas de peinar y desenredantes', 'Fijadores y laca', 'Termoprotectores', 'Mousse y espumas', 'Shampoo seco'] },
        { nombre: 'Eléctricos', items: ['Cepillos eléctricos', 'Planchas', 'Rizadores', 'Secadores'] }
      ];
      return;
    }

    if (slug === 'accesorios') {
      this.grupos = [
        { nombre: 'Accesorios', items: ['Collares', 'Aretes', 'Manillas'] }
      ];
      return;
    }

    this.grupos = [];
  }

  // =========================
  // SUPABASE + PAGINACIÓN
  // =========================
  async cargarProductosFiltrados() {
    this.loading = true;

    const from = (this.page - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    let query = supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .eq('categoria', this.slugActual)
      .order('created_at', { ascending: false });

    if (this.grupoActivo !== 'Todos') {
      query = query.eq('grupo', this.grupoActivo);
    }

    if (this.grupoActivo !== 'Todos' && this.subitemActivo !== 'Todos') {
      query = query.eq('subgrupo', this.subitemActivo);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error cargando productos:', error);
      this.productosFiltrados = [];
      this.total = 0;
      this.totalPages = 1;
      this.paginasVisibles = [];
      this.loading = false;
      return;
    }

    this.productosFiltrados = (data ?? []) as Producto[];
    this.total = count ?? 0;
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));

    // ✅ recalcular botones numéricos
    this.recalcularPaginasVisibles();

    // seguridad si el filtro deja tu page fuera de rango
    if (this.page > this.totalPages) {
      this.page = this.totalPages;
      this.loading = false;
      await this.cargarProductosFiltrados();
      return;
    }

    this.loading = false;
  }

  // =========================
  // PAGINACIÓN NUMÉRICA (1 … 5 6 7 … 20)
  // -1 representa "..."
  // =========================
  private recalcularPaginasVisibles() {
    const total = this.totalPages;
    const current = this.page;

    if (total <= 7) {
      this.paginasVisibles = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 3) {
      start = 2;
      end = 4;
    } else if (current >= total - 2) {
      start = total - 3;
      end = total - 1;
    }

    const pages: number[] = [1];

    if (start > 2) pages.push(-1);

    for (let p = start; p <= end; p++) pages.push(p);

    if (end < total - 1) pages.push(-1);

    pages.push(total);

    this.paginasVisibles = pages;
  }

  // =========================
  // FILTROS UI (reset page)
  // =========================
  async seleccionarGrupo(nombre: string) {
    this.grupoActivo = nombre;

    if (nombre === 'Todos') {
      this.subitems = [];
      this.subitemActivo = 'Todos';
    } else {
      const g = this.grupos.find(x => x.nombre === nombre);
      this.subitems = ['Todos', ...(g?.items ?? [])];
      this.subitemActivo = 'Todos';
    }

    this.page = 1;
    this.actualizarBreadcrumbs();
    await this.cargarProductosFiltrados();
  }

  async seleccionarSubitem(nombre: string) {
    this.subitemActivo = nombre;
    this.page = 1;
    this.actualizarBreadcrumbs();
    await this.cargarProductosFiltrados();
  }

  // =========================
  // CONTROLES PAGINACIÓN
  // =========================
  async prevPage() {
    if (this.page <= 1) return;
    this.page--;
    await this.cargarProductosFiltrados();
  }

  async nextPage() {
    if (this.page >= this.totalPages) return;
    this.page++;
    await this.cargarProductosFiltrados();
  }

  async goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    await this.cargarProductosFiltrados();
  }

  // =========================
  // BREADCRUMB
  // =========================
  actualizarBreadcrumbs() {
    const crumbs: Crumb[] = [
      { label: 'Inicio', action: 'home' },
      { label: this.titulo, action: 'categoria' }
    ];

    if (this.grupoActivo !== 'Todos') crumbs.push({ label: this.grupoActivo, action: 'grupo' });
    if (this.grupoActivo !== 'Todos' && this.subitemActivo !== 'Todos') crumbs.push({ label: this.subitemActivo, action: 'subitem' });

    this.breadcrumbs = crumbs;
  }

  async navegarCrumb(action: CrumbAction) {
    if (action === 'home') {
      this.router.navigate(['/']);
      return;
    }

    if (action === 'categoria') {
      this.grupoActivo = 'Todos';
      this.subitems = [];
      this.subitemActivo = 'Todos';
      this.page = 1;
      this.actualizarBreadcrumbs();
      await this.cargarProductosFiltrados();
      return;
    }

    if (action === 'grupo') {
      this.subitemActivo = 'Todos';
      this.page = 1;
      this.actualizarBreadcrumbs();
      await this.cargarProductosFiltrados();
      return;
    }
  }

  // =========================
  // NAV
  // =========================
  verProducto(id: string) {
  this.router.navigate(['/producto', id]);
  }

  // CARRITO
  // =========================
  addToCart(p: Producto) {
    this.cart.add(
      {
        id: String(p.id),
        nombre: p.nombre,
        precio: Number(p.precio),
        imagen: p.imagen ?? '',
      },
      1
    );
  }

}
