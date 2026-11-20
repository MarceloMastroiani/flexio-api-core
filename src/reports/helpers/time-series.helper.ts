import { DateTime } from 'luxon';

export type Granularity = 'day' | 'week' | 'month';

function startOfISOWeek(dt: DateTime): DateTime {
  // luxon weekday: 1=lunes … 7=domingo
  return dt.minus({ days: dt.weekday - 1 }).startOf('day');
}

function bucketStart(dt: DateTime, granularity: Granularity): DateTime {
  if (granularity === 'week') return startOfISOWeek(dt);
  if (granularity === 'month') return dt.startOf('month');
  return dt.startOf('day');
}

function step(granularity: Granularity): {
  days?: number;
  weeks?: number;
  months?: number;
} {
  if (granularity === 'week') return { weeks: 1 };
  if (granularity === 'month') return { months: 1 };
  return { days: 1 };
}

/**
 * Genera las claves de bucket (YYYY-MM-DD local del inicio del bucket) para el
 * rango y granularidad dados. Las semanas empiezan el lunes.
 */
export function buildBuckets(
  from: string,
  to: string,
  granularity: Granularity,
  tz: string,
): string[] {
  const fromDt = DateTime.fromISO(from, { zone: tz }).startOf('day');
  const toDt = DateTime.fromISO(to, { zone: tz }).startOf('day');

  let cur = bucketStart(fromDt, granularity);
  const end = bucketStart(toDt, granularity);
  const inc = step(granularity);

  const buckets: string[] = [];
  while (cur <= end) {
    buckets.push(cur.toISODate()!);
    cur = cur.plus(inc);
  }
  return buckets;
}

/**
 * Rellena los huecos de una serie con ceros (usando `factory` para el punto vacío).
 */
export function fillSeries<T>(
  buckets: string[],
  rows: T[],
  keyOf: (row: T) => string,
  factory: (bucket: string) => T,
): T[] {
  const byBucket = new Map(rows.map((row) => [keyOf(row), row]));
  return buckets.map((bucket) => byBucket.get(bucket) ?? factory(bucket));
}
