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
  grupo?: string | null;
  subgrupo?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private cache: ProductCacheService) {}

  async getByCategoria(
    slug: CategoriaSlug,
    page = 1,
    pageSize = 12,
    grupo: string = 'Todos',
    subgrupo: string = 'Todos'
  ): Promise<{ data: Producto[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .eq('categoria', slug)
      .range(from, to);

    if (grupo !== 'Todos') {
      query = query.ilike('grupo', grupo);
    }

    if (subgrupo !== 'Todos') {
      query = query.ilike('subgrupo', subgrupo);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error(error);
      return { data: [], total: 0 };
    }

    return {
      data: data ?? [],
      total: count ?? 0,
    };
  }

  // 🔍 BÚSQUEDA
  async search(term: string): Promise<Producto[]> {
    const clean = term.trim().toLowerCase();
    if (!clean) return [];

    const cacheKey = `search-${clean}`;
    const cached = this.cache.get<Producto[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .or(
        `nombre.ilike.%${clean}%,descripcion.ilike.%${clean}%`
      )
      .order('nombre')
      .limit(40);

    if (error) {
      console.error('Error búsqueda:', error.message);
      return [];
    }

    this.cache.set(cacheKey, data ?? []);
    return data ?? [];
  }
}
