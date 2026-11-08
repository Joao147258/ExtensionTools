/**
 * @file validate-harness-contracts.test.ts
 * @description Suíte de testes unitários, funcionais e de integração do validador de contratos e políticas.
 *
 * Cobertura de cenários:
 * - Cenários Positivos: fixture sintética íntegra e execução sobre o repositório real (exit 0).
 * - Cenários Negativos: contrato ausente, política ausente, seção faltante, metadado inválido,
 *   tipo TypeScript ausente, link quebrado, caminho privado vazado, documento inesperado (exit 1).
 * - Cenários Operacionais: diretório inexistente, arquivo inacessível de I/O, parâmetros inválidos (exit 2).
 * - Primitivas de Runtime (Nível 3): validação de payloads de TaskContract, AgentInput e AgentOutput.
 * - Teste de Processo CLI: execução real de subprocessos verificando códigos de saída 0, 1 e 2.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  parseMetadataBlock,
  validateMetadata,
  validateSections,
  validateTypeDefinitions,
  validateRelativeLinks,
  checkPrivatePaths,
  checkUnexpectedFiles,
  validateContractsCatalog,
  validatePoliciesCatalog,
  validateSingleContract,
  validateSinglePolicy,
  validateHarnessContracts,
  validateTaskPayload,
  validateAgentInputPayload,
  validateAgentOutputPayload,
  CANONICAL_CONTRACTS,
  CANONICAL_POLICIES,
} from '../../../scripts/quality/validate-harness-contracts.mjs';

/**
 * Cria uma fixture sintética completa e 100% válida de contratos e políticas do Harness.
 *
 * @param {string} baseDir - Diretório raiz temporário onde os arquivos serão gerados.
 * @returns {{ contractsDir: string, policiesDir: string }}
 */
