import { DateTime } from 'luxon';

export interface DayRange {
  start: string; // HH:mm
  end: string; // HH:mm
}

export type Availability = Record<string, DayRange[] | undefined>;

// ISO weekday: 1=lunes … 7=domingo
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function rangeMinutes(r: DayRange): number {
  const [sh = 0, sm = 0] = r.start.split(':').map(Number);
  const [eh = 0, em = 0] = r.end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * Minutos disponibles del empleado en el rango local (según su disponibilidad
 * semanal). Helper puro y testeable (NO usa SQL).
 */
export function availableMinutesInRange(
  availability: Availability,
  from: string,
  to: string,
  tz: string,
): number {
  const fromDt = DateTime.fromISO(from, { zone: tz }).startOf('day');
  const toDt = DateTime.fromISO(to, { zone: tz }).startOf('day');

  let total = 0;
  let cur = fromDt;
  while (cur <= toDt) {
    const key = WEEKDAY_KEYS[cur.weekday - 1];
    const ranges = key ? availability[key] : undefined;
    if (ranges) {
      for (const r of ranges) {
        const m = rangeMinutes(r);
        if (m > 0) total += m;
      }
    }
    cur = cur.plus({ days: 1 });
  }
  return total;
}

/** Minutos de un turno recortados al rango [fromUtc, toUtcExclusive). */
export function reservedMinutes(
  startsAt: Date,
  endsAt: Date,
  fromUtc: Date,
  toUtcExclusive: Date,
): number {
  const start = Math.max(startsAt.getTime(), fromUtc.getTime());
  const end = Math.min(endsAt.getTime(), toUtcExclusive.getTime());
  return Math.max(0, Math.round((end - start) / 60_000));
}
