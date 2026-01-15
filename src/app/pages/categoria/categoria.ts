import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CartService } from '../../cart.service';
import {
  ProductService,
  CategoriaSlug,
  Producto,
} from '../../services/product.service';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './categoria.html',
  styleUrls: ['./categoria.css'],
})
export class Categoria implements OnInit {
  slugActual!: CategoriaSlug;
  titulo = '';

  grupos: { nombre: string; items: string[] }[] = [];
  grupoActivo = 'Todos';

  subitems: string[] = [];
  subitemActivo = 'Todos';

  productos: Producto[] = [];
  loading = true;

  page = 1;
  pageSize = 12;
  total = 0;
  totalPages = 1;
  paginasVisibles: number[] = [];

  breadcrumbs: { label: string; action: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cart: CartService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const slug = params.get('slug') as CategoriaSlug;

      if (!slug) {
        this.router.navigate(['/']);
        return;
      }

      this.slugActual = slug;
      this.setTitulo();
      this.setGrupos();
      this.page = 1;

      await this.cargarProductos();
    });
  }

  setTitulo() {
    const map: Record<CategoriaSlug, string> = {
      maquillaje: 'Maquillaje',
      skincare: 'Cuidado de la piel',
      capilar: 'Cuidado capilar',
      accesorios: 'Accesorios',
    };
    this.titulo = map[this.slugActual];
  }

  setGrupos() {
    this.grupoActivo = 'Todos';
    this.subitemActivo = 'Todos';
    this.subitems = [];

    if (this.slugActual === 'maquillaje') {
      this.grupos = [
        { nombre: 'Rostro', items: ['Bases', 'Correctores', 'Polvos'] },
        { nombre: 'Ojos', items: ['Sombras', 'Pestañinas'] },
        { nombre: 'Labios', items: ['Labiales', 'Brillos'] },
      ];
    } else {
      this.grupos = [];
    }
  }

  async cargarProductos() {
    this.loading = true;

    const { data, total } =
      await this.productService.getByCategoria(
        this.slugActual,
        this.page,
        this.pageSize
      );

    this.productos = data;
    this.total = total;
    this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize));

    this.recalcularPaginas();
    this.actualizarBreadcrumbs();

    this.loading = false;
  }

  recalcularPaginas() {
    this.paginasVisibles = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.paginasVisibles.push(i);
    }
  }

  async seleccionarGrupo(nombre: string) {
    this.grupoActivo = nombre;
    this.subitemActivo = 'Todos';

    const g = this.grupos.find(x => x.nombre === nombre);
    this.subitems = g ? ['Todos', ...g.items] : [];

    this.page = 1;
    await this.cargarProductos();
  }

  async seleccionarSubitem(nombre: string) {
    this.subitemActivo = nombre;
    this.page = 1;
    await this.cargarProductos();
  }

  async prevPage() {
    if (this.page > 1) {
      this.page--;
      await this.cargarProductos();
    }
  }

  async nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      await this.cargarProductos();
    }
  }

  async goToPage(p: number) {
    this.page = p;
    await this.cargarProductos();
  }

  actualizarBreadcrumbs() {
    this.breadcrumbs = [
      { label: 'Inicio', action: 'home' },
      { label: this.titulo, action: 'categoria' },
    ];

    if (this.grupoActivo !== 'Todos') {
      this.breadcrumbs.push({
        label: this.grupoActivo,
        action: 'grupo',
      });
    }

    if (this.subitemActivo !== 'Todos') {
      this.breadcrumbs.push({
        label: this.subitemActivo,
        action: 'subitem',
      });
    }
  }

  navegarCrumb(action: string) {
    if (action === 'home') this.router.navigate(['/']);
    if (action === 'categoria') this.seleccionarGrupo('Todos');
  }

  verProducto(id: string) {
    this.router.navigate(['/producto', id]);
  }

  addToCart(p: Producto) {
    this.cart.add(
      {
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        imagen: p.imagen ?? '',
      },
      1
    );
  }
}
