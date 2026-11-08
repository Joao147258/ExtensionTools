/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/tool-navigation/index.ts
 * Responsabilidade: Interface pública canônica da feature Tool Navigation (B1-F02).
 *
 * Diretrizes Arquiteturais (ARC-R02):
 * - Consumidores externos (entrypoints ou outras features autorizadas) devem
 *   consumir exclusivamente a partir deste arquivo de índice.
 * - Detalhes internos de renderização atômica (como NavigationItem) permanecem
 *   encapsulados para preservar a modularidade da feature.
 * ==============================================================================
 */

// 1. Componente principal controlado de navegação
export { ToolNavigation } from './components/ToolNavigation';

// 2. Contratos públicos de tipos
export type {
  NavigationDestination,
  ToolNavigationProps,
  CanonicalToolId,
} from './navigation.types';
