import { Injectable } from '@angular/core';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}


@Injectable({
  providedIn: 'root',
})
export class ProductCacheService {
  private cache = new Map<string, CacheItem<any>>();
  private ttl = 1000 * 60 * 5; // ⏱️ 5 minutos

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(key?: string) {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }
}

