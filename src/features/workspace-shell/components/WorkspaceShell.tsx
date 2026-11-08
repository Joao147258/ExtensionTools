import type { ReactNode } from 'react';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceContent } from './WorkspaceContent';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/components/WorkspaceShell.tsx
 * Responsabilidade: Componente estrutural principal e casca permanente do Side Panel.
 *
 * Papel Arquitetural:
 * Componente de composição estrutural (Structural Composition Root da feature).
 * Organiza verticalmente as três regiões fundamentais da interface:
 * 1. Cabeçalho fixo (WorkspaceHeader)
 * 2. Região de navegação desacoplada (recebida externamente via `navigation`)
 * 3. Região de conteúdo dinâmico (WorkspaceContent, recebido via `children`)
 *
 * Invariantes Arquiteturais:
 * - Não importa ferramentas concretas (TextDiff, JsonInspector, XmlInspector, etc.).
 * - Não decide qual ferramenta está selecionada.
 * - Não acessa nem persiste dados no navegador.
 * - Depende unicamente de componentes internos da feature e de contratos ReactNode.
 * ==============================================================================
 */

/**
 * Contrato de composição pública do WorkspaceShell.
 */
export type WorkspaceShellProps = {
  /** Elemento ou componente responsável pela navegação entre ferramentas */
  navigation: ReactNode;
  /** Conteúdo ou ferramenta ativa a ser exibida na área de trabalho */
  children: ReactNode;
};

/**
 * Casca estrutural visual permanente do ExtensionTools.
 *
 * Garante confinamento dimensional no Side Panel do navegador, prevenindo
 * transbordamento horizontal indesejado e mantendo o cabeçalho e a barra de
 * navegação fixos enquanto a área de conteúdo oferece rolagem independente.
 */
export function WorkspaceShell({ navigation, children }: WorkspaceShellProps) {
  return (
    <div
      className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-[#101013] text-white"
      data-testid="workspace-shell"
    >
      {/* 1. Cabeçalho permanente de identificação do produto */}
      <WorkspaceHeader />

      {/* 2. Container interno flexível */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Região reservada à navegação externa */}
        <div className="shrink-0 border-b border-[#2B2B33] bg-[#1E1E22] px-4 py-2.5">
          {navigation}
        </div>

        {/* Região dedicada ao conteúdo da ferramenta ativa */}
        <WorkspaceContent>{children}</WorkspaceContent>
      </div>
    </div>
  );
}
