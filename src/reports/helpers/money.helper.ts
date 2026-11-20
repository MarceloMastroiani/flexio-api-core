/** Redondea a 2 decimales. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Porcentaje redondeado a 1 decimal; null si el total es 0. */
export function pct(part: number, total: number): number | null {
  if (!total) return null;
  return Math.round((part / total) * 1000) / 10;
}

/** Suma y redondea a 2 decimales. */
export function sumRound2(values: number[]): number {
  return round2(values.reduce((acc, v) => acc + v, 0));
}
