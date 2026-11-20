import { describe, expect, it } from 'vitest';
import { calculateAvailableSlots } from './availability.helper';

const TZ = 'America/Argentina/Buenos_Aires';
const BEFORE = new Date('2026-11-24T00:00:00.000Z');

const availability = {
  mon: [{ start: '09:00', end: '12:00' }],
  wed: [
    { start: '09:00', end: '11:00' },
    { start: '14:00', end: '16:00' },
  ],
};

describe('calculateAvailableSlots', () => {
  it('genera slots en hora local del negocio y los devuelve en UTC', () => {
    // 2026-11-25 es miércoles; 09:00 (-03) = 12:00Z
    const slots = calculateAvailableSlots(
      '2026-11-25',
      availability,
      30,
      [],
      TZ,
      BEFORE,
    );

    expect(slots).toEqual([
      { start: '2026-11-25T12:00:00.000Z', end: '2026-11-25T12:30:00.000Z' },
      { start: '2026-11-25T12:30:00.000Z', end: '2026-11-25T13:00:00.000Z' },
      { start: '2026-11-25T13:00:00.000Z', end: '2026-11-25T13:30:00.000Z' },
      { start: '2026-11-25T13:30:00.000Z', end: '2026-11-25T14:00:00.000Z' },
      { start: '2026-11-25T17:00:00.000Z', end: '2026-11-25T17:30:00.000Z' },
      { start: '2026-11-25T17:30:00.000Z', end: '2026-11-25T18:00:00.000Z' },
      { start: '2026-11-25T18:00:00.000Z', end: '2026-11-25T18:30:00.000Z' },
      { start: '2026-11-25T18:30:00.000Z', end: '2026-11-25T19:00:00.000Z' },
    ]);
  });

  it('no corre la fecha: el slot cae en el mismo día local', () => {
    const slots = calculateAvailableSlots(
      '2026-11-25',
      availability,
      30,
      [],
      TZ,
      BEFORE,
    );
    const firstLocalDate = new Date(slots[0]!.start).toLocaleDateString(
      'en-CA',
      { timeZone: TZ },
    );
    expect(firstLocalDate).toBe('2026-11-25');
  });

  it('devuelve [] si el empleado no trabaja ese día', () => {
    // 2026-11-26 es jueves
    expect(
      calculateAvailableSlots('2026-11-26', availability, 30, [], TZ, BEFORE),
    ).toEqual([]);
  });

  it('excluye los slots que se solapan con turnos ocupados', () => {
    const busy = [
      {
        start: new Date('2026-11-25T12:00:00.000Z'),
        end: new Date('2026-11-25T13:00:00.000Z'),
      },
    ];

    const slots = calculateAvailableSlots(
      '2026-11-25',
      availability,
      30,
      busy,
      TZ,
      BEFORE,
    );

    expect(slots).not.toContainEqual(
      expect.objectContaining({ start: '2026-11-25T12:00:00.000Z' }),
    );
    expect(slots).toContainEqual(
      expect.objectContaining({ start: '2026-11-25T13:00:00.000Z' }),
    );
  });

  it('no genera slots anteriores a "now"', () => {
    const now = new Date('2026-11-25T13:15:00.000Z');
    const slots = calculateAvailableSlots(
      '2026-11-25',
      availability,
      30,
      [],
      TZ,
      now,
    );

    expect(slots.every((s) => new Date(s.start) >= now)).toBe(true);
  });
});
