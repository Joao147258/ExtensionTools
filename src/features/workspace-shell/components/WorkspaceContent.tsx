import type { ReactNode } from 'react';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/components/WorkspaceContent.tsx
 * Responsabilidade: Delimitação e controle da região destinada ao conteúdo selecionado.
 *
 * Papel Arquitetural:
 * Componente estrutural de apresentação independente de conteúdo (Component Composition).
 * Utiliza o padrão `children` como contrato para acolher qualquer elemento React
 * sem necessidade de conhecer o tipo de ferramenta apresentada ou regras de domínio.
 *
 * Invariantes Técnicas:
 * - Não executa processamento de dados (parsing, diff, validação).
 * - Não consulta nem manipula o estado da ferramenta ativa.
 * - Gerencia o container de rolagem vertical (overflow-y-auto) de forma isolada.
 * ==============================================================================
 */

/**
 * Contrato de propriedades do WorkspaceContent.
 */
export type WorkspaceContentProps = {
  /** Conteúdo dinâmico a ser renderizado na área principal de trabalho */
  children: ReactNode;
};

/**
 * Região estrutural de apresentação do conteúdo principal.
 *
 * Provê rolagem vertical independente e contenção dimensional para evitar
 * expansão horizontal indevida ou transbordamento no Side Panel.
 */
export function WorkspaceContent({ children }: WorkspaceContentProps) {
  return (
    <main
      id="workspace-content"
      className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#101013] px-4 py-4 text-white"
    >
      {children}
    </main>
  );
}
