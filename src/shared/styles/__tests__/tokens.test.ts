/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/shared/styles/__tests__/tokens.test.ts
 * Responsabilidade: Testes unitários de integridade dos Design Tokens e contraste WCAG 2.2 AA (B1-S01).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import { DESIGN_TOKENS } from '../tokens';

/**
 * Converte um valor hexadecimal de 6 caracteres para [r, g, b] normalizado (0-1).
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Calcula a luminância relativa de uma cor conforme definição WCAG 2.2.
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const adjust = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = adjust(r);
  const G = adjust(g);
  const B = adjust(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calcula a taxa de contraste (contrast ratio) entre duas cores hexadecimais (L1 + 0.05) / (L2 + 0.05).
 */
function calculateContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = calculateRelativeLuminance(r1, g1, b1);
  const l2 = calculateRelativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('B1-S01 — Design Tokens (Integridade e Aderência ao DESIGN.md)', () => {
  it('deve conter a paleta primária exata definida no DESIGN.md', () => {
    expect(DESIGN_TOKENS.colors.brand.primary).toBe('#DF2531');
    expect(DESIGN_TOKENS.colors.base.white).toBe('#FFFFFF');
    expect(DESIGN_TOKENS.colors.base.black).toBe('#000000');
  });

  it('deve contemplar as opacidades canônicas de 55% e 35% para Brand Red', () => {
    // 45% transparência = 55% opacidade
    expect(DESIGN_TOKENS.colors.brand.alpha55).toBe('rgba(223, 37, 49, 0.55)');
    // 65% transparência = 35% opacidade
    expect(DESIGN_TOKENS.colors.brand.alpha35).toBe('rgba(223, 37, 49, 0.35)');
    // Sutil 15%
    expect(DESIGN_TOKENS.colors.brand.alpha15).toBe('rgba(223, 37, 49, 0.15)');
  });

  it('deve conter a paleta neutra canônica de modo escuro', () => {
    expect(DESIGN_TOKENS.colors.neutrals.bgDark).toBe('#101013');
    expect(DESIGN_TOKENS.colors.neutrals.surfaceDark).toBe('#1E1E22');
    expect(DESIGN_TOKENS.colors.neutrals.surfaceElevated).toBe('#2B2B31');
    expect(DESIGN_TOKENS.colors.neutrals.borderSubtle).toBe('#2B2B33');
    expect(DESIGN_TOKENS.colors.neutrals.borderFocus).toBe('#DF2531');
  });

  it('deve conter cores semânticas de feedback diferenciadas da cor de marca', () => {
    // Erro crítico (#E53935) é distinto da cor de ação/marca (#DF2531)
    expect(DESIGN_TOKENS.colors.feedback.error).toBe('#E53935');
    expect(DESIGN_TOKENS.colors.feedback.error).not.toBe(DESIGN_TOKENS.colors.brand.primary);

    expect(DESIGN_TOKENS.colors.feedback.success).toBe('#10B981');
    expect(DESIGN_TOKENS.colors.feedback.warning).toBe('#F59E0B');
    expect(DESIGN_TOKENS.colors.feedback.info).toBe('#3B82F6');
  });

  it('deve contemplar a tipografia base Open Sans e a escala tipográfica do DESIGN.md', () => {
    expect(DESIGN_TOKENS.typography.fonts.sans).toContain('Open Sans');
    expect(DESIGN_TOKENS.typography.fonts.mono).toContain('ui-monospace');

    // Escala tipográfica
    expect(DESIGN_TOKENS.typography.scale.display.size).toBe('1.5rem'); // 24px
    expect(DESIGN_TOKENS.typography.scale.h1.size).toBe('1.125rem'); // 18px
    expect(DESIGN_TOKENS.typography.scale.h2.size).toBe('0.9375rem'); // 15px
    expect(DESIGN_TOKENS.typography.scale.body.size).toBe('0.8125rem'); // 13px
    expect(DESIGN_TOKENS.typography.scale.small.size).toBe('0.6875rem'); // 11px
    expect(DESIGN_TOKENS.typography.scale.code.size).toBe('0.75rem'); // 12px
  });

  it('deve conter escala de espaçamento base 4px', () => {
    expect(DESIGN_TOKENS.spacing[1]).toBe('0.25rem'); // 4px
    expect(DESIGN_TOKENS.spacing[2]).toBe('0.5rem'); // 8px
    expect(DESIGN_TOKENS.spacing[3]).toBe('0.75rem'); // 12px
    expect(DESIGN_TOKENS.spacing[4]).toBe('1rem'); // 16px
    expect(DESIGN_TOKENS.spacing[6]).toBe('1.5rem'); // 24px
    expect(DESIGN_TOKENS.spacing[8]).toBe('2rem'); // 32px
  });

  it('deve conter os raios de borda geométricos definidos', () => {
    expect(DESIGN_TOKENS.radii.sm).toBe('4px');
    expect(DESIGN_TOKENS.radii.md).toBe('6px');
    expect(DESIGN_TOKENS.radii.lg).toBe('8px');
    expect(DESIGN_TOKENS.radii.full).toBe('9999px');
  });
});

describe('B1-S01 — Acessibilidade e Contraste Matemático (WCAG 2.2 AA)', () => {
  it('deve validar contraste de Brand Red sobre fundo branco puro (critério WCAG 2.2 AA >= 4.5:1)', () => {
    const ratio = calculateContrastRatio(
      DESIGN_TOKENS.colors.brand.primary,
      DESIGN_TOKENS.colors.base.white
    );

    // Conforme DESIGN.md Seção 10.1: ~4.72:1
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('deve validar contraste altíssimo de Texto Branco sobre Superfície Escura do Side Panel (>= 15:1)', () => {
    const ratio = calculateContrastRatio(
      DESIGN_TOKENS.colors.text.primary,
      DESIGN_TOKENS.colors.neutrals.bgDark
    );

    // Conforme DESIGN.md Seção 10.1: ~18.5:1
    expect(ratio).toBeGreaterThanOrEqual(15.0);
  });

  it('deve validar contraste de Texto Branco sobre Superfície de Cartões (>= 13:1)', () => {
    const ratio = calculateContrastRatio(
      DESIGN_TOKENS.colors.text.primary,
      DESIGN_TOKENS.colors.neutrals.surfaceDark
    );

    expect(ratio).toBeGreaterThanOrEqual(13.0);
  });

  it('deve validar contraste de Texto Secundário (#9CA3AF) sobre Superfície Escura (>= 4.5:1)', () => {
    const ratio = calculateContrastRatio(
      DESIGN_TOKENS.colors.text.secondary,
      DESIGN_TOKENS.colors.neutrals.bgDark
    );

    // WCAG AA requer >= 4.5:1 para texto normal
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('deve validar contraste de Brand Red sobre Fundo Preto (>= 3:1 para elementos de interface/gráficos)', () => {
    const ratio = calculateContrastRatio(
      DESIGN_TOKENS.colors.brand.primary,
      DESIGN_TOKENS.colors.base.black
    );

    // Conforme DESIGN.md Seção 10.1: ~4.45:1
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});
