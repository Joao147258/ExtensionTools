/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/shared/styles/__tests__/visual-foundation.test.ts
 * Responsabilidade: Testes estruturais dos arquivos CSS da Visual Foundation (B1-S01).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('B1-S01 — Visual Foundation CSS & Integração', () => {
  const tokensCssPath = path.resolve(process.cwd(), 'src/shared/styles/tokens.css');
  const globalsCssPath = path.resolve(process.cwd(), 'src/shared/styles/globals.css');
  const entrypointCssPath = path.resolve(process.cwd(), 'src/entrypoints/sidepanel/style.css');

  it('deve ter o arquivo tokens.css com definição formal no :root e integração @theme', () => {
    expect(fs.existsSync(tokensCssPath)).toBe(true);
    const content = fs.readFileSync(tokensCssPath, 'utf-8');

    // Tokens essenciais no :root
    expect(content).toContain(':root');
    expect(content).toContain('--et-color-brand-primary: #df2531;');
    expect(content).toContain('--et-color-bg-dark: #101013;');
    expect(content).toContain('--et-color-surface-dark: #1e1e22;');
    expect(content).toContain('--et-color-surface-elevated: #2b2b31;');
    expect(content).toContain('--et-color-border-subtle: #2b2b33;');
    expect(content).toContain('--et-color-border-focus: #df2531;');
    expect(content).toContain('--et-color-feedback-error: #e53935;');
    expect(content).toContain('--et-color-feedback-success: #10b981;');
    expect(content).toContain('--et-font-sans:');
    expect(content).toContain('Open Sans');

    // Diretiva @theme para Tailwind 4
    expect(content).toContain('@theme');
    expect(content).toContain('--color-brand-primary: #df2531;');
    expect(content).toContain('--color-surface-dark: #1e1e22;');
    expect(content).toContain('--color-bg-dark: #101013;');
  });

  it('deve ter o arquivo globals.css com resets, tipografia, foco e acessibilidade de movimento', () => {
    expect(fs.existsSync(globalsCssPath)).toBe(true);
    const content = fs.readFileSync(globalsCssPath, 'utf-8');

    // Importação dos tokens
    expect(content).toContain("@import './tokens.css';");

    // Resets do Side Panel
    expect(content).toContain('html,');
    expect(content).toContain('body,');
    expect(content).toContain('#root');
    expect(content).toContain('overflow: hidden;');

    // Configuração do body
    expect(content).toContain('background-color: var(--et-color-bg-dark, #101013);');
    expect(content).toContain('color: var(--et-color-text-primary, #ffffff);');
    expect(content).toContain('font-family: var(--et-font-sans);');

    // Foco visível acessível (WCAG 2.2 AA)
    expect(content).toContain(':focus-visible');
    expect(content).toContain('outline: 2px solid var(--et-color-border-focus, #df2531);');
    expect(content).toContain('outline-offset: 2px;');

    // Respeito a prefers-reduced-motion
    expect(content).toContain('@media (prefers-reduced-motion: reduce)');
    expect(content).toContain('animation-duration: 0.01ms !important;');
    expect(content).toContain('transition-duration: 0.01ms !important;');

    // Adaptação dimensional para evitar overflow
    expect(content).toContain('overflow-wrap: anywhere;');
  });

  it('deve importar os estilos compartilhados no entrypoint do Side Panel (style.css)', () => {
    expect(fs.existsSync(entrypointCssPath)).toBe(true);
    const content = fs.readFileSync(entrypointCssPath, 'utf-8');

    expect(content).toContain("@import 'tailwindcss';");
    expect(content).toContain("@import '../../shared/styles/globals.css';");
  });
});
