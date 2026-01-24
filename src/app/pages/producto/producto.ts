import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CartService } from '../../cart.service';
import { supabase } from '../../supabase.client';
import { Subscription } from 'rxjs';

type CategoriaSlug = 'maquillaje' | 'skincare' | 'capilar' | 'accesorios';

export type ProductoModel = {
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
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe],
  templateUrl: './producto.html',
  styleUrls: ['./producto.css'],
})
export class ProductoComponent implements OnInit, OnDestroy {
  loading = true;
  loadingRelacionados = true;

  producto: ProductoModel | null = null;
  relacionados: ProductoModel[] = [];

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cart: CartService,
    private cdr: ChangeDetectorRef // 👈 MISMO FIX QUE CATEGORÍA
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (!id) {
        this.router.navigate(['/']);
        return;
      }

      this.cargarProducto(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /* =======================
     CARGAR PRODUCTO
  ======================= */
  async cargarProducto(id: string) {
    this.loading = true;
    this.loadingRelacionados = true;
    this.producto = null;

    this.cdr.detectChanges(); // 🔥

    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      this.producto = data as ProductoModel;
      this.loading = false;

      this.cdr.detectChanges(); // 🔥

      await this.cargarRelacionados(
        this.producto.categoria,
        this.producto.id
      );
    } catch (err) {
      console.error('Error cargando producto', err);
      this.producto = null;
      this.loading = false;
      this.loadingRelacionados = false;
      this.cdr.detectChanges();
    }
  }

  /* =======================
     RELACIONADOS
  ======================= */
  async cargarRelacionados(categoria: CategoriaSlug, actualId: string) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('categoria', categoria)
        .neq('id', actualId)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      this.relacionados = data as ProductoModel[];
    } catch (err) {
      console.error('Error relacionados', err);
      this.relacionados = [];
    } finally {
      this.loadingRelacionados = false;
      this.cdr.detectChanges(); // 🔥
    }
  }

  /* =======================
     UTILIDADES
  ======================= */
  descuentoPct(p: ProductoModel): number {
    const antes = Number(p.precio_antes);
    const ahora = Number(p.precio);
    if (!antes || ahora >= antes) return 0;
    return Math.round(((antes - ahora) / antes) * 100);
  }

  addToCart(p: ProductoModel) {
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

  verProducto(id: string) {
    this.router.navigate(['/producto', id]);
  }

  volver() {
    this.router.navigate([
      '/categoria',
      this.producto?.categoria ?? 'maquillaje',
    ]);
  }
}