function createValidHarnessFixture(baseDir: string) {
  const contractsDir = path.join(baseDir, '.harness', 'contracts');
  const policiesDir = path.join(baseDir, '.harness', 'policies');
  fs.mkdirSync(contractsDir, { recursive: true });
  fs.mkdirSync(policiesDir, { recursive: true });

  // 1. Contratos
  fs.writeFileSync(
    path.join(contractsDir, 'README.md'),
    `# Índice de Contratos
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Módulo:** .harness/contracts/
> **Milestone:** M2 — Harness Engineering & Governance
> **Fase:** M2-PHASE-3 (Contratos de Execução e Políticas do Harness)

## 1. Finalidade e Princípios de Arquitetura
## 2. Catálogo Canônico dos Contratos de Execução
- [task-contract.md](task-contract.md)
- [agent-input-contract.md](agent-input-contract.md)
- [agent-output-contract.md](agent-output-contract.md)
- [skill-context-contract.md](skill-context-contract.md)
- [impediment-contract.md](impediment-contract.md)

## 3. Fluxo Integrado de Comunicação e Ciclo de Vida
## 4. Máquina de Estados Determinística da Tarefa
## 5. Relação entre Contratos, Políticas e Evidências
## 6. Níveis de Validação dos Contratos
## 7. Versionamento e Procedimento de Evolução
`
  );

  fs.writeFileSync(
    path.join(contractsDir, 'task-contract.md'),
    `# Contrato de Tarefa
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Identificador do Contrato:** CONTRACT-TASK-V1
> **Versão:** 1.0.0
> **Status:** CANÔNICO E VIGENTE
> **Papéis Relacionados:** Orchestrator

## 1. Finalidade e Responsabilidade
## 2. Especificação Estruturada do Contrato
\`\`\`typescript
export type CanonicalAgentId = 'orchestrator';
export type CanonicalSkillId = 'implementation';
export type SafetyLevel = 'SAFE_DEFAULT';
export interface TaskContract {}
\`\`\`
## 3. Invariantes e Regras de Validade
## 4. Ciclo de Vida da Tarefa
## 5. Exemplos Sintéticos
## 6. Tratamento de Erros e Impedimentos
`
  );

  fs.writeFileSync(
    path.join(contractsDir, 'agent-input-contract.md'),
    `# Contrato de Entrada
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Identificador do Contrato:** CONTRACT-AGENT-INPUT-V1
> **Versão:** 1.0.0
> **Status:** CANÔNICO E VIGENTE
> **Papéis Relacionados:** Orchestrator

## 1. Finalidade e Responsabilidade
## 2. Especificação Estruturada do Contrato
\`\`\`typescript
export type ExecutionMode = 'IMPLEMENTATION';
export interface AgentInput {}
\`\`\`
## 3. Invariantes e Regras de Validade
## 4. Exemplos Sintéticos
## 5. Tratamento de Erros e Falhas de Entrada
`
  );

  fs.writeFileSync(
    path.join(contractsDir, 'agent-output-contract.md'),
    `# Contrato de Saída
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Identificador do Contrato:** CONTRACT-AGENT-OUTPUT-V1
> **Versão:** 1.0.0
> **Status:** CANÔNICO E VIGENTE
> **Papéis Relacionados:** Agentes Especializados Executores

## 1. Finalidade e Responsabilidade
## 2. Especificação Estruturada do Contrato
\`\`\`typescript
export type TaskExecutionStatus = 'COMPLETED';
export interface AgentOutput {}
\`\`\`
## 3. Modelo Canônico de Evidências (\`EvidenceModel\`)
\`\`\`typescript
export interface EvidenceModel {}
\`\`\`
## 4. Invariantes e Regras de Validade
## 5. Exemplos Sintéticos
`
  );

  fs.writeFileSync(
    path.join(contractsDir, 'skill-context-contract.md'),
    `# Contrato de Skill
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Identificador do Contrato:** CONTRACT-SKILL-CONTEXT-V1
> **Versão:** 1.0.0
> **Status:** CANÔNICO E VIGENTE
> **Papéis Relacionados:** Agentes Especializados Executores e Skills Canônicas

## 1. Finalidade e Responsabilidade
## 2. Especificação Estruturada do Contrato
\`\`\`typescript
export interface SkillContext {}
\`\`\`
## 3. Invariantes e Regras de Validade
## 4. Exemplos Sintéticos
## 5. Tratamento de Erros
`
  );

  fs.writeFileSync(
    path.join(contractsDir, 'impediment-contract.md'),
    `# Contrato de Impedimento
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Identificador do Contrato:** CONTRACT-IMPEDIMENT-V1
> **Versão:** 1.0.0
> **Status:** CANÔNICO E VIGENTE
> **Papéis Relacionados:** Agentes Especializados Executores

## 1. Finalidade e Responsabilidade
## 2. Especificação Estruturada do Contrato
\`\`\`typescript
export type ImpedimentCategory = 'SECURITY';
export type ImpedimentSeverity = 'CRITICAL';
export interface ImpedimentReport {}
\`\`\`
## 3. Invariantes e Regras de Validade
## 4. Procedimento de Retomada e Recuperação (Desbloqueio)
## 5. Exemplos Sintéticos
## 6. Tratamento de Falhas
`
  );

  // 2. Políticas
  const policyList = [
    { name: 'repository-safety.md', id: 'POL-SEC-01', guard: 'security-auditor' },
    { name: 'agent-execution-boundaries.md', id: 'POL-SEC-02', guard: 'orchestrator' },
    { name: 'destructive-operations.md', id: 'POL-SEC-03', guard: 'script-engineer' },
    { name: 'architecture-governance.md', id: 'POL-ENG-01', guard: 'architect' },
    { name: 'code-quality.md', id: 'POL-ENG-02', guard: 'developer' },
    { name: 'testing-strategy.md', id: 'POL-ENG-03', guard: 'test-engineer' },
    { name: 'script-standards.md', id: 'POL-ENG-04', guard: 'script-engineer' },
    { name: 'documentation-governance.md', id: 'POL-GOV-01', guard: 'documentation-engineer' },
    { name: 'human-approvals.md', id: 'POL-GOV-02', guard: 'orchestrator' },
    { name: 'external-distribution.md', id: 'POL-DIST-01', guard: 'release-engineer' },
  ];

  let policyCatalogLinks = '';
  for (const pol of policyList) {
    policyCatalogLinks += `- [${pol.name}](${pol.name})\n`;
  }

  fs.writeFileSync(
    path.join(policiesDir, 'README.md'),
    `# Índice de Políticas
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Módulo:** .harness/policies/
> **Milestone:** M2 — Harness Engineering & Governance
> **Fase:** M2-PHASE-3 (Contratos de Execução e Políticas do Harness)

## 1. Finalidade e Princípios de Governança
## 2. Catálogo das Dez Políticas Canônicas
${policyCatalogLinks}
## 3. Matriz de Integração: Agentes, Skills, Contratos e Políticas
## 4. Hierarquia Normativa e Ordem de Precedência
## 5. Procedimentos de Revisão e Evolução
`
  );

  for (const pol of policyList) {
    const spec = CANONICAL_POLICIES[pol.name as keyof typeof CANONICAL_POLICIES];
    let sectionsContent = '';
    for (const sec of spec.requiredSections) {
      sectionsContent += `## ${sec}\nConteúdo sintético válido da seção.\n`;
    }

    fs.writeFileSync(
      path.join(policiesDir, pol.name),
      `# Política ${pol.name}
> **Projeto:** ExtensionTools
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)
> **Identificador da Política:** ${pol.id}
> **Versão:** 1.0.0
> **Status:** CANÔNICA E VIGENTE
> **Agente Guardião:** ${pol.guard}

${sectionsContent}
`
    );
  }

  return { contractsDir, policiesDir };
}

