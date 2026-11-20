/**
 * Duración por defecto de un slot (minutos).
 *
 * Único punto para cambiarla. Actualmente no existe un BusinessSettingsService
 * que lea `ConfigEntry.slotDurationMinutes`, así que se usa 30 por defecto.
 */
export function getSlotMinutes(): number {
  return 30;
}
