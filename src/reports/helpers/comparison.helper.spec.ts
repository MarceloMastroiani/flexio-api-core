import { describe, expect, it } from 'vitest';
import { delta, previousPeriod } from './comparison.helper';

const TZ = 'America/Argentina/Buenos_Aires';

describe('previousPeriod', () => {
  it('calcula el período anterior de igual duración', () => {
    expect(previousPeriod('2026-08-01', '2026-08-31', TZ)).toEqual({
      from: '2026-07-01',
      to: '2026-07-31',
    });
  });

  it('funciona con rangos de un día', () => {
    expect(previousPeriod('2026-08-10', '2026-08-10', TZ)).toEqual({
      from: '2026-08-09',
      to: '2026-08-09',
    });
  });
});

describe('delta', () => {
  it('calcula la variación porcentual', () => {
    expect(delta(150, 100)).toEqual({
      value: 150,
      previous: 100,
      changePct: 50,
    });
  });

  it('devuelve changePct null si el previo es 0', () => {
    expect(delta(150, 0)).toEqual({ value: 150, previous: 0, changePct: null });
  });

  it('maneja variaciones negativas', () => {
    expect(delta(50, 100).changePct).toBe(-50);
  });

  it('redondea a 1 decimal', () => {
    expect(delta(110, 90).changePct).toBe(22.2);
  });
});
