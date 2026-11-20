import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { envs } from '../../common/configs/envs';

export interface DateRange {
  /** Fecha local inclusiva, YYYY-MM-DD */
  from: string;
  /** Fecha local inclusiva, YYYY-MM-DD */
  to: string;
  /** Inicio del rango en UTC (00:00 local de `from`) */
  fromUtc: Date;
  /** Inicio del día siguiente a `to` en UTC (semiabierto) */
  toUtcExclusive: Date;
  tz: string;
}

const MAX_RANGE_DAYS = 366;
const MIN_TO_DATE = '2020-01-01';

function parseLocalDate(value: string, tz: string): DateTime {
  const dt = DateTime.fromISO(value, { zone: tz });
  // Rechaza fechas inexistentes (ej. 2026-02-31, que luxon "rollea")
  if (!dt.isValid || dt.toISODate() !== value) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }
  return dt.startOf('day');
}

/**
 * Convierte un rango de fechas locales (YYYY-MM-DD, ambos inclusivos) a un
 * intervalo UTC semiabierto [fromUtc, toUtcExclusive) usando la zona del negocio.
 */
export function resolveRange(
  input: { from?: string | undefined; to?: string | undefined },
  tz: string = envs.businessTimezone,
): DateRange {
  const today = DateTime.now().setZone(tz).startOf('day');
  const toStr = input.to ?? today.toISODate()!;
  const fromStr = input.from ?? today.minus({ days: 29 }).toISODate()!;

  const fromDt = parseLocalDate(fromStr, tz);
  const toDt = parseLocalDate(toStr, tz);

  if (fromDt > toDt) {
    throw new BadRequestException('"from" must be before or equal to "to"');
  }
  if (toStr < MIN_TO_DATE) {
    throw new BadRequestException(`"to" cannot be earlier than ${MIN_TO_DATE}`);
  }

  const days = Math.round(toDt.diff(fromDt, 'days').days) + 1;
  if (days > MAX_RANGE_DAYS) {
    throw new BadRequestException(`Range cannot exceed ${MAX_RANGE_DAYS} days`);
  }

  return {
    from: fromStr,
    to: toStr,
    fromUtc: fromDt.toUTC().toJSDate(),
    toUtcExclusive: toDt.plus({ days: 1 }).toUTC().toJSDate(),
    tz,
  };
}

/** true si el rango (en hora local) incluye el día de hoy. */
export function rangeIncludesToday(
  range: DateRange,
  tz: string = envs.businessTimezone,
): boolean {
  const today = DateTime.now().setZone(tz).toISODate()!;
  return range.from <= today && today <= range.to;
}
