import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx utility', () => {
  it('combina classes de texto simples', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('ignora valores falsos, nulos ou indefinidos', () => {
    expect(cx('a', false, null, undefined, 'b', '')).toBe('a b');
  });

  it('retorna string vazia quando nenhum argumento válido for fornecido', () => {
    expect(cx(false, null, undefined)).toBe('');
  });
});
