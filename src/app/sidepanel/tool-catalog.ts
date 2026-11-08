/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/app/sidepanel/tool-catalog.ts
 * Responsabilidade: Catálogo estático e metadados de navegação da interface do Side Panel.
 *
 * Papel Arquitetural (B1-C01):
 * Define os metadados de apresentação utilizados pela composição do Side Panel.
 *
 * Invariantes Arquiteturais:
 * - Não importa implementações de ferramentas, serviços ou algoritmos de domínio.
 * - Fornece identificadores únicos, imutáveis e estáveis (readonly).
 * - Provê tipagem estrita para a seleção inicial válida (`DEFAULT_TOOL_ID`).
 * - Oferece função de guarda de tipo (`isToolId`) para proteção e integridade da composição.
 * ==============================================================================
 */

import type { CanonicalToolId, NavigationDestination } from '../../features/tool-navigation';

/**
 * Metadados de apresentação de cada destino no catálogo do Side Panel.
 */
export interface ToolDescriptor extends NavigationDestination {
  readonly id: CanonicalToolId;
  readonly label: string;
  readonly description: string;
  readonly disabled?: boolean;
}

/**
 * Catálogo canônico estático dos destinos disponíveis no Side Panel do ExtensionTools.
 * A presença no catálogo expressa capacidade de navegação e metadados visuais,
 * não implicando que a funcionalidade de domínio esteja concluída.
 */
export const TOOL_CATALOG = [
  {
    id: 'text-diff',
    label: 'Text Diff',
    description: 'Comparação visual e análise de diferenças entre textos.',
  },
  {
    id: 'json-inspector',
    label: 'JSON Inspector',
    description: 'Inspeção, formatação e validação de documentos JSON.',
  },
  {
    id: 'xml-inspector',
    label: 'XML Inspector',
    description: 'Exploração estruturada e validação de árvores XML.',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Editor, visualizador e exportador de conteúdo Markdown.',
  },
  {
    id: 'quick-files',
    label: 'Quick Files',
    description: 'Acesso rápido e organização de arquivos de trabalho.',
    disabled: true,
  },
] as const satisfies readonly ToolDescriptor[];

/**
 * União derivada dos identificadores registrados no catálogo estático.
 */
export type ToolId = (typeof TOOL_CATALOG)[number]['id'];

/**
 * Identificador padrão utilizado na inicialização da seleção ativa.
 */
export const DEFAULT_TOOL_ID: ToolId = TOOL_CATALOG[0].id;

/**
 * Valida em tempo de execução se uma string corresponde a um destino registrado no catálogo.
 *
 * @param value Identificador a ser validado.
 * @returns Retorna true se o identificador existir no catálogo estático.
 */
export function isToolId(value: string): value is ToolId {
  return TOOL_CATALOG.some((tool) => tool.id === value);
}

/**
 * Localiza o descritor de metadados correspondente ao identificador fornecido.
 * Possui comportamento defensivo com fallback para a primeira ferramenta cadastrada.
 *
 * @param toolId Identificador da ferramenta a buscar.
 * @returns Descritor da ferramenta encontrada ou fallback seguro.
 */
export function getToolDescriptor(toolId: string): ToolDescriptor {
  const found = TOOL_CATALOG.find((tool) => tool.id === toolId);
  return found ?? TOOL_CATALOG[0];
}
