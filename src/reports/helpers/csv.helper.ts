export interface CsvColumn<T> {
  key: keyof T & string;
  label: string;
}

function escapeCell(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number')
    return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  let s = value;
  // Protección contra CSV injection (solo texto; los números no llegan acá)
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  // Escape de comillas, comas y saltos de línea
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Genera CSV con BOM UTF-8, separador `,` y fin de línea `\r\n`.
 * Escapa comillas/comas/saltos y protege contra inyección de fórmulas.
 */
export function toCsv<T extends object>(
  columns: CsvColumn<T>[],
  rows: T[],
): string {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) =>
        escapeCell(
          (row as Record<string, unknown>)[c.key] as
            | string
            | number
            | boolean
            | null
            | undefined,
        ),
      )
      .join(','),
  );
  return `\uFEFF${[header, ...lines].join('\r\n')}\r\n`;
}
