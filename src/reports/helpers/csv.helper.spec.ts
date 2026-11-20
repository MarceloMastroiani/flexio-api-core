import { describe, expect, it } from 'vitest';
import { toCsv } from './csv.helper';

describe('toCsv', () => {
  it('antepone BOM UTF-8 y usa CRLF', () => {
    const csv = toCsv([{ key: 'a', label: 'a' }], [{ a: 'x' }]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('\r\n');
  });

  it('escapa comas y comillas', () => {
    const csv = toCsv(
      [{ key: 'a', label: 'a' }],
      [{ a: 'x,y' }, { a: 'he said "hi"' }],
    );
    expect(csv).toContain('"x,y"');
    expect(csv).toContain('"he said ""hi"""');
  });

  it('escapa saltos de línea', () => {
    const csv = toCsv([{ key: 'a', label: 'a' }], [{ a: 'line1\nline2' }]);
    expect(csv).toContain('"line1\nline2"');
  });

  it('protege contra CSV injection en texto', () => {
    const csv = toCsv(
      [{ key: 'a', label: 'a' }],
      [{ a: '=SUM(1,2)' }, { a: '+1' }, { a: '-1' }, { a: '@x' }],
    );
    expect(csv).toContain("'=SUM(1,2)");
    expect(csv).toContain("'+1");
    expect(csv).toContain("'-1");
    expect(csv).toContain("'@x");
  });

  it('no prefija números válidos', () => {
    const csv = toCsv([{ key: 'a', label: 'a' }], [{ a: 42 }]);
    const dataLine = csv.split('\r\n')[1];
    expect(dataLine).toBe('42');
  });
});
