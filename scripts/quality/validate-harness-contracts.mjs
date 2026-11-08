/**
 * @file validate-harness-contracts.mjs
 * @description Validador programático e normativo dos Contratos de Execução e Políticas do Harness ExtensionTools.
 *
 * Responsabilidades:
 * 1. Verificar a existência e integridade física de todos os contratos canônicos em .harness/contracts/.
 * 2. Verificar a existência e integridade física de todas as políticas canônicas em .harness/policies/.
 * 3. Validar blocos de metadados normativos (identificadores, versão, classificação, guardiões).
 * 4. Assegurar presença das seções normativas obrigatórias em cada documento.
 * 5. Verificar a declaração das interfaces e tipos TypeScript nos contratos funcionais.
 * 6. Auditar a consistência dos catálogos nos arquivos README.md e a integridade de links relativos.
 * 7. Detectar caminhos absolutos privados ou termos não autorizados (Safe-by-Default).
 * 8. Impedir dispersão documental e arquivos inesperados nos diretórios normativos.
 * 9. Fornecer primitivas para validação em runtime (Nível 3) de payloads de agentes.
 *
 * Contrato de Códigos de Saída (Exit Codes):
 * - 0: Validação concluída com sucesso sem violações de conformidade.
 * - 1: Violação de conformidade detectada (arquivo ausente, metadados inválidos, seção faltante, link quebrado).
 * - 2: Erro operacional, parâmetros inválidos ou falha de leitura I/O que impeça a validação segura.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../lib/logger.mjs';
import { normalizePath } from '../lib/fs-utils.mjs';

/**
 * Lista dos 9 agentes canônicos homologados no ecossistema do Harness.
 */
export const CANONICAL_AGENTS = [
  'orchestrator',
  'architect',
  'developer',
  'code-reviewer',
  'test-engineer',
  'security-auditor',
  'documentation-engineer',
  'script-engineer',
  'release-engineer',
  'file-system-engineer',
];

/**
 * Lista das skills canônicas homologadas no ecossistema do Harness.
 */
export const CANONICAL_SKILLS = [
  'implementation',
  'architecture-review',
  'code-review',
  'testing',
  'security-audit',
  'public-repository-safety',
  'documentation',
  'script-development',
  'release-validation',
  'file-system-access',
];

/**
 * Modos de execução autorizados para o envelope de entrada do agente.
 */
export const CANONICAL_EXECUTION_MODES = [
  'INVESTIGATION',
  'PLANNING',
  'IMPLEMENTATION',
  'VERIFICATION',
  'REVIEW',
];

/**
 * Estados terminais autorizados para o envelope de saída do agente.
 */
export const CANONICAL_TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'BLOCKED', 'ABORTED'];

/**
 * Especificação dos Contratos Canônicos (.harness/contracts/).
 */
export const CANONICAL_CONTRACTS = {
  'README.md': {
    id: null,
    isIndex: true,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      Módulo: '.harness/contracts/',
      Milestone: 'M2 — Harness Engineering & Governance',
      Fase: 'M2-PHASE-3 (Contratos de Execução e Políticas do Harness)',
    },
    requiredSections: [
      '1. Finalidade e Princípios de Arquitetura',
      '2. Catálogo Canônico dos Contratos de Execução',
      '3. Fluxo Integrado de Comunicação e Ciclo de Vida',
      '4. Máquina de Estados Determinística da Tarefa',
      '5. Relação entre Contratos, Políticas e Evidências',
      '6. Níveis de Validação dos Contratos',
      '7. Versionamento e Procedimento de Evolução',
    ],
  },
  'task-contract.md': {
    id: 'CONTRACT-TASK-V1',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador do Contrato': 'CONTRACT-TASK-V1',
      Versão: '1.0.0',
      Status: 'CANÔNICO E VIGENTE',
      'Papéis Relacionados': 'Orchestrator',
    },
    requiredSections: [
      '1. Finalidade e Responsabilidade',
      '2. Especificação Estruturada do Contrato',
      '3. Invariantes e Regras de Validade',
      '4. Ciclo de Vida da Tarefa',
      '5. Exemplos Sintéticos',
      '6. Tratamento de Erros e Impedimentos',
    ],
    requiredTypes: ['TaskContract', 'CanonicalAgentId', 'CanonicalSkillId', 'SafetyLevel'],
  },
  'agent-input-contract.md': {
    id: 'CONTRACT-AGENT-INPUT-V1',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador do Contrato': 'CONTRACT-AGENT-INPUT-V1',
      Versão: '1.0.0',
      Status: 'CANÔNICO E VIGENTE',
      'Papéis Relacionados': 'Orchestrator',
    },
    requiredSections: [
      '1. Finalidade e Responsabilidade',
      '2. Especificação Estruturada do Contrato',
      '3. Invariantes e Regras de Validade',
      '4. Exemplos Sintéticos',
      '5. Tratamento de Erros e Falhas de Entrada',
    ],
    requiredTypes: ['AgentInput', 'ExecutionMode'],
  },
  'agent-output-contract.md': {
    id: 'CONTRACT-AGENT-OUTPUT-V1',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador do Contrato': 'CONTRACT-AGENT-OUTPUT-V1',
      Versão: '1.0.0',
      Status: 'CANÔNICO E VIGENTE',
      'Papéis Relacionados': 'Agentes Especializados Executores',
    },
    requiredSections: [
      '1. Finalidade e Responsabilidade',
      '2. Especificação Estruturada do Contrato',
      '3. Modelo Canônico de Evidências (`EvidenceModel`)',
      '4. Invariantes e Regras de Validade',
      '5. Exemplos Sintéticos',
    ],
    requiredTypes: ['AgentOutput', 'EvidenceModel', 'TaskExecutionStatus'],
  },
  'skill-context-contract.md': {
    id: 'CONTRACT-SKILL-CONTEXT-V1',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador do Contrato': 'CONTRACT-SKILL-CONTEXT-V1',
      Versão: '1.0.0',
      Status: 'CANÔNICO E VIGENTE',
      'Papéis Relacionados': 'Agentes Especializados Executores e Skills Canônicas',
    },
    requiredSections: [
      '1. Finalidade e Responsabilidade',
      '2. Especificação Estruturada do Contrato',
      '3. Invariantes e Regras de Validade',
      '4. Exemplos Sintéticos',
      '5. Tratamento de Erros',
    ],
    requiredTypes: ['SkillContext'],
  },
  'impediment-contract.md': {
    id: 'CONTRACT-IMPEDIMENT-V1',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador do Contrato': 'CONTRACT-IMPEDIMENT-V1',
      Versão: '1.0.0',
      Status: 'CANÔNICO E VIGENTE',
      'Papéis Relacionados': 'Agentes Especializados Executores',
    },
    requiredSections: [
      '1. Finalidade e Responsabilidade',
      '2. Especificação Estruturada do Contrato',
      '3. Invariantes e Regras de Validade',
      '4. Procedimento de Retomada e Recuperação (Desbloqueio)',
      '5. Exemplos Sintéticos',
      '6. Tratamento de Falhas',
    ],
    requiredTypes: ['ImpedimentReport', 'ImpedimentCategory', 'ImpedimentSeverity'],
  },
};

