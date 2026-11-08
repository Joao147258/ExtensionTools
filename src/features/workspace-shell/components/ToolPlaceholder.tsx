import type { ReactNode } from 'react';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/components/ToolPlaceholder.tsx
 * Responsabilidade: Representação provisória reutilizável para ferramentas em desenvolvimento.
 *
 * Papel Arquitetural:
 * Componente genérico apresentacional (Reusable Presentational Component).
 * Evita a duplicação de páginas vazias para ferramentas ainda não construídas (DRY),
 * fornecendo feedback claro e acessível ao usuário dentro do Workspace Shell.
 *
 * Acessibilidade:
 * - Seção delimitada com `aria-label` contendo o nome da ferramenta.
 * - Tratamento de ícone opcional como elemento puramente decorativo (`aria-hidden="true"`).
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
    <section
      aria-label={name}
      className="flex min-w-0 flex-col items-center justify-center rounded-lg border border-[#2B2B33] bg-[#1E1E22] px-6 py-10 text-center shadow-xs"
    >
      {icon != null && (
        <div
          aria-hidden="true"
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#2B2B33] bg-[#2B2B31] text-[#DF2531]"
        >
          {icon}
        </div>
      )}

      <h2 className="text-base font-semibold tracking-tight text-white">{name}</h2>

      {description && (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#9CA3AF]">{description}</p>
      )}

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#2B2B33] bg-[#101013] px-3 py-1 text-xs font-medium text-[#DF2531]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#DF2531]" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </section>
  );
}
