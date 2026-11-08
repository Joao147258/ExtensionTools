/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/app/sidepanel/__tests__/tool-catalog.test.ts
 * Responsabilidade: Testes unitários de integridade do catálogo de ferramentas (B1-C01).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import { TOOL_CATALOG, DEFAULT_TOOL_ID, isToolId, getToolDescriptor } from '../tool-catalog';

describe('tool-catalog — Integridade dos Metadados (B1-C01)', () => {
  it('deve conter pelo menos um destino e possuir identificadores estáveis e únicos', () => {
    expect(TOOL_CATALOG.length).toBeGreaterThan(0);

    const ids = TOOL_CATALOG.map((tool) => tool.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('deve ter seleção inicial válida registrada no catálogo', () => {
    expect(isToolId(DEFAULT_TOOL_ID)).toBe(true);
    expect(DEFAULT_TOOL_ID).toBe('text-diff');
  });

  it('deve validar corretamente identificadores válidos e rejeitar identificadores desconhecidos via isToolId', () => {
    expect(isToolId('text-diff')).toBe(true);
    expect(isToolId('json-inspector')).toBe(true);
    expect(isToolId('xml-inspector')).toBe(true);
    expect(isToolId('markdown')).toBe(true);
    expect(isToolId('quick-files')).toBe(true);

    expect(isToolId('invalid-tool')).toBe(false);
    expect(isToolId('')).toBe(false);
    expect(isToolId('unknown-id-123')).toBe(false);
  });

  it('deve retornar o descritor correspondente ou fallback seguro via getToolDescriptor', () => {
    const textDiff = getToolDescriptor('text-diff');
    expect(textDiff.id).toBe('text-diff');
    expect(textDiff.label).toBe('Text Diff');

    const fallback = getToolDescriptor('non-existent');
    expect(fallback).toBe(TOOL_CATALOG[0]);
  });

  it('deve conter apenas propriedades de apresentação sem acoplamento a código executável', () => {
    for (const tool of TOOL_CATALOG) {
      expect(typeof tool.id).toBe('string');
      expect(typeof tool.label).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.id.length).toBeGreaterThan(0);
      expect(tool.label.length).toBeGreaterThan(0);
    }
  });
});
