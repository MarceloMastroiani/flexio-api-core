import { DateTime } from 'luxon';

type TimeRange = { start: string; end: string };
type WorkingHours = Record<string, TimeRange[]>; // { "mon": [{start, end}, {start, end}] }

interface BusyRange {
  start: Date;
  end: Date;
}

// ISO weekday: 1=lunes … 7=domingo
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Convierte un "HH:mm" de la disponibilidad (hora local del negocio) a un Date UTC
 * sobre el día indicado.
 */
function timeToUtc(day: DateTime, time: string): Date {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Format error: ${JSON.stringify(time)}`);
  }

  const [hours, minutes] = time.split(':').map(Number);
  return day
    .set({ hour: hours ?? 0, minute: minutes ?? 0, second: 0, millisecond: 0 })
    .toUTC()
    .toJSDate();
}

/**
 * Genera los slots dentro de UN rango horario puntual (ya en UTC).
 */
function generateSlotsInRange(
  rangeStart: Date,
  rangeEnd: Date,
  stepMs: number,
  busyRanges: BusyRange[],
  now: Date,
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  let cursor = new Date(rangeStart);

  while (cursor.getTime() + stepMs <= rangeEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + stepMs);

    if (slotStart >= now) {
      const overlaps = busyRanges.some(
        (busy) => slotStart < busy.end && busy.start < slotEnd,
      );

      if (!overlaps) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }

    cursor = new Date(cursor.getTime() + stepMs);
  }

  return slots;
}

/**
 * Calcula los slots disponibles para un empleado en una fecha local del negocio.
 * La disponibilidad (`HH:mm`) se interpreta en `tz` y se convierte a UTC.
 */
export function calculateAvailableSlots(
  dateStr: string,
  availability: WorkingHours,
  slotMinutes: number,
  busyRanges: BusyRange[],
  tz: string,
  now: Date = new Date(),
): { start: string; end: string }[] {
  const day = DateTime.fromISO(dateStr, { zone: tz }).startOf('day');
  if (!day.isValid) {
    return [];
  }

  const dayKey = DAY_KEYS[day.weekday - 1]!;
  const dayRanges = availability[dayKey];

  // El empleado no trabaja ese día
  if (!dayRanges || dayRanges.length === 0) {
    return [];
  }

  const stepMs = slotMinutes * 60 * 1000;
  let allSlots: { start: string; end: string }[] = [];

  for (const range of dayRanges) {
    const rangeStart = timeToUtc(day, range.start);
    const rangeEnd = timeToUtc(day, range.end);

    const slotsInRange = generateSlotsInRange(
      rangeStart,
      rangeEnd,
      stepMs,
      busyRanges,
      now,
    );

    allSlots = allSlots.concat(slotsInRange);
  }

  return allSlots;
}
