import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';

/**
 * Abstracción de caché de reportes. Hoy usa el store en memoria de
 * `@nestjs/cache-manager`; para pasar a Redis basta con cambiar el store que se
 * registra en `ReportsModule`, sin tocar los services.
 */
@Injectable()
export class ReportsCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /** Arma una key estable (propiedades ordenadas) e incluye el timezone. */
  buildKey(report: string, params: Record<string, unknown>): string {
    const normalized = Object.keys(params)
      .sort()
      .map((key) => `${key}=${String(params[key])}`)
      .join('&');
    return `reports:${report}:${normalized}`;
  }

  async getOrCompute<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
    cacheable = true,
  ): Promise<T> {
    if (!cacheable) {
      return fn();
    }

    const cached = await this.cache.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const value = await fn();
    // cache-manager v7 usa TTL en milisegundos
    await this.cache.set(key, value, ttlSeconds * 1000);
    return value;
  }
}
