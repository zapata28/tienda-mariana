import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { ProductCacheService } from './product-cache';

export type CategoriaSlug =
  | 'maquillaje'
  | 'skincare'
  | 'capilar'
  | 'accesorios';

export type Producto = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria: CategoriaSlug;
  imagen?: string | null;
  es_nuevo?: boolean | null;
  en_oferta?: boolean | null;
  precio_antes?: number | null;
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private cache: ProductCacheService) {}

  async getByCategoria(
    slug: CategoriaSlug,
    page = 1,
    pageSize = 12
  ): Promise<{ data: Producto[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const cacheKey = `categoria_${slug}_${page}_${pageSize}`;
    const cached =
      this.cache.get<{ data: Producto[]; total: number }>(cacheKey);

    if (cached) return cached;

    const { data, count, error } = await supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .eq('categoria', slug)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error cargando productos', error);
      return { data: [], total: 0 };
    }

    const result = {
      data: data ?? [],
      total: count ?? 0,
    };

    this.cache.set(cacheKey, result);
    return result;
  }
}
