import { describe, expect, it } from 'vitest';
import { availableMinutesInRange, reservedMinutes } from './occupancy.helper';

const TZ = 'America/Argentina/Buenos_Aires';

describe('availableMinutesInRange', () => {
  it('suma múltiples rangos por día', () => {
    const availability = {
      mon: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '20:00' },
      ],
    };
    // 2026-08-03 es lunes
    expect(
      availableMinutesInRange(availability, '2026-08-03', '2026-08-03', TZ),
    ).toBe(240 + 240);
  });

  it('devuelve 0 si el empleado no tiene horario ese día', () => {
    const availability = { mon: [{ start: '09:00', end: '13:00' }] };
    // 2026-08-04 es martes
    expect(
      availableMinutesInRange(availability, '2026-08-04', '2026-08-04', TZ),
    ).toBe(0);
  });

  it('acumula los días con horario dentro del rango', () => {
    const availability = { mon: [{ start: '09:00', end: '17:00' }] };
    // Dos lunes: 2026-08-03 y 2026-08-10
    expect(
      availableMinutesInRange(availability, '2026-08-03', '2026-08-10', TZ),
    ).toBe(480 * 2);
  });

  it('devuelve 0 con disponibilidad vacía', () => {
    expect(availableMinutesInRange({}, '2026-08-03', '2026-08-03', TZ)).toBe(0);
  });
});

describe('reservedMinutes', () => {
  const from = new Date('2026-08-03T10:00:00Z');
  const to = new Date('2026-08-03T11:00:00Z');

  it('recorta el inicio al rango', () => {
    expect(
      reservedMinutes(
        new Date('2026-08-03T09:30:00Z'),
        new Date('2026-08-03T10:30:00Z'),
        from,
        to,
      ),
    ).toBe(30);
  });

  it('recorta el fin al rango', () => {
    expect(
      reservedMinutes(
        new Date('2026-08-03T10:30:00Z'),
        new Date('2026-08-03T12:00:00Z'),
        from,
        to,
      ),
    ).toBe(30);
  });

  it('devuelve 0 si no se solapa', () => {
    expect(
      reservedMinutes(
        new Date('2026-08-03T08:00:00Z'),
        new Date('2026-08-03T09:00:00Z'),
        from,
        to,
      ),
    ).toBe(0);
  });
});
