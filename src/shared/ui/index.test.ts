import { describe, expect, it } from 'vitest';
import * as UI from './index';

describe('Public API — src/shared/ui', () => {
  it('exporta todos os 6 componentes primitivos planejados', () => {
    expect(UI.Button).toBeDefined();
    expect(UI.Input).toBeDefined();
    expect(UI.Select).toBeDefined();
    expect(UI.Panel).toBeDefined();
    expect(UI.Badge).toBeDefined();
    expect(UI.Icon).toBeDefined();
  });

  it('assegura que todos os componentes são funções executáveis', () => {
    expect(typeof UI.Button).toBe('function');
    expect(typeof UI.Input).toBe('function');
    expect(typeof UI.Select).toBe('function');
    expect(typeof UI.Panel).toBe('function');
    expect(typeof UI.Badge).toBe('function');
    expect(typeof UI.Icon).toBe('function');
  });
});