/**
 * Especificação das Políticas Canônicas (.harness/policies/).
 */
export const CANONICAL_POLICIES = {
  'README.md': {
    id: null,
    isIndex: true,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      Módulo: '.harness/policies/',
      Milestone: 'M2 — Harness Engineering & Governance',
      Fase: 'M2-PHASE-3 (Contratos de Execução e Políticas do Harness)',
    },
    requiredSections: [
      '1. Finalidade e Princípios de Governança',
      '2. Catálogo das Dez Políticas Canônicas',
      '3. Matriz de Integração: Agentes, Skills, Contratos e Políticas',
      '4. Hierarquia Normativa e Ordem de Precedência',
      '5. Procedimentos de Revisão e Evolução',
    ],
  },
  'repository-safety.md': {
    id: 'POL-SEC-01',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-SEC-01',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'security-auditor',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Responsabilidades e Papéis',
      '4. Regras Obrigatórias e Proibições Absolutas',
      '5. Condições de Ativação',
      '6. Procedimentos e Comportamentos Esperados',
      '7. Tratamento de Violações e Impedimentos',
      '8. Critérios Verificáveis de Conformidade (QG-01)',
      '9. Referências Cruzadas',
    ],
  },
  'agent-execution-boundaries.md': {
    id: 'POL-SEC-02',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-SEC-02',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'orchestrator',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Matriz de Autoridade e Permissões por Papel',
      '4. Regras Obrigatórias e Proibições Absolutas',
      '5. Condições de Ativação',
      '6. Procedimentos e Comportamentos Esperados',
      '7. Tratamento de Violações e Impedimentos',
      '8. Critérios Verificáveis de Conformidade',
      '9. Referências Cruzadas',
    ],
  },
  'destructive-operations.md': {
    id: 'POL-SEC-03',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-SEC-03',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'script-engineer',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Comandos e Operações Estritamente Proibidos',
      '4. Comportamentos Operacionais Autorizados',
      '5. Salvaguarda Fail-Closed e Proteção de Diretórios Críticos',
      '6. Tratamento de Violações e Incidentes',
      '7. Critérios Verificáveis de Conformidade',
      '8. Referências Cruzadas',
    ],
  },
  'architecture-governance.md': {
    id: 'POL-ENG-01',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-ENG-01',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'architect',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Direção Canônica de Dependências (Fluxo Unidirecional)',
      '4. Filosofia Local-First e Princípio de Complexidade Proporcional',
      '5. Governança de Decisões Arquiteturais (ADRs)',
      '6. Procedimentos e Comportamentos Esperados',
      '7. Tratamento de Violações e Bloqueios',
      '8. Critérios Verificáveis de Conformidade (QG-02)',
      '9. Referências Cruzadas',
    ],
  },
  'code-quality.md': {
    id: 'POL-ENG-02',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-ENG-02',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'developer',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Padrões Mandatórios de Tipagem e TypeScript',
      '4. Padrões de Componentes React 19 e UI',
      '5. Padrões de Estilo, Linters e Documentação Inline',
      '6. Procedimentos e Comportamentos Esperados',
      '7. Tratamento de Violações e Bloqueios',
      '8. Critérios Verificáveis de Conformidade (QG-03)',
      '9. Referências Cruzadas',
    ],
  },
  'testing-strategy.md': {
    id: 'POL-ENG-03',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-ENG-03',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'test-engineer',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Pirâmide de Testes e Distribuição de Esforço',
      '4. Princípios Inegociáveis de Determinismo e Isolamento',
      '5. Obrigatoriedade de Testes Negativos e Casos Extremos',
      '6. Procedimentos e Comportamentos Esperados',
      '7. Tratamento de Violações e Bloqueios',
      '8. Critérios Verificáveis de Conformidade (QG-04)',
      '9. Referências Cruzadas',
    ],
  },
  'script-standards.md': {
    id: 'POL-ENG-04',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-ENG-04',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'script-engineer',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Padrões Técnicos e Arquitetura de Módulos ESM',
      '4. Contrato Universal de Códigos de Saída (Exit Codes)',
      '5. Princípios de Resiliência e Tratamento de Erros',
      '6. Obrigatoriedade de Testes Automatizados',
      '7. Critérios Verificáveis de Conformidade (QG-06)',
      '8. Referências Cruzadas',
    ],
  },
  'documentation-governance.md': {
    id: 'POL-GOV-01',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-GOV-01',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'documentation-engineer',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Regra Inegociável Anti-Dispersão de Relatórios',
      '4. Padrões de Links, Referências e Integridade Semântica',
      '5. Idioma e Padrão de Redação Técnica',
      '6. Procedimentos de Atualização de Documentos Canônicos',
      '7. Tratamento de Violações e Bloqueios',
      '8. Critérios Verificáveis de Conformidade (QG-10)',
      '9. Referências Cruzadas',
    ],
  },
  'human-approvals.md': {
    id: 'POL-GOV-02',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-GOV-02',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'orchestrator',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Delimitação de Autonomia Operacional',
      '4. Procedimento Operacional diante de um Checkpoint',
      '5. Proibição de Auto-Aprovação e Bypass',
      '6. Procedimento de Retomada pós-Aprovação',
      '7. Critérios Verificáveis de Conformidade',
      '8. Referências Cruzadas',
    ],
  },
  'external-distribution.md': {
    id: 'POL-DIST-01',
    isIndex: false,
    requiredMetadata: {
      Projeto: 'ExtensionTools',
      Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
      'Identificador da Política': 'POL-DIST-01',
      Versão: '1.0.0',
      Status: 'CANÔNICA E VIGENTE',
      'Agente Guardião': 'release-engineer',
    },
    requiredSections: [
      '1. Identificação e Finalidade',
      '2. Escopo de Aplicação',
      '3. Bloqueio Contínuo Safe-by-Default até o Milestone M8',
      '4. Governança de Permissões no Manifest V3 (Princípio do Menor Privilégio — QG-09)',
      '5. Requisitos de Integridade do Pacote Distribuível (QG-11)',
      '6. Procedimentos de Verificação Pré-Release (Preflight Checklist)',
      '7. Tratamento de Violações e Bloqueios',
      '8. Critérios Verificáveis de Conformidade (QG-08, QG-09, QG-11)',
      '9. Referências Cruzadas',
    ],
  },
};

