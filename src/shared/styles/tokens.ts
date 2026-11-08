/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/shared/styles/tokens.ts
 * Responsabilidade: Constantes tipadas dos Design Tokens canônicos (B1-S01).
 *
 * Referência Canônica:
 * - DESIGN.md (Seções 3, 4, 5, 6, 8 e 10)
 *
 * Papel Arquitetural:
 * Fornecer acesso tipado e estático aos valores dos Design Tokens para
 * testes unitários determinísticos, cálculos matemáticos de contraste
 * e integração programática sem violação de fronteiras.
 * ==============================================================================
 */

/**
 * Catálogo canônico dos valores literais dos Design Tokens.
 */
export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: '#DF2531',
      hover: '#C01F2A',
      active: '#A31822',
      alpha55: 'rgba(223, 37, 49, 0.55)',
      alpha35: 'rgba(223, 37, 49, 0.35)',
      alpha15: 'rgba(223, 37, 49, 0.15)',
    },
    base: {
      white: '#FFFFFF',
      black: '#000000',
    },
    neutrals: {
      bgDark: '#101013',
      surfaceDark: '#1E1E22',
      surfaceElevated: '#2B2B31',
      borderSubtle: '#2B2B33',
      borderFocus: '#DF2531',
    },
    feedback: {
      error: '#E53935',
      errorSubtle: 'rgba(229, 57, 53, 0.15)',
      success: '#10B981',
      successSubtle: 'rgba(16, 185, 129, 0.15)',
      warning: '#F59E0B',
      warningSubtle: 'rgba(245, 158, 11, 0.15)',
      info: '#3B82F6',
      infoSubtle: 'rgba(59, 130, 246, 0.15)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
      muted: '#6B7280',
    },
  },
  typography: {
    fonts: {
      sans: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      mono: "ui-monospace, 'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, 'Courier New', monospace",
      display: "Mokoto, 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    scale: {
      display: { size: '1.5rem', lineHeight: '2rem' }, // 24px / 32px
      h1: { size: '1.125rem', lineHeight: '1.625rem' }, // 18px / 26px
      h2: { size: '0.9375rem', lineHeight: '1.375rem' }, // 15px / 22px
      body: { size: '0.8125rem', lineHeight: '1.125rem' }, // 13px / 18px
      small: { size: '0.6875rem', lineHeight: '1rem' }, // 11px / 16px
      code: { size: '0.75rem', lineHeight: '1.125rem' }, // 12px / 18px
    },
  },
  spacing: {
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
  },
  radii: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px',
  },
  transitions: {
    durationFast: '150ms',
    durationNormal: '200ms',
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