describe('Validador de Contratos e Políticas (validate-harness-contracts.mjs)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-contracts-val-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignora erro no cleanup
    }
  });

  /* --------------------------------------------------------------------------
   * 1. Funções de Extração e Validação Granulares
   * -------------------------------------------------------------------------- */

  describe('parseMetadataBlock', () => {
    it('deve extrair metadados formatados com blockquotes Markdown', () => {
      const content = `# Título
> **Projeto:** ExtensionTools
> **Identificador do Contrato:** \`CONTRACT-TASK-V1\`
> **Versão:** \`1.0.0\`
> **Status:** CANÔNICO E VIGENTE

Corpo do documento...`;

      const { metadata, error } = parseMetadataBlock(content);
      expect(error).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata?.Projeto).toBe('ExtensionTools');
      expect(metadata?.['Identificador do Contrato']).toBe('CONTRACT-TASK-V1');
      expect(metadata?.Versão).toBe('1.0.0');
      expect(metadata?.Status).toBe('CANÔNICO E VIGENTE');
    });

    it('deve retornar erro quando o bloco de metadados não existir', () => {
      const content = '# Título sem citação\n\nApenas parágrafos normais.';
      const { metadata, error } = parseMetadataBlock(content);
      expect(metadata).toBeNull();
      expect(error).toContain('ausente ou malformado');
    });

    it('deve retornar erro para entradas que não sejam strings', () => {
      // @ts-expect-error teste de entrada inválida
      const { metadata, error } = parseMetadataBlock(12345);
      expect(metadata).toBeNull();
      expect(error).toContain('string válida');
    });
  });

  describe('validateMetadata', () => {
    it('deve aprovar quando todos os metadados baterem exatamente', () => {
      const metadata = {
        Projeto: 'ExtensionTools',
        Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
        'Identificador do Contrato': 'CONTRACT-TASK-V1',
        Versão: '1.0.0',
      };
      const required = {
        Projeto: 'ExtensionTools',
        Classificação: 'PUBLIC REPOSITORY (Safe-by-Default)',
        'Identificador do Contrato': 'CONTRACT-TASK-V1',
      };

      const violations = validateMetadata(metadata, required, 'task-contract.md');
      expect(violations).toHaveLength(0);
    });

    it('deve acusar violação quando campo obrigatório estiver ausente', () => {
      const metadata = { Projeto: 'ExtensionTools' };
      const required = {
        Projeto: 'ExtensionTools',
        'Identificador do Contrato': 'CONTRACT-TASK-V1',
      };

      const violations = validateMetadata(metadata, required, 'task-contract.md');
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('METADATA_FIELD_MISSING');
    });

    it('deve acusar violação quando valor for divergente', () => {
      const metadata = {
        Projeto: 'OutroProjeto',
        'Identificador do Contrato': 'CONTRACT-TASK-V1',
      };
      const required = {
        Projeto: 'ExtensionTools',
        'Identificador do Contrato': 'CONTRACT-TASK-V1',
      };

      const violations = validateMetadata(metadata, required, 'task-contract.md');
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('METADATA_VALUE_INVALID');
      expect(violations[0].details).toContain('OutroProjeto');
    });
  });

  describe('validateSections', () => {
    it('deve aprovar quando todas as seções obrigatórias estiverem presentes', () => {
      const content = `## 1. Finalidade\n## 2. Especificação\n## 3. Regras`;
      const required = ['1. Finalidade', '2. Especificação', '3. Regras'];

      const violations = validateSections(content, required, 'exemplo.md');
      expect(violations).toHaveLength(0);
    });

    it('deve acusar violação quando seção obrigatória estiver faltando', () => {
      const content = `## 1. Finalidade\n## 3. Regras`;
      const required = ['1. Finalidade', '2. Especificação', '3. Regras'];

      const violations = validateSections(content, required, 'exemplo.md');
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('SECTION_MISSING');
      expect(violations[0].details).toContain('2. Especificação');
    });
  });

  describe('validateTypeDefinitions', () => {
    it('deve detectar declarações de interfaces e types TypeScript', () => {
      const content = `\`\`\`typescript\nexport interface TaskContract {}\nexport type CanonicalAgentId = 'orchestrator';\n\`\`\``;
      const required = ['TaskContract', 'CanonicalAgentId'];

      const violations = validateTypeDefinitions(content, required, 'task-contract.md');
      expect(violations).toHaveLength(0);
    });

    it('deve acusar violação quando um tipo obrigatório não for formalizado', () => {
      const content = `\`\`\`typescript\nexport interface TaskContract {}\n\`\`\``;
      const required = ['TaskContract', 'CanonicalAgentId'];

      const violations = validateTypeDefinitions(content, required, 'task-contract.md');
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('TYPE_DEFINITION_MISSING');
      expect(violations[0].details).toContain('CanonicalAgentId');
    });
  });

  describe('validateRelativeLinks', () => {
    it('deve aprovar links relativos apontando para arquivos existentes', () => {
      const docPath = path.join(tmpDir, 'doc.md');
      const targetPath = path.join(tmpDir, 'target.md');
      fs.writeFileSync(targetPath, '# Alvo');
      fs.writeFileSync(docPath, 'Link para [alvo](target.md#secao-1)');

      const violations = validateRelativeLinks(
        'Link para [alvo](target.md#secao-1)',
        docPath,
        tmpDir
      );
      expect(violations).toHaveLength(0);
    });

    it('deve acusar violação quando o link apontar para arquivo inexistente', () => {
      const docPath = path.join(tmpDir, 'doc.md');
      fs.writeFileSync(docPath, 'Link quebrado [fantasma](inexistente.md)');

      const violations = validateRelativeLinks(
        'Link quebrado [fantasma](inexistente.md)',
        docPath,
        tmpDir
      );
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('BROKEN_RELATIVE_LINK');
      expect(violations[0].details).toContain('inexistente.md');
    });
  });

  describe('checkPrivatePaths', () => {
    it('deve aprovar conteúdo que utilize caminhos puramente relativos', () => {
      const content = 'Consulte o arquivo docs/architecture/HARNESS-ARCHITECTURE.md para detalhes.';
      const violations = checkPrivatePaths(content, 'test.md');
      expect(violations).toHaveLength(0);
    });

    it('deve detectar caminhos absolutos privados do Linux', () => {
      const content =
        'Arquivo localizado em ' +
        ['', 'home', 'usuario123', 'DeveloperLabTools', 'projeto.'].join('/');
      const violations = checkPrivatePaths(content, 'test.md');
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('PRIVATE_PATH_DETECTED');
    });

    it('deve detectar caminhos absolutos privados do Windows', () => {
      const content =
        'Arquivo localizado em ' + 'C:\\' + 'Users\\DevUser\\DeveloperLabTools\\projeto.';
      const violations = checkPrivatePaths(content, 'test.md');
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('PRIVATE_PATH_DETECTED');
    });
  });

  describe('checkUnexpectedFiles', () => {
    it('deve acusar violação diante de arquivos markdown não canônicos', () => {
      const dir = path.join(tmpDir, 'modulo');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'autorizado.md'), '# OK');
      fs.writeFileSync(path.join(dir, 'espurio.md'), '# Lixo');

      const allowed = new Set(['autorizado.md']);
      const violations = checkUnexpectedFiles(dir, allowed, 'Teste');
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('UNEXPECTED_DOCUMENT');
      expect(violations[0].details).toContain('espurio.md');
    });
  });

  /* --------------------------------------------------------------------------
   * 2. Cenários Integrados (Fixture Sintética)
   * -------------------------------------------------------------------------- */

  describe('Validação Integrada sobre Fixture Sintética', () => {
    it('deve aprovar com 100% de sucesso uma fixture íntegra e canônica', () => {
      const { contractsDir, policiesDir } = createValidHarnessFixture(tmpDir);

      const result = validateHarnessContracts({
        contractsDir,
        policiesDir,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(true);
      expect(result.operationalErrors).toHaveLength(0);
      expect(result.violations).toHaveLength(0);
      expect(result.totalContractsChecked).toBe(6);
      expect(result.totalPoliciesChecked).toBe(11);
    });

    it('deve acusar CONTRACT_FILE_MISSING quando um contrato for removido', () => {
      const { contractsDir, policiesDir } = createValidHarnessFixture(tmpDir);
      fs.unlinkSync(path.join(contractsDir, 'task-contract.md'));

      const result = validateHarnessContracts({
        contractsDir,
        policiesDir,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(false);
      const missing = result.violations.find((v) => v.rule === 'CONTRACT_FILE_MISSING');
      expect(missing).toBeDefined();
      expect(missing?.details).toContain('task-contract.md');
    });

    it('deve acusar POLICY_FILE_MISSING quando uma política for removida', () => {
      const { contractsDir, policiesDir } = createValidHarnessFixture(tmpDir);
      fs.unlinkSync(path.join(policiesDir, 'repository-safety.md'));

      const result = validateHarnessContracts({
        contractsDir,
        policiesDir,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(false);
      const missing = result.violations.find((v) => v.rule === 'POLICY_FILE_MISSING');
      expect(missing).toBeDefined();
      expect(missing?.details).toContain('repository-safety.md');
    });

    it('deve acusar CATALOG_MISMATCH quando um contrato não estiver listado no README de contratos', () => {
      const { contractsDir, policiesDir } = createValidHarnessFixture(tmpDir);
      // Remove a menção a task-contract.md do README
      const readmePath = path.join(contractsDir, 'README.md');
      const content = fs
        .readFileSync(readmePath, 'utf8')
        .replace('- [task-contract.md](task-contract.md)', '');
      fs.writeFileSync(readmePath, content);

      const result = validateHarnessContracts({
        contractsDir,
        policiesDir,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(false);
      const mismatch = result.violations.find((v) => v.rule === 'CATALOG_MISMATCH');
      expect(mismatch).toBeDefined();
      expect(mismatch?.details).toContain('task-contract.md');
    });

    it('deve acusar CATALOG_MISMATCH quando uma política não estiver listada no README de políticas', () => {
      const { contractsDir, policiesDir } = createValidHarnessFixture(tmpDir);
      // Remove menção a code-quality.md do README de políticas
      const readmePath = path.join(policiesDir, 'README.md');
      const content = fs
        .readFileSync(readmePath, 'utf8')
        .replace('- [code-quality.md](code-quality.md)', '');
      fs.writeFileSync(readmePath, content);

      const result = validateHarnessContracts({
        contractsDir,
        policiesDir,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(false);
      const mismatch = result.violations.find((v) => v.rule === 'CATALOG_MISMATCH');
      expect(mismatch).toBeDefined();
      expect(mismatch?.details).toContain('code-quality.md');
    });

    it('deve acusar UNEXPECTED_DOCUMENT se houver documento espúrio nos diretórios', () => {
      const { contractsDir, policiesDir } = createValidHarnessFixture(tmpDir);
      fs.writeFileSync(path.join(contractsDir, 'rascunho-aleatorio.md'), '# Rascunho');

      const result = validateHarnessContracts({
        contractsDir,
        policiesDir,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(false);
      const unexpected = result.violations.find((v) => v.rule === 'UNEXPECTED_DOCUMENT');
      expect(unexpected).toBeDefined();
      expect(unexpected?.details).toContain('rascunho-aleatorio.md');
    });
  });

  /* --------------------------------------------------------------------------
   * 3. Falhas Operacionais (Exit 2)
   * -------------------------------------------------------------------------- */

  describe('Tratamento de Falhas Operacionais', () => {
    it('deve retornar erro operacional quando o diretório de contratos não existir', () => {
      const nonExistent = path.join(tmpDir, 'diretorio-inexistente-contratos');
      const policiesDir = path.join(tmpDir, 'policies');
      fs.mkdirSync(policiesDir, { recursive: true });

      const result = validateHarnessContracts({
        contractsDir: nonExistent,
        policiesDir,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(false);
      expect(result.operationalErrors.length).toBeGreaterThan(0);
      expect(result.operationalErrors[0]).toContain(
        'Diretório de contratos não acessível ou inexistente'
      );
    });

    it('deve retornar erro operacional quando o diretório de políticas não existir', () => {
      const contractsDir = path.join(tmpDir, 'contracts');
      fs.mkdirSync(contractsDir, { recursive: true });
      const nonExistent = path.join(tmpDir, 'diretorio-inexistente-politicas');

      const result = validateHarnessContracts({
        contractsDir,
        policiesDir: nonExistent,
        projectRoot: tmpDir,
      });

      expect(result.passed).toBe(false);
      expect(result.operationalErrors.length).toBeGreaterThan(0);
      expect(result.operationalErrors[0]).toContain(
        'Diretório de políticas não acessível ou inexistente'
      );
    });
  });

  /* --------------------------------------------------------------------------
   * 4. Primitivas de Runtime (Nível 3) de Payloads Executáveis
   * -------------------------------------------------------------------------- */

  describe('Validação em Runtime de Payloads de Agentes', () => {
    it('deve validar com sucesso um payload TaskContract autêntico', () => {
      const validTask = {
        taskId: 'M2-P3-T08',
        milestone: 'M2',
        phase: 'M2-PHASE-3',
        title: 'Desenvolvimento do Validador',
        description: 'Implementar validador de contratos',
        assignedAgent: 'script-engineer',
        requiredSkills: ['script-development', 'testing'],
        preConditions: ['Contratos e políticas formalizados'],
        acceptanceCriteria: ['Passar em todos os testes'],
        safetyLevel: 'SAFE_DEFAULT',
      };

      const result = validateTaskPayload(validTask);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar TaskContract com agente inválido e criteria vazio', () => {
      const invalidTask = {
        taskId: 'T-01',
        milestone: 'M2',
        phase: 'M2-PHASE-3',
        title: 'Tarefa',
        description: 'Desc',
        assignedAgent: 'agente-invalido',
        requiredSkills: ['skill-inexistente'],
        preConditions: [],
        acceptanceCriteria: [],
        safetyLevel: 'INVALID_LEVEL',
      };

      const result = validateTaskPayload(invalidTask);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('agente-invalido'))).toBe(true);
      expect(result.errors.some((e) => e.includes('skill-inexistente'))).toBe(true);
      expect(result.errors.some((e) => e.includes('acceptanceCriteria'))).toBe(true);
    });

    it('deve validar com sucesso um payload AgentInput válido', () => {
      const validAgentInput = {
        taskId: 'M2-P3-T08',
        agentId: 'script-engineer',
        mode: 'IMPLEMENTATION',
        contextPaths: ['scripts/quality/', 'tests/harness/'],
        applicablePolicies: ['POL-ENG-04'],
      };

      const result = validateAgentInputPayload(validAgentInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar AgentInput com caminho de contexto absoluto', () => {
      const invalidAgentInput = {
        taskId: 'M2-P3-T08',
        agentId: 'script-engineer',
        mode: 'IMPLEMENTATION',
        contextPaths: ['/caminho/absoluto/proibido'],
        applicablePolicies: [],
      };

      const result = validateAgentInputPayload(invalidAgentInput);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('deve ser relativo');
    });

    it('deve validar com sucesso um payload AgentOutput com status COMPLETED e EvidenceModel íntegro', () => {
      const validOutput = {
        taskId: 'M2-P3-T08',
        agentId: 'script-engineer',
        status: 'COMPLETED',
        summary: 'Validador implementado',
        artifactsCreated: ['scripts/quality/validate-harness-contracts.mjs'],
        artifactsModified: [],
        evidence: {
          reportPath: 'docs/Relatorios/m2/phase-3/relatorio.md',
          commandAudits: [{ command: 'pnpm test', exitCode: 0 }],
        },
      };

      const result = validateAgentOutputPayload(validOutput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar AgentOutput com status COMPLETED se o relatório estiver fora de docs/Relatorios/', () => {
      const invalidOutput = {
        taskId: 'M2-P3-T08',
        agentId: 'script-engineer',
        status: 'COMPLETED',
        summary: 'Validador implementado',
        artifactsCreated: [],
        artifactsModified: [],
        evidence: {
          reportPath: 'src/relatorio-disperso.md',
          commandAudits: [{ command: 'pnpm test', exitCode: 0 }],
        },
      };

      const result = validateAgentOutputPayload(invalidOutput);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('docs/Relatorios/');
    });

    it('deve rejeitar AgentOutput com status COMPLETED se houver comando auditado com exitCode != 0', () => {
      const invalidOutput = {
        taskId: 'M2-P3-T08',
        agentId: 'script-engineer',
        status: 'COMPLETED',
        summary: 'Validador implementado',
        artifactsCreated: [],
        artifactsModified: [],
        evidence: {
          reportPath: 'docs/Relatorios/relatorio.md',
          commandAudits: [{ command: 'pnpm test', exitCode: 1 }],
        },
      };

      const result = validateAgentOutputPayload(invalidOutput);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exitCode 1');
    });
  });

  /* --------------------------------------------------------------------------
   * 5. Testes de Execução CLI e Subprocessos (Exit Codes 0, 1 e 2)
   * -------------------------------------------------------------------------- */

  describe('Execução em Subprocesso CLI', () => {
    const scriptPath = path.resolve('scripts/quality/validate-harness-contracts.mjs');

    it('deve sair com código 0 e mensagem de sucesso sobre o repositório real', () => {
      const proc = spawnSync('node', [scriptPath], {
        encoding: 'utf8',
      });

      expect(proc.status).toBe(0);
      expect(proc.stdout).toContain('Sucesso');
    });

    it('deve exibir ajuda e sair com código 0 diante de --help', () => {
      const proc = spawnSync('node', [scriptPath, '--help'], {
        encoding: 'utf8',
      });

      expect(proc.status).toBe(0);
      expect(proc.stdout).toContain('Uso: node scripts/quality/validate-harness-contracts.mjs');
    });

    it('deve sair com código 1 diante de violação de conformidade (arquivo ausente)', () => {
      const { contractsDir, policiesDir } = createValidHarnessFixture(tmpDir);
      // Deleta um contrato para forçar violação
      fs.unlinkSync(path.join(contractsDir, 'task-contract.md'));

      const proc = spawnSync(
        'node',
        [scriptPath, '-c', contractsDir, '-p', policiesDir, '--project-root', tmpDir],
        { encoding: 'utf8' }
      );

      expect(proc.status).toBe(1);
      expect(proc.stderr).toContain('Violações de Conformidade Detectadas');
      expect(proc.stderr).toContain('CONTRACT_FILE_MISSING');
    });

    it('deve sair com código 2 diante de falha operacional (diretório inexistente)', () => {
      const proc = spawnSync(
        'node',
        [scriptPath, '-c', '/caminho/completamente/inexistente/operacional'],
        { encoding: 'utf8' }
      );

      expect(proc.status).toBe(2);
      expect(proc.stderr).toContain('Falha Operacional na Validação');
    });
  });
});