/**
 * Extrai pares chave-valor do bloco de citação de metadados no início de um arquivo Markdown.
 *
 * Exemplo de bloco reconhecido:
 * > **Projeto:** ExtensionTools
 * > **Identificador do Contrato:** `CONTRACT-TASK-V1`
 *
 * @param {string} content - Conteúdo completo do arquivo Markdown.
 * @returns {{ metadata: Record<string, string> | null, error: string | null }}
 */
export function parseMetadataBlock(content) {
  if (typeof content !== 'string') {
    return { metadata: null, error: 'Conteúdo deve ser uma string válida.' };
  }

  const lines = content.split('\n');
  const metadata = {};
  let foundBlock = false;
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('>')) {
      inBlock = true;
      foundBlock = true;
      const stripped = line.replace(/^>\s*/, '').trim();

      // Padrão: **Chave:** Valor
      const match = stripped.match(/^\*\*([^*:]+):\*\*\s*(.*)$/);
      if (match) {
        const rawKey = match[1].trim();
        const rawVal = match[2].trim().replace(/`/g, '');
        metadata[rawKey] = rawVal;
      }
    } else if (inBlock) {
      // O bloco termina na primeira linha que não começa com '>'
      break;
    }
  }

  if (!foundBlock || Object.keys(metadata).length === 0) {
    return {
      metadata: null,
      error: 'Bloco de metadados em citação Markdown (> **Campo:** Valor) ausente ou malformado.',
    };
  }

  return { metadata, error: null };
}

/**
 * Valida a presença e exatidão dos metadados normativos exigidos em um documento.
 *
 * @param {Record<string, string>} metadata - Metadados extraídos.
 * @param {Record<string, string>} requiredMetadata - Metadados esperados.
 * @param {string} fileName - Nome do arquivo para diagnóstico.
 * @returns {Array<{ rule: string, details: string }>} Lista de violações encontradas.
 */
export function validateMetadata(metadata, requiredMetadata, fileName) {
  const violations = [];

  for (const [key, expectedVal] of Object.entries(requiredMetadata)) {
    const actualVal = metadata[key];

    if (actualVal === undefined) {
      violations.push({
        rule: 'METADATA_FIELD_MISSING',
        details: `Arquivo "${fileName}" não possui o campo de metadado obrigatório: "${key}".`,
      });
      continue;
    }

    if (key === 'Papéis Relacionados' || key === 'Agente Guardião') {
      // Valida se o agente ou papel principal está presente na string
      if (!actualVal.includes(expectedVal)) {
        violations.push({
          rule: 'METADATA_VALUE_INVALID',
          details: `Campo "${key}" em "${fileName}" não contém o papel/agente esperado "${expectedVal}". Valor atual: "${actualVal}".`,
        });
      }
    } else if (actualVal !== expectedVal) {
      violations.push({
        rule: 'METADATA_VALUE_INVALID',
        details: `Campo "${key}" em "${fileName}" possui valor inesperado. Esperado: "${expectedVal}", recebido: "${actualVal}".`,
      });
    }
  }

  return violations;
}

/**
 * Valida a presença de todas as seções obrigatórias (nível H2 '## ') em um documento Markdown.
 *
 * @param {string} content - Conteúdo completo do arquivo.
 * @param {string[]} requiredSections - Lista de seções esperadas.
 * @param {string} fileName - Nome do arquivo para diagnóstico.
 * @returns {Array<{ rule: string, details: string }>} Lista de violações encontradas.
 */
export function validateSections(content, requiredSections, fileName) {
  const violations = [];

  for (const section of requiredSections) {
    const expectedHeader = `## ${section}`;
    if (!content.includes(expectedHeader)) {
      violations.push({
        rule: 'SECTION_MISSING',
        details: `Arquivo "${fileName}" não contém a seção obrigatória: "${expectedHeader}".`,
      });
    }
  }

  return violations;
}

/**
 * Valida se as interfaces ou tipos TypeScript exigidos estão formalizados no documento.
 *
 * @param {string} content - Conteúdo completo do arquivo Markdown.
 * @param {string[]} requiredTypes - Lista de interfaces ou tipos esperados.
 * @param {string} fileName - Nome do arquivo para diagnóstico.
 * @returns {Array<{ rule: string, details: string }>} Lista de violações encontradas.
 */
export function validateTypeDefinitions(content, requiredTypes, fileName) {
  const violations = [];

  for (const typeName of requiredTypes) {
    const interfaceRegex = new RegExp(`(?:interface|type)\\s+${typeName}\\b`);
    if (!interfaceRegex.test(content)) {
      violations.push({
        rule: 'TYPE_DEFINITION_MISSING',
        details: `Contrato "${fileName}" não formaliza a definição TypeScript obrigatória: "${typeName}".`,
      });
    }
  }

  return violations;
}

/**
 * Valida links Markdown relativos para garantir que não apontem para arquivos inexistentes.
 *
 * @param {string} content - Conteúdo completo do arquivo Markdown.
 * @param {string} filePath - Caminho absoluto do arquivo avaliado.
 * @param {string} projectRoot - Raiz do projeto para ancoragem.
 * @returns {Array<{ rule: string, details: string }>} Lista de links quebrados.
 */
export function validateRelativeLinks(content, filePath, projectRoot) {
  const violations = [];
  const fileDir = path.dirname(filePath);

  // Regex para capturar links Markdown relativos: [texto](destino)
  // Ignora links externos (http://, https://), âncoras locais (#...) e mailto:
  const linkRegex = /\[.*?\]\((?!https?:\/\/|mailto:|#)(.*?)\)/g;

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[1].trim();
    if (!rawTarget) continue;

    // Remove âncoras internas (ex: path/to/file.md#secao -> path/to/file.md)
    const [targetPathWithoutHash] = rawTarget.split('#');
    if (!targetPathWithoutHash) {
      continue;
    }

    // Resolve caminho em relação ao diretório do documento
    const resolvedPath = path.resolve(fileDir, targetPathWithoutHash);

    if (!fs.existsSync(resolvedPath)) {
      violations.push({
        rule: 'BROKEN_RELATIVE_LINK',
        details: `Arquivo "${path.basename(filePath)}" contém link relativo quebrado para "${rawTarget}". Destino inexistente no disco: "${normalizePath(path.relative(projectRoot, resolvedPath))}".`,
      });
    }
  }

  return violations;
}

/**
 * Verifica se há caminhos absolutos de estações de trabalho privadas vazados no documento.
 *
 * @param {string} content - Conteúdo do arquivo.
 * @param {string} fileName - Nome do arquivo para diagnóstico.
 * @returns {Array<{ rule: string, details: string }>} Lista de violações.
 */
export function checkPrivatePaths(content, fileName) {
  const violations = [];
  const lines = content.split('\n');
  const privatePattern = /\/home\/[a-zA-Z0-9._-]+\/|[A-Za-z]:\\Users\\[a-zA-Z0-9._-]+\\/i;

  for (let i = 0; i < lines.length; i++) {
    if (privatePattern.test(lines[i])) {
      violations.push({
        rule: 'PRIVATE_PATH_DETECTED',
        details: `Linha ${i + 1} de "${fileName}" contém caminho absoluto privado de estação local. Utilize caminhos relativos ao repositório.`,
      });
      break;
    }
  }

  return violations;
}

/**
 * Valida a presença e consistência de um único contrato canônico.
 *
 * @param {string} contractsDir - Diretório dos contratos.
 * @param {string} fileName - Nome do arquivo de contrato.
 * @param {Object} spec - Especificação normativa do contrato.
 * @param {string} projectRoot - Raiz do projeto.
 * @returns {{ violations: Array<{ rule: string, details: string }>, operationalError: string | null }}
 */
export function validateSingleContract(contractsDir, fileName, spec, projectRoot) {
  const contractPath = path.join(contractsDir, fileName);

  if (!fs.existsSync(contractPath)) {
    return {
      violations: [
        {
          rule: 'CONTRACT_FILE_MISSING',
          details: `Contrato canônico obrigatório não encontrado: "${fileName}" em "${contractsDir}".`,
        },
      ],
      operationalError: null,
    };
  }

  let content;
  try {
    content = fs.readFileSync(contractPath, 'utf8');
  } catch (err) {
    return {
      violations: [],
      operationalError: `Falha de I/O ao ler o contrato "${fileName}": ${err.message}`,
    };
  }

  const violations = [];

  // 1. Metadados
  const { metadata, error: metaErr } = parseMetadataBlock(content);
  if (metaErr || !metadata) {
    violations.push({
      rule: 'METADATA_BLOCK_MISSING',
      details: metaErr || `Falha ao extrair metadados de "${fileName}".`,
    });
  } else {
    violations.push(...validateMetadata(metadata, spec.requiredMetadata, fileName));
  }

  // 2. Seções
  if (spec.requiredSections) {
    violations.push(...validateSections(content, spec.requiredSections, fileName));
  }

  // 3. Tipos TypeScript
  if (spec.requiredTypes) {
    violations.push(...validateTypeDefinitions(content, spec.requiredTypes, fileName));
  }

  // 4. Links relativos
  violations.push(...validateRelativeLinks(content, contractPath, projectRoot));

  // 5. Caminhos privados
  violations.push(...checkPrivatePaths(content, fileName));

  return { violations, operationalError: null };
}

/**
 * Valida a presença e consistência de uma única política canônica.
 *
 * @param {string} policiesDir - Diretório das políticas.
 * @param {string} fileName - Nome do arquivo de política.
 * @param {Object} spec - Especificação normativa da política.
 * @param {string} projectRoot - Raiz do projeto.
 * @returns {{ violations: Array<{ rule: string, details: string }>, operationalError: string | null }}
 */
export function validateSinglePolicy(policiesDir, fileName, spec, projectRoot) {
  const policyPath = path.join(policiesDir, fileName);

  if (!fs.existsSync(policyPath)) {
    return {
      violations: [
        {
          rule: 'POLICY_FILE_MISSING',
          details: `Política canônica obrigatória não encontrada: "${fileName}" em "${policiesDir}".`,
        },
      ],
      operationalError: null,
    };
  }

  let content;
  try {
    content = fs.readFileSync(policyPath, 'utf8');
  } catch (err) {
    return {
      violations: [],
      operationalError: `Falha de I/O ao ler a política "${fileName}": ${err.message}`,
    };
  }

  const violations = [];

  // 1. Metadados
  const { metadata, error: metaErr } = parseMetadataBlock(content);
  if (metaErr || !metadata) {
    violations.push({
      rule: 'METADATA_BLOCK_MISSING',
      details: metaErr || `Falha ao extrair metadados de "${fileName}".`,
    });
  } else {
    violations.push(...validateMetadata(metadata, spec.requiredMetadata, fileName));
  }

  // 2. Seções
  if (spec.requiredSections) {
    violations.push(...validateSections(content, spec.requiredSections, fileName));
  }

  // 3. Links relativos
  violations.push(...validateRelativeLinks(content, policyPath, projectRoot));

  // 4. Caminhos privados
  violations.push(...checkPrivatePaths(content, fileName));

  return { violations, operationalError: null };
}

/**
 * Valida a integridade cruzada do catálogo de contratos no README.md de contratos.
 *
 * @param {string} contractsDir - Diretório dos contratos.
 * @returns {Array<{ rule: string, details: string }>} Lista de inconsistências no catálogo.
 */
export function validateContractsCatalog(contractsDir) {
  const violations = [];
  const readmePath = path.join(contractsDir, 'README.md');

  if (!fs.existsSync(readmePath)) {
    return violations; // Já capturado por validateSingleContract
  }

  let readmeContent;
  try {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  } catch {
    return violations;
  }

  // Todos os 5 contratos funcionais devem estar referenciados
  const functionalContracts = Object.keys(CANONICAL_CONTRACTS).filter((f) => f !== 'README.md');

  for (const contractFile of functionalContracts) {
    if (!readmeContent.includes(contractFile)) {
      violations.push({
        rule: 'CATALOG_MISMATCH',
        details: `Índice de contratos ("${readmePath}") não cataloga o contrato obrigatório: "${contractFile}".`,
      });
    }
  }

  return violations;
}

/**
 * Valida a integridade cruzada do catálogo de políticas no README.md de políticas.
 *
 * @param {string} policiesDir - Diretório das políticas.
 * @returns {Array<{ rule: string, details: string }>} Lista de inconsistências no catálogo.
 */
export function validatePoliciesCatalog(policiesDir) {
  const violations = [];
  const readmePath = path.join(policiesDir, 'README.md');

  if (!fs.existsSync(readmePath)) {
    return violations; // Já capturado por validateSinglePolicy
  }

  let readmeContent;
  try {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  } catch {
    return violations;
  }

  // Todas as 10 políticas operacionais devem estar referenciadas
  const operationalPolicies = Object.keys(CANONICAL_POLICIES).filter((f) => f !== 'README.md');

  for (const policyFile of operationalPolicies) {
    if (!readmeContent.includes(policyFile)) {
      violations.push({
        rule: 'CATALOG_MISMATCH',
        details: `Índice de políticas ("${readmePath}") não cataloga a política obrigatória: "${policyFile}".`,
      });
    }
  }

  return violations;
}

/**
 * Detecta arquivos Markdown não autorizados dentro dos diretórios normativos (anti-dispersão).
 *
 * @param {string} dir - Diretório a inspecionar.
 * @param {Set<string>} allowedFiles - Arquivos permitidos.
 * @param {string} label - Rótulo do módulo para mensagem de erro.
 * @returns {Array<{ rule: string, details: string }>} Lista de arquivos inesperados.
 */
export function checkUnexpectedFiles(dir, allowedFiles, label) {
  const violations = [];
  if (!fs.existsSync(dir)) return violations;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        if (!allowedFiles.has(entry.name)) {
          violations.push({
            rule: 'UNEXPECTED_DOCUMENT',
            details: `Arquivo Markdown não reconhecido presente no diretório canônico de ${label}: "${entry.name}". Remova-o ou formalize-o.`,
          });
        }
      }
    }
  } catch {
    // Falhas de leitura de diretório são tratadas no nível superior
  }

  return violations;
}

