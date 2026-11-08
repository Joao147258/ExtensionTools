/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/app/sidepanel/SidePanelApp.tsx
 * Responsabilidade: Ponto de composição da interface do Side Panel (Composition Root B1-C01).
 *
 * Papel Arquitetural:
 * - Coordenar a experiência visual integrando B1-F01 (Workspace Shell) e B1-F02 (Tool Navigation).
 * - Manter a seleção ativa com uma ÚNICA fonte de verdade (`activeToolId`).
 * - Validar solicitações de navegação contra o catálogo estático.
 * - Renderizar o conteúdo correspondente dentro da casca permanente sem desmontagens desnecessárias.
 *
 * Invariantes Arquiteturais:
 * - Não implementa algoritmos de ferramentas nem processamentos de arquivos.
 * - Não cria múltiplos estados concorrentes para navegação e conteúdo.
 * - Preserva o isolamento de fronteiras das features.
 * ==============================================================================
 */

import { useState } from 'react';
import {
  WorkspaceShell,
  ToolPlaceholder,
  RenderErrorBoundary,
} from '../../features/workspace-shell';
import { ToolNavigation } from '../../features/tool-navigation';
import {
  TOOL_CATALOG,
  DEFAULT_TOOL_ID,
  isToolId,
  getToolDescriptor,
  type ToolId,
} from './tool-catalog';

/**
 * Ponto central de composição da interface do Side Panel.
 */
export function SidePanelApp() {
  /**
   * Fonte única de verdade para a ferramenta selecionada na aplicação.
   */
  const [activeToolId, setActiveToolId] = useState<ToolId>(DEFAULT_TOOL_ID);

  /**
   * Metadados da ferramenta ativa derivados do catálogo estático a partir do estado único.
   * Não duplica estado.
   */
  const activeTool = getToolDescriptor(activeToolId);

  /**
   * Trata solicitações de navegação emitidas pela ToolNavigation.
   * Valida a integridade do destino e impede a ativação de ferramentas desabilitadas.
   */
  function handleSelectTool(toolId: string) {
    if (!isToolId(toolId)) {
      return;
    }

    const descriptor = getToolDescriptor(toolId);
    if (descriptor.disabled) {
      return;
    }

    setActiveToolId(toolId);
  }

  return (
    <WorkspaceShell
      navigation={
        <ToolNavigation
          tools={TOOL_CATALOG}
          activeToolId={activeToolId}
          onSelectTool={handleSelectTool}
        />
      }
    >
      {/* key={activeToolId} garante montagem e reset limpo do Error Boundary na troca de ferramenta */}
      <RenderErrorBoundary key={activeToolId}>
        <ToolPlaceholder
          name={activeTool.label}
          description={activeTool.description}
          message={
            activeTool.id === 'text-diff'
              ? 'Funcionalidade piloto em desenvolvimento (M4).'
              : 'Funcionalidade planejada para o Bloco A de Features (M5).'
          }
        />
      </RenderErrorBoundary>
    </WorkspaceShell>
  );
}
