import { describe, expect, it } from 'vitest';
import { buildBuckets, fillSeries } from './time-series.helper';

const TZ = 'America/Argentina/Buenos_Aires';

describe('buildBuckets', () => {
  it('genera un bucket por día', () => {
    expect(buildBuckets('2026-08-01', '2026-08-03', 'day', TZ)).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
    ]);
  });

  it('genera un único bucket para un rango de un día', () => {
    expect(buildBuckets('2026-08-10', '2026-08-10', 'day', TZ)).toEqual([
      '2026-08-10',
    ]);
  });

  it('agrupa por semana empezando el lunes', () => {
    // 2026-08-05 es miércoles; su semana empieza el lunes 2026-08-03
    const buckets = buildBuckets('2026-08-05', '2026-08-19', 'week', TZ);
    expect(buckets).toEqual(['2026-08-03', '2026-08-10', '2026-08-17']);
  });

  it('agrupa por mes', () => {
    expect(buildBuckets('2026-01-15', '2026-03-10', 'month', TZ)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ]);
  });
});

describe('fillSeries', () => {
  it('rellena los huecos con ceros', () => {
    const buckets = ['2026-08-01', '2026-08-02', '2026-08-03'];
    const rows = [{ date: '2026-08-02', total: 5 }];

    const result = fillSeries(
      buckets,
      rows,
      (r) => r.date,
      (date) => ({ date, total: 0 }),
    );

    expect(result).toEqual([
      { date: '2026-08-01', total: 0 },
      { date: '2026-08-02', total: 5 },
      { date: '2026-08-03', total: 0 },
    ]);
  });

  it('devuelve todos los buckets en cero si no hay filas', () => {
    const result = fillSeries(
      ['2026-08-01', '2026-08-02'],
      [] as { date: string; total: number }[],
      (r) => r.date,
      (date) => ({ date, total: 0 }),
    );
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.total === 0)).toBe(true);
  });
});
