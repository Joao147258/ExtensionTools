import type { ReactNode } from 'react';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/tool-navigation/navigation.types.ts
 * Responsabilidade: Contratos TypeScript da feature Tool Navigation (B1-F02).
 *
 * Princípios de Design:
 * - Contratos pequenos, estritos, imutáveis (readonly) e independentes das ferramentas.
 * - Restrição semântica de destinos aprovados no catálogo canônico do produto.
 * - Desacoplamento completo em relação a algoritmos, armazenamento e runtime WXT.
 * ==============================================================================
 */

/**
 * Identificadores estáveis das 12 ferramentas canônicas aprovadas no catálogo do ExtensionTools.
 */
export type CanonicalToolId =
  | 'text-diff'
  | 'json-inspector'
  | 'xml-inspector'
  | 'markdown'
  | 'quick-files'
  | 'snippet-library'
  | 'pdf-export'
  | 'tab-workspaces'
  | 'calendar'
  | 'reference-hub'
  | 'evidence-capture'
  | 'investigation-board';

/**
 * Representa um destino navegável individual disponível na interface.
 * Não conhece detalhes de implementação ou ciclo de vida da ferramenta.
 */
export interface NavigationDestination {
  /** Identificador estável e único do destino */
  readonly id: string;
  /** Nome amigável de exibição */
  readonly label: string;
  /** Descrição resumida da finalidade do destino (opcional) */
  readonly description?: string;
  /** Elemento ou ícone decorativo (opcional) */
  readonly icon?: ReactNode;
  /** Indica se o destino está temporariamente desabilitado */
  readonly disabled?: boolean;
}

/**
 * Contrato de propriedades do componente ToolNavigation.
 * Opera como componente puramente controlado (Controlled Component).
 */
export interface ToolNavigationProps {
  /** Coleção de destinos disponíveis para renderização */
  readonly tools: readonly NavigationDestination[];
  /** Identificador do destino atualmente ativo (ou null se nenhum estiver selecionado) */
  readonly activeToolId: string | null;
  /** Callback acionado quando um destino habilitado é selecionado pelo usuário */
  readonly onSelectTool: (toolId: string) => void;
  /** Orientação do fluxo da lista: 'horizontal' (padrão em barras de topo) ou 'vertical' */
  readonly orientation?: 'horizontal' | 'vertical';
}
