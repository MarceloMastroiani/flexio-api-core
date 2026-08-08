

type TimeRange = { start: string; end: string };
type WorkingHours = Record<string, TimeRange[]>; // { "mon": [{start, end}, {start, end}] }

interface BusyRange {
  start: Date;
  end: Date;
}


const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];


/**
 * Devuelve la clave del día ("mon", "tue", etc.) para una fecha dada, en UTC.
 */
 function getDayKey(date: Date): string {
   return DAY_KEYS[date.getUTCDay()];
 }

 /**
  * Convierte "09:00" + una fecha base a un Date completo en UTC.
  */
function timeToDate(baseDate: Date, time: string): Date {

  // Valida que el tiempo sea una cadena en formato "HH:MM"
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Format error: ${JSON.stringify(time)}`);
  }

  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate(),
    hours,
    minutes,
    0,
    0,
  ));
  }

  /**
   * Genera los slots dentro de UN rango horario puntual (ej: 09:00 a 13:00).
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
   * Calcula los slots disponibles para un empleado en un día específico.
   * Soporta múltiples rangos por día (ej: turno mañana + turno tarde).
   */
  export function calculateAvailableSlots(
    date: Date,
    availability: WorkingHours,
    serviceDuration: number,
    busyRanges: BusyRange[],
    now: Date = new Date(),
  ): { start: string; end: string }[] {
    const dayKey = getDayKey(date);
    const dayRanges = availability[dayKey];

    // El empleado no trabaja ese día
    if (!dayRanges || dayRanges.length === 0) {
      return [];
    }

    const stepMs = serviceDuration * 60 * 1000;
    let allSlots: { start: string; end: string }[] = [];

    for (const range of dayRanges) {
      const rangeStart = timeToDate(date, range.start);
      const rangeEnd = timeToDate(date, range.end);

      const slotsInRange = generateSlotsInRange(
        rangeStart, rangeEnd, stepMs, busyRanges, now,
      );

      allSlots = allSlots.concat(slotsInRange);
    }

    return allSlots;
  }
