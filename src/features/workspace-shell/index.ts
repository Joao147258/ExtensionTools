/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/index.ts
 * Responsabilidade: Interface pública e ponto de entrada canônico da feature Workspace Shell.
 *
 * Diretrizes Arquiteturais (ARC-R02):
 * - Consumidores externos (entrypoints ou outras features autorizadas) devem
 *   importar exclusivamente a partir deste arquivo de índice.
 * - Detalhes internos de apresentação estrutural (como WorkspaceHeader e WorkspaceContent)
 *   permanecem encapsulados e não são exportados publicamente.
 * ==============================================================================
 */

// 1. Componente principal de casca estrutural
export { WorkspaceShell } from './components/WorkspaceShell';
export type { WorkspaceShellProps } from './components/WorkspaceShell';

// 2. Componente de representação provisória reutilizável
export { ToolPlaceholder } from './components/ToolPlaceholder';
export type { ToolPlaceholderProps } from './components/ToolPlaceholder';

// 3. Mecanismo de contenção de falhas de renderização
export { RenderErrorBoundary } from './components/RenderErrorBoundary';
export type {
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState,
} from './components/RenderErrorBoundary';
