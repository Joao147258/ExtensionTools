/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/shared/ui/types.ts
 * Responsabilidade: Tipos e interfaces compartilhadas do Design System (Bloco 2).
 *
 * Referência Canônica:
 * - DESIGN.md (Seção 4, 5 e 6)
 * - docs/Relatorios/m3/Bloco_2/Planejamento/02-CONTRATOS-E-CONVENCOES.md
 * ==============================================================================
 */

/**
 * Escala padronizada de densidade visual para controles interativos.
 * Conforme DESIGN.md: 'sm' (28px base) e 'md' (32px base).
 */
export type VisualSize = 'sm' | 'md';

/**
 * Interface base para controles de formulário que implementam amarração acessível
 * entre label, controle, dica e mensagem de erro com React 19 useId().
 */
export interface FormFieldA11yProps {
  /** Rótulo textual visível obrigatoriamente associado ao controle */
  label?: string;
  /** Texto de apoio ou orientação exibido abaixo do controle */
  hint?: string;
  /** Mensagem de erro que ativa estado de validação inválido (aria-invalid) */
  error?: string;
  /** Oculta visualmente o rótulo mantendo-o acessível para leitores de tela */
  hideLabel?: boolean;
}
