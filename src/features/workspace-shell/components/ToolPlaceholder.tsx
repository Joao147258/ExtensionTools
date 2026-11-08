import type { ReactNode } from 'react';
import { Badge, Panel } from '../../../shared/ui';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/components/ToolPlaceholder.tsx
 * Responsabilidade: Representação integrada de ferramentas em desenvolvimento.
 *
 * Papel Arquitetural:
 * Componente apresentacional reutilizável dentro do Workspace Shell.
 * Integrado ao Design System do Bloco 2 através do consumo de Panel e Badge
 * da API pública (src/shared/ui).
 *
 * Acessibilidade:
 * - Seção estrutural delimitada com `aria-label` contendo o nome da ferramenta.
 * - Ícone tratado como elemento puramente decorativo (`aria-hidden="true"`).
 * - Mensagem de status exibida via Badge semântico.
 * ==============================================================================
 */

/**
 * Contrato de propriedades do ToolPlaceholder.
 */
export type ToolPlaceholderProps = {
  /** Nome legível da ferramenta (ex.: "Comparador de Textos", "Inspetor JSON") */
  name: string;
  /** Descrição resumida da finalidade da ferramenta */
  description?: string;
  /** Mensagem contextual sobre o estado da funcionalidade (possui valor padrão) */
  message?: string;
  /** Ícone ou elemento gráfico opcional decorativo */
  icon?: ReactNode;
};

/**
 * Componente genérico para exibição de ferramentas pendentes de implementação.
 */
export function ToolPlaceholder({
  name,
  description,
  message = 'Funcionalidade em desenvolvimento.',
  icon,
}: ToolPlaceholderProps) {
  return (
    <Panel
      as="section"
      aria-label={name}
      surface="secondary"
      padding="lg"
      className="flex min-w-0 flex-col items-center justify-center text-center shadow-xs"
    >
      {icon != null && (
        <div
          aria-hidden="true"
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-default bg-surface-elevated text-brand-primary"
        >
          {icon}
        </div>
      )}

      <h2 className="text-base font-semibold tracking-tight text-text-primary">{name}</h2>

      {description && (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-secondary">{description}</p>
      )}

      <div className="mt-4">
        <Badge tone="danger">{message}</Badge>
      </div>
    </Panel>
  );
}
