import { describe, expect, it } from 'vitest';
import { calculateAvailableSlots } from './availability.helper';

// Fecha base: miércoles 12/08/2026 (UTC)
const WED = new Date(Date.UTC(2026, 7, 12));
// Referencia fija de "ahora" al inicio del día, para tests deterministas
const NOW = new Date(Date.UTC(2026, 7, 12, 0, 0));

const availability = {
  mon: [{ start: '09:00', end: '12:00' }],
  wed: [
    { start: '09:00', end: '11:00' },
    { start: '14:00', end: '16:00' },
  ],
};

describe('calculateAvailableSlots', () => {
  it('genera slots de la duración indicada dentro de cada rango', () => {
    const slots = calculateAvailableSlots(WED, availability, 30, [], NOW);

    expect(slots).toEqual([
      { start: '2026-08-12T09:00:00.000Z', end: '2026-08-12T09:30:00.000Z' },
      { start: '2026-08-12T09:30:00.000Z', end: '2026-08-12T10:00:00.000Z' },
      { start: '2026-08-12T10:00:00.000Z', end: '2026-08-12T10:30:00.000Z' },
      { start: '2026-08-12T10:30:00.000Z', end: '2026-08-12T11:00:00.000Z' },
      { start: '2026-08-12T14:00:00.000Z', end: '2026-08-12T14:30:00.000Z' },
      { start: '2026-08-12T14:30:00.000Z', end: '2026-08-12T15:00:00.000Z' },
      { start: '2026-08-12T15:00:00.000Z', end: '2026-08-12T15:30:00.000Z' },
      { start: '2026-08-12T15:30:00.000Z', end: '2026-08-12T16:00:00.000Z' },
    ]);
  });

  it('devuelve [] si el empleado no trabaja ese día', () => {
    const tue = new Date(Date.UTC(2026, 7, 11));
    expect(calculateAvailableSlots(tue, availability, 30, [], NOW)).toEqual([]);
  });

  it('excluye los slots que se solapan con turnos ocupados', () => {
    const busy = [
      {
        start: new Date(Date.UTC(2026, 7, 12, 9, 0)),
        end: new Date(Date.UTC(2026, 7, 12, 10, 0)),
      },
    ];

    const slots = calculateAvailableSlots(WED, availability, 30, busy, NOW);

    // El bloque 09:00-10:00 queda ocupado
    expect(slots).not.toContainEqual(
      expect.objectContaining({ start: '2026-08-12T09:00:00.000Z' }),
    );
    expect(slots).toContainEqual(
      expect.objectContaining({ start: '2026-08-12T10:00:00.000Z' }),
    );
  });

  it('no genera slots anteriores a "now"', () => {
    const now = new Date(Date.UTC(2026, 7, 12, 10, 15));
    const slots = calculateAvailableSlots(WED, availability, 30, [], now);

    expect(slots.every((s) => new Date(s.start) >= now)).toBe(true);
  });
});
