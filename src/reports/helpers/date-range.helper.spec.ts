import { BadRequestException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rangeIncludesToday, resolveRange } from './date-range.helper';

const TZ = 'America/Argentina/Buenos_Aires';

describe('resolveRange', () => {
  it('convierte fecha local a intervalo UTC semiabierto', () => {
    const range = resolveRange({ from: '2026-08-01', to: '2026-08-31' }, TZ);
    // Argentina es UTC-3: 00:00 local = 03:00 UTC
    expect(range.fromUtc.toISOString()).toBe('2026-08-01T03:00:00.000Z');
    expect(range.toUtcExclusive.toISOString()).toBe('2026-09-01T03:00:00.000Z');
  });

  it('acepta el 29 de febrero de un año bisiesto', () => {
    const range = resolveRange({ from: '2028-02-01', to: '2028-02-29' }, TZ);
    expect(range.to).toBe('2028-02-29');
  });

  it('rechaza fechas inexistentes (2026-02-31)', () => {
    expect(() =>
      resolveRange({ from: '2026-02-31', to: '2026-03-05' }, TZ),
    ).toThrow(BadRequestException);
  });

  it('rechaza from > to', () => {
    expect(() =>
      resolveRange({ from: '2026-05-01', to: '2026-04-01' }, TZ),
    ).toThrow(BadRequestException);
  });

  it('rechaza rangos de más de 366 días', () => {
    expect(() =>
      resolveRange({ from: '2024-01-01', to: '2026-12-31' }, TZ),
    ).toThrow(BadRequestException);
  });

  it('rechaza "to" anterior a 2020-01-01', () => {
    expect(() =>
      resolveRange({ from: '2019-01-01', to: '2019-12-31' }, TZ),
    ).toThrow(BadRequestException);
  });
});

describe('resolveRange defaults', () => {
  afterEach(() => vi.useRealTimers());

  it('usa los últimos 30 días hasta hoy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T12:00:00Z'));

    const range = resolveRange({}, TZ);
    expect(range.to).toBe('2026-08-31');
    expect(range.from).toBe('2026-08-02');
  });
});

describe('rangeIncludesToday', () => {
  afterEach(() => vi.useRealTimers());

  it('detecta si el rango incluye hoy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T12:00:00Z'));

    expect(
      rangeIncludesToday(
        resolveRange({ from: '2026-08-01', to: '2026-08-31' }, TZ),
        TZ,
      ),
    ).toBe(true);
    expect(
      rangeIncludesToday(
        resolveRange({ from: '2026-07-01', to: '2026-07-31' }, TZ),
        TZ,
      ),
    ).toBe(false);
  });
});
