import { DateTime } from 'luxon';
import { envs } from '../../common/configs/envs';

export interface Periodo {
  from: string;
  to: string;
}

export interface Delta {
  value: number;
  previous: number;
  /** Variación porcentual redondeada a 1 decimal; null si previous === 0. */
  changePct: number | null;
}

/**
 * Período inmediatamente anterior de igual cantidad de días.
 * Ej: 2026-08-01..2026-08-31 → 2026-07-01..2026-07-31.
 */
export function previousPeriod(
  from: string,
  to: string,
  tz: string = envs.businessTimezone,
): Periodo {
  const fromDt = DateTime.fromISO(from, { zone: tz });
  const toDt = DateTime.fromISO(to, { zone: tz });
  const spanDays = Math.round(toDt.diff(fromDt, 'days').days);

  const prevTo = fromDt.minus({ days: 1 });
  const prevFrom = prevTo.minus({ days: spanDays });

  return { from: prevFrom.toISODate()!, to: prevTo.toISODate()! };
}

/** Compara dos valores y devuelve el delta con changePct acotado. */
export function delta(current: number, previous: number): Delta {
  const changePct =
    previous === 0
      ? null
      : Math.round(((current - previous) / previous) * 1000) / 10;

  return { value: current, previous, changePct };
}