/**
 * Validador principal integrado de Contratos e Políticas do Harness.
 *
 * @param {Object} [options={}] - Parâmetros operacionais.
 * @param {string} [options.contractsDir] - Caminho personalizado para contratos.
 * @param {string} [options.policiesDir] - Caminho personalizado para políticas.
 * @param {string} [options.projectRoot] - Raiz do repositório.
 * @returns {{
 *   passed: boolean,
 *   totalContractsChecked: number,
 *   totalPoliciesChecked: number,
 *   violations: Array<{ rule: string, details: string, file?: string }>,
 *   operationalErrors: string[]
 * }}
 */
export function validateHarnessContracts(options = {}) {
  const projectRoot = options.projectRoot
    ? path.resolve(options.projectRoot)
    : path.resolve(process.cwd());

  const contractsDir = options.contractsDir
    ? path.resolve(options.contractsDir)
    : path.join(projectRoot, '.harness/contracts');

  const policiesDir = options.policiesDir
    ? path.resolve(options.policiesDir)
    : path.join(projectRoot, '.harness/policies');

  const operationalErrors = [];
  const violations = [];

  // Verificação operacional de acesso aos diretórios
  if (!fs.existsSync(contractsDir)) {
    operationalErrors.push(
      `Diretório de contratos não acessível ou inexistente: "${contractsDir}"`
    );
  }

  if (!fs.existsSync(policiesDir)) {
    operationalErrors.push(`Diretório de políticas não acessível ou inexistente: "${policiesDir}"`);
  }

  if (operationalErrors.length > 0) {
    return {
      passed: false,
      totalContractsChecked: 0,
      totalPoliciesChecked: 0,
      violations: [],
      operationalErrors,
    };
  }

  let totalContractsChecked = 0;
  let totalPoliciesChecked = 0;

  // 1. Validação dos Contratos Canônicos
  for (const [fileName, spec] of Object.entries(CANONICAL_CONTRACTS)) {
    totalContractsChecked++;
    const res = validateSingleContract(contractsDir, fileName, spec, projectRoot);

    if (res.operationalError) {
      operationalErrors.push(res.operationalError);
    }
    for (const v of res.violations) {
      violations.push({ file: path.join('.harness/contracts', fileName), ...v });
    }
  }

  // 2. Integridade do Catálogo de Contratos
  const contractCatViolations = validateContractsCatalog(contractsDir);
  for (const v of contractCatViolations) {
    violations.push({ file: '.harness/contracts/README.md', ...v });
  }

  // 3. Arquivos inesperados em contratos
  const allowedContracts = new Set(Object.keys(CANONICAL_CONTRACTS));
  const unexpectedContracts = checkUnexpectedFiles(contractsDir, allowedContracts, 'Contratos');
  for (const v of unexpectedContracts) {
    violations.push({ file: '.harness/contracts', ...v });
  }

  // 4. Validação das Políticas Canônicas
  for (const [fileName, spec] of Object.entries(CANONICAL_POLICIES)) {
    totalPoliciesChecked++;
    const res = validateSinglePolicy(policiesDir, fileName, spec, projectRoot);

    if (res.operationalError) {
      operationalErrors.push(res.operationalError);
    }
    for (const v of res.violations) {
      violations.push({ file: path.join('.harness/policies', fileName), ...v });
    }
  }

  // 5. Integridade do Catálogo de Políticas
  const policyCatViolations = validatePoliciesCatalog(policiesDir);
  for (const v of policyCatViolations) {
    violations.push({ file: '.harness/policies/README.md', ...v });
  }

  // 6. Arquivos inesperados em políticas
  const allowedPolicies = new Set(Object.keys(CANONICAL_POLICIES));
  const unexpectedPolicies = checkUnexpectedFiles(policiesDir, allowedPolicies, 'Políticas');
  for (const v of unexpectedPolicies) {
    violations.push({ file: '.harness/policies', ...v });
  }

  const passed = violations.length === 0 && operationalErrors.length === 0;

  return {
    passed,
    totalContractsChecked,
    totalPoliciesChecked,
    violations,
    operationalErrors,
  };
}

