import type { Logger } from '@nestjs/common';
import type { ReportsCacheService } from '../cache/reports-cache.service';
import { rangeIncludesToday, type DateRange } from './date-range.helper';

const TTL_SECONDS = 300;
const SLOW_MS = 1500;

/**
 * Ejecuta un reporte aplicando caché (solo rangos totalmente pasados) y logging
 * de tiempos. Centraliza la política para todos los reportes.
 */
export async function runReport<T>(
  logger: Logger,
  cache: ReportsCacheService,
  report: string,
  range: DateRange,
  params: Record<string, unknown>,
  compute: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  const cacheable = !rangeIncludesToday(range, range.tz);
  const key = cache.buildKey(report, {
    ...params,
    from: range.from,
    to: range.to,
    timezone: range.tz,
  });

  const result = await cache.getOrCompute(key, TTL_SECONDS, compute, cacheable);

  const elapsed = Date.now() - startedAt;
  const label = `${report} ${range.from}..${range.to}`;
  if (elapsed > SLOW_MS) {
    logger.warn(`${label} took ${elapsed}ms`);
  } else {
    logger.log(`${label} took ${elapsed}ms`);
  }

  return result;
}