/* ==============================================================================
 * Primitivas de Validação em Runtime (Nível 3) de Payloads Executáveis
 * ============================================================================== */

/**
 * Valida um objeto concreto de payload do tipo TaskContract em runtime.
 *
 * @param {unknown} payload - Objeto a validar.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTaskPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload da tarefa deve ser um objeto não nulo.'] };
  }

  const p = /** @type {Record<string, any>} */ (payload);

  if (!p.taskId || typeof p.taskId !== 'string') {
    errors.push('Campo "taskId" obrigatório ausente ou não é string.');
  }
  if (!p.milestone || typeof p.milestone !== 'string') {
    errors.push('Campo "milestone" obrigatório ausente ou não é string.');
  }
  if (!p.phase || typeof p.phase !== 'string') {
    errors.push('Campo "phase" obrigatório ausente ou não é string.');
  }
  if (!p.title || typeof p.title !== 'string') {
    errors.push('Campo "title" obrigatório ausente ou não é string.');
  }
  if (!p.description || typeof p.description !== 'string') {
    errors.push('Campo "description" obrigatório ausente ou não é string.');
  }
  if (!CANONICAL_AGENTS.includes(p.assignedAgent)) {
    errors.push(
      `Agente atribuído "${p.assignedAgent}" inválido. Deve ser um dos 9 agentes canônicos: ${CANONICAL_AGENTS.join(', ')}.`
    );
  }
  if (!Array.isArray(p.requiredSkills)) {
    errors.push('Campo "requiredSkills" deve ser um array.');
  } else {
    for (const skill of p.requiredSkills) {
      if (!CANONICAL_SKILLS.includes(skill)) {
        errors.push(`Skill solicitada "${skill}" não pertence ao catálogo canônico de skills.`);
      }
    }
  }
  if (!Array.isArray(p.preConditions)) {
    errors.push('Campo "preConditions" deve ser um array.');
  }
  if (!Array.isArray(p.acceptanceCriteria) || p.acceptanceCriteria.length === 0) {
    errors.push('Campo "acceptanceCriteria" deve ser um array não vazio com critérios testáveis.');
  }
  if (p.safetyLevel !== 'SAFE_DEFAULT' && p.safetyLevel !== 'SAFE_STRICT') {
    errors.push('Campo "safetyLevel" deve ser "SAFE_DEFAULT" ou "SAFE_STRICT".');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida um objeto concreto de payload do tipo AgentInput em runtime.
 *
 * @param {unknown} payload - Objeto a validar.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentInputPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload de AgentInput deve ser um objeto não nulo.'] };
  }

  const p = /** @type {Record<string, any>} */ (payload);

  if (!p.taskId || typeof p.taskId !== 'string') {
    errors.push('Campo "taskId" obrigatório ausente ou não é string.');
  }
  if (!CANONICAL_AGENTS.includes(p.agentId)) {
    errors.push(`Identificador de agente "${p.agentId}" inválido.`);
  }
  if (!CANONICAL_EXECUTION_MODES.includes(p.mode)) {
    errors.push(
      `Modo de execução "${p.mode}" inválido. Valores aceitos: ${CANONICAL_EXECUTION_MODES.join(', ')}.`
    );
  }
  if (!Array.isArray(p.contextPaths)) {
    errors.push('Campo "contextPaths" deve ser um array.');
  } else {
    for (const cp of p.contextPaths) {
      if (typeof cp !== 'string' || path.isAbsolute(cp)) {
        errors.push(`Caminho de contexto "${cp}" deve ser relativo à raiz do projeto.`);
      }
    }
  }
  if (!Array.isArray(p.applicablePolicies)) {
    errors.push('Campo "applicablePolicies" deve ser um array.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida um objeto concreto de payload do tipo AgentOutput em runtime.
 *
 * @param {unknown} payload - Objeto a validar.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentOutputPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload de AgentOutput deve ser um objeto não nulo.'] };
  }

  const p = /** @type {Record<string, any>} */ (payload);

  if (!p.taskId || typeof p.taskId !== 'string') {
    errors.push('Campo "taskId" obrigatório ausente ou não é string.');
  }
  if (!CANONICAL_AGENTS.includes(p.agentId)) {
    errors.push(`Identificador de agente "${p.agentId}" inválido.`);
  }
  if (!CANONICAL_TERMINAL_STATUSES.includes(p.status)) {
    errors.push(
      `Status terminal "${p.status}" inválido. Valores aceitos: ${CANONICAL_TERMINAL_STATUSES.join(', ')}.`
    );
  }
  if (!p.summary || typeof p.summary !== 'string') {
    errors.push('Campo "summary" obrigatório ausente ou não é string.');
  }
  if (!Array.isArray(p.artifactsCreated)) {
    errors.push('Campo "artifactsCreated" deve ser um array.');
  }
  if (!Array.isArray(p.artifactsModified)) {
    errors.push('Campo "artifactsModified" deve ser um array.');
  }

  // Se o status for COMPLETED, o Modelo de Evidências deve estar presente e íntegro
  if (p.status === 'COMPLETED') {
    if (!p.evidence || typeof p.evidence !== 'object') {
      errors.push('Tarefas com status "COMPLETED" exigem o campo "evidence" (EvidenceModel).');
    } else {
      const ev = p.evidence;
      if (!ev.reportPath || typeof ev.reportPath !== 'string') {
        errors.push('EvidenceModel exige "reportPath" preenchido.');
      } else if (!ev.reportPath.startsWith('docs/Relatorios/')) {
        errors.push(
          `EvidenceModel exige "reportPath" sob "docs/Relatorios/". Recebido: "${ev.reportPath}".`
        );
      }
      if (Array.isArray(ev.commandAudits)) {
        for (const cmd of ev.commandAudits) {
          if (cmd.exitCode !== 0) {
            errors.push(
              `EvidenceModel contém comando auditado falho ("${cmd.command}" com exitCode ${cmd.exitCode}). Status COMPLETED é vedado.`
            );
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Execução em linha de comando (CLI)
const isMainModule =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith('validate-harness-contracts.mjs'));

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node scripts/quality/validate-harness-contracts.mjs [opções]

Opções:
  -c, --contracts-dir <path>   Diretório de contratos canônicos (padrão: .harness/contracts)
  -p, --policies-dir <path>    Diretório de políticas canônicas (padrão: .harness/policies)
  --project-root <path>        Raiz do projeto (padrão: diretório atual)
  -h, --help                   Exibe esta mensagem de ajuda

Códigos de Saída (Exit Codes):
  0: Validação documental e cruzada aprovada sem violações.
  1: Violação de conformidade detectada (arquivo ausente, metadado inválido, seção faltante, link quebrado).
  2: Erro operacional, argumentos incorretos ou falha de acesso aos diretórios.
`);
    process.exit(0);
  }

  let customContractsDir = null;
  let customPoliciesDir = null;
  let customProjectRoot = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-c' || args[i] === '--contracts-dir') {
      customContractsDir = args[++i];
    } else if (args[i] === '-p' || args[i] === '--policies-dir') {
      customPoliciesDir = args[++i];
    } else if (args[i] === '--project-root') {
      customProjectRoot = args[++i];
    }
  }

  logger.info('Iniciando Validador de Contratos e Políticas do Harness...');

  let result;
  try {
    result = validateHarnessContracts({
      contractsDir: customContractsDir,
      policiesDir: customPoliciesDir,
      projectRoot: customProjectRoot,
    });
  } catch (err) {
    logger.error(`Erro inesperado ao executar validação: ${err.message}`);
    process.exit(2);
  }

  if (result.operationalErrors && result.operationalErrors.length > 0) {
    logger.error(`🚨 Falha Operacional na Validação (${result.operationalErrors.length} erro(s)):`);
    for (const err of result.operationalErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(2);
  }

  if (!result.passed) {
    logger.error(
      `❌ Violações de Conformidade Detectadas (${result.violations.length} ocorrência(s)):`
    );
    for (const v of result.violations) {
      console.error(`  - [${v.rule}] ${v.file ? `${v.file} -> ` : ''}${v.details}`);
    }
    console.error(
      '\nPor favor, retifique os contratos ou políticas indicados antes de submeter ao Quality Gate.\n'
    );
    process.exit(1);
  }

  logger.success(
    `Sucesso: Todos os ${result.totalContractsChecked} contratos e ${result.totalPoliciesChecked} políticas foram auditados e aprovados com louvor!`
  );
  process.exit(0);
}
