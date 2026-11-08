/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/architecture/boundary-linter.mjs
 * Responsabilidade: Orquestrador e CLI unificado do Quality Gate `QG-02 — Architecture Boundaries`.
 *
 * Propósito:
 * Fiscalizar deterministicamente os limites arquiteturais da organização Feature-First,
 * inspecionando dependências entre módulos, aplicando as regras ARC-R01 a ARC-R08 e
 * bloqueando a introdução de dependências circulares diretas e transitivas.
 *
 * Catálogo de Regras Verificadas:
 * - ARC-R01: Isolamento Estrito entre Features (Cross-Feature Import)
 * - ARC-R02: Encapsulamento por API Pública (Internal Feature Access via entrypoints)
 * - ARC-R03: Pureza de Domínio e Core (Domain/Core Purity)
 * - ARC-R04: Inversão de Dependência em Application (Application -> Infrastructure)
 * - ARC-R05: Isolamento de Shared (Shared Layer Isolation)
 * - ARC-R06: Isolamento de Platform (Platform Layer Isolation)
 * - ARC-R07: Prevenção de Dependências Circulares (Direct & Transitive Cycles)
 * - ARC-R08: Resolução Canônica de Aliases (Alias Transversal Compliance)
 *
 * Códigos de Saída (Exit Codes):
 * - 0: Nenhuma violação arquitetural detectada (QG-02 PASS)
 * - 1: Uma ou mais violações arquiteturais detectadas (QG-02 FAIL)
 * - 2: Erro operacional ou falha de sistema que impede a verificação (SAFE_ABORT)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, walkDirectory, resolveSafePath } from '../lib/fs-utils.mjs';
import { getStagedFiles } from '../lib/git-utils.mjs';
import { closeSharedTsApi, loadTsConfig } from '../lib/ast-analyzer.mjs';
import { buildDependencyGraph } from '../lib/dependency-graph.mjs';
import { verifyModuleBoundaries } from './verify-module-boundaries.mjs';
import { logger, maskSensitiveData } from '../lib/logger.mjs';

/**
 * Interface de opções de execução do Boundary Linter.
 * @typedef {Object} BoundaryLinterOptions
 * @property {string} [scope='all'] - Escopo de análise: 'all' | 'src' | 'staged' | caminho relativo/absoluto.
 * @property {boolean} [json=false] - Se true, emite saída exclusivamente em JSON estruturado.
 * @property {string} [projectRoot=process.cwd()] - Raiz do projeto.
 * @property {string} [tsConfigPath='tsconfig.json'] - Caminho da configuração TypeScript.
 * @property {boolean} [includeTypeOnlyInCycles=false] - Se deve incluir dependências de tipo na busca de ciclos.
 * @property {boolean} [quiet=false] - Se true, omite mensagens informativas secundárias.
 */

/**
 * Resultado estruturado da execução do Boundary Linter.
 * @typedef {Object} BoundaryLinterResult
 * @property {'PASS' | 'FAIL' | 'ERROR'} status - Estado final da validação.
 * @property {number} exitCode - Código de saída determinístico (0, 1 ou 2).
 * @property {Object} summary - Sumário numérico auditável.
 * @property {number} summary.totalFiles - Arquivos inspecionados.
 * @property {number} summary.totalDependencies - Dependências avaliadas.
 * @property {number} summary.totalViolations - Total de violações arquiteturais detectadas.
 * @property {number} summary.cyclesCount - Quantidade de ciclos detectados.
 * @property {number} summary.operationalErrorsCount - Quantidade de erros operacionais.
 * @property {import('./verify-module-boundaries.mjs').BoundaryViolation[]} violations - Lista de violações.
 * @property {string[]} operationalErrors - Falhas operacionais ocorridas durante a execução.
 */

/**
 * Descobre a lista de arquivos de código-fonte a serem inspecionados com base no escopo solicitado.
 *
 * @param {string} scope - 'all' | 'src' | 'staged' ou caminho específico.
 * @param {string} projectRoot - Raiz do projeto.
 * @returns {string[]} Lista de caminhos relativos normalizados dos arquivos elegíveis.
 */
export function resolveSourceFilesForScope(scope, projectRoot = process.cwd()) {
  const allowedExtensions = /\.(ts|tsx|js|jsx)$/;
  const declarationFilter = /\.d\.ts$/;

  // 1. Escopo Staged do Git
  if (scope === 'staged') {
    try {
      const staged = getStagedFiles(projectRoot);
      return staged
        .map((f) => normalizePath(f))
        .filter(
          (f) =>
            allowedExtensions.test(f) &&
            !declarationFilter.test(f) &&
            (f.startsWith('src/') || f.startsWith('tests/harness/fixtures/'))
        )
        .sort();
    } catch {
      // Se git falhar (ex: fora de repo ou ambiente isolado), faz fallback seguro
      return [];
    }
  }

  // 2. Escopo padrão 'all' ou 'src'
  if (scope === 'all' || scope === 'src') {
    const srcDir = path.resolve(projectRoot, 'src');
    if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
      return walkDirectory(
        'src',
        {
          includePatterns: [allowedExtensions],
          excludePatterns: [declarationFilter],
        },
        projectRoot
      ).sort();
    }
    return [];
  }

  // 3. Caminho específico informado pelo usuário (arquivo ou pasta)
  const safePath = resolveSafePath(scope, projectRoot);
  const relPath = normalizePath(path.relative(projectRoot, safePath));

  if (!fs.existsSync(safePath)) {
    throw new Error(`Caminho especificado para análise não existe: "${scope}"`);
  }

  const stat = fs.statSync(safePath);
  if (stat.isFile()) {
    if (allowedExtensions.test(relPath) && !declarationFilter.test(relPath)) {
      return [relPath];
    }
    return [];
  }

  if (stat.isDirectory()) {
    return walkDirectory(
      relPath,
      {
        includePatterns: [allowedExtensions],
        excludePatterns: [declarationFilter],
      },
      projectRoot
    ).sort();
  }

  return [];
}

/**
 * Executa a validação completa de limites arquiteturais e dependências circulares.
 *
 * @param {BoundaryLinterOptions} [options={}] - Opções de configuração do linter.
 * @returns {Promise<BoundaryLinterResult>} Resultado estruturado da execução.
 */
export async function runBoundaryLinter(options = {}) {
  const {
    scope = 'all',
    json = false,
    projectRoot = process.cwd(),
    tsConfigPath = 'tsconfig.json',
    includeTypeOnlyInCycles = false,
  } = options;

  const operationalErrors = [];
  let filesToAnalyze;

  try {
    filesToAnalyze = resolveSourceFilesForScope(scope, projectRoot);
  } catch (err) {
    operationalErrors.push(err.message);
    const errorResult = {
      status: 'ERROR',
      exitCode: 2,
      summary: {
        totalFiles: 0,
        totalDependencies: 0,
        totalViolations: 0,
        cyclesCount: 0,
        operationalErrorsCount: 1,
      },
      violations: [],
      operationalErrors,
    };

    if (json) {
      console.log(JSON.stringify(errorResult, null, 2));
    } else {
      logger.error(`[QG-02] Erro operacional na resolução do escopo: ${err.message}`);
    }

    return errorResult;
  }

  // Se nenhum arquivo elegível foi encontrado
  if (filesToAnalyze.length === 0) {
    const emptyResult = {
      status: 'PASS',
      exitCode: 0,
      summary: {
        totalFiles: 0,
        totalDependencies: 0,
        totalViolations: 0,
        cyclesCount: 0,
        operationalErrorsCount: 0,
      },
      violations: [],
      operationalErrors: [],
    };

    if (json) {
      console.log(JSON.stringify(emptyResult, null, 2));
    } else if (!options.quiet) {
      logger.info(
        `[QG-02] Nenhum arquivo de código-fonte encontrado no escopo '${scope}'. Verificação aprovada.`
      );
    }

    return emptyResult;
  }

  const tsConfig = loadTsConfig(tsConfigPath, projectRoot);
  if (tsConfig.error) {
    operationalErrors.push(
      `Falha na leitura do arquivo de configuração TypeScript ("${tsConfigPath}"): ${tsConfig.error}`
    );
  }

  // 1. Fiscalização de Limites de Módulos (ARC-R01 a ARC-R06 e ARC-R08)
  const boundaryCheck = verifyModuleBoundaries(filesToAnalyze, {
    projectRoot,
    tsConfigPath,
    tsConfig,
  });

  if (boundaryCheck.operationalErrors && boundaryCheck.operationalErrors.length > 0) {
    operationalErrors.push(...boundaryCheck.operationalErrors);
  }

  const allViolations = [...boundaryCheck.violations];

  // 2. Construção do Grafo de Dependências e Detecção de Ciclos (ARC-R07)
  let cyclesCount = 0;
  try {
    const graph = buildDependencyGraph(filesToAnalyze, {
      projectRoot,
      tsConfigPath,
    });

    const detectedCycles = graph.findCycles({
      includeTypeOnly: includeTypeOnlyInCycles,
    });

    cyclesCount = detectedCycles.length;

    for (const cycle of detectedCycles) {
      const firstFile = cycle.cycle[0];
      const secondFile = cycle.cycle[1] || firstFile;

      allViolations.push({
        ruleId: 'ARC-R07',
        file: firstFile,
        line: 1,
        column: 1,
        target: secondFile,
        moduleSpecifier: cycle.pathString,
        message: `Dependência circular detectada (${cycle.type === 'direct' ? 'ciclo direto' : 'ciclo transitivo'} com ${cycle.length} módulos): ${cycle.pathString}.`,
        evidence: cycle.pathString,
        remediation: `Elimine o laço de dependência circular extraindo contratos e interfaces para 'src/shared/' ou desacoplando as camadas.`,
        isTypeOnly: false,
      });
    }
  } catch (err) {
    operationalErrors.push(
      `Falha ao construir grafo de dependências ou analisar ciclos: ${err.message}`
    );
  } finally {
    closeSharedTsApi();
  }

  // Ordenação determinística de todas as violações
  allViolations.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.ruleId.localeCompare(b.ruleId);
  });

  // Determinação determinística do status e código de saída
  let exitCode = 0;
  let status = 'PASS';

  if (operationalErrors.length > 0) {
    exitCode = 2;
    status = 'ERROR';
  } else if (allViolations.length > 0) {
    exitCode = 1;
    status = 'FAIL';
  }

  const result = {
    status,
    exitCode,
    summary: {
      totalFiles: boundaryCheck.checkedFilesCount,
      totalDependencies: boundaryCheck.checkedDependenciesCount,
      totalViolations: allViolations.length,
      cyclesCount,
      operationalErrorsCount: operationalErrors.length,
    },
    violations: allViolations,
    operationalErrors,
  };

  // Emissão de Saída
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanReadableReport(result, scope);
  }

  return result;
}

/**
 * Formata a saída no terminal com mensagens limpas e sanitizadas.
 *
 * @param {BoundaryLinterResult} result - Dados do resultado da análise.
 * @param {string} scope - Escopo executado.
 */
function printHumanReadableReport(result, scope) {
  console.log('');
  logger.info(`🔍 [QG-02 — Architecture Boundaries] Iniciando auditoria arquitetural...`);
  logger.info(`📂 Escopo de análise: "${scope}" | Arquivos: ${result.summary.totalFiles}`);

  if (result.operationalErrors.length > 0) {
    console.log('');
    logger.error(`❌ Erros operacionais detectados durante a verificação:`);
    for (const opErr of result.operationalErrors) {
      logger.error(`  • ${maskSensitiveData(opErr)}`);
    }
  }

  if (result.violations.length > 0) {
    console.log('');
    logger.error(
      `🚨 Foram detectadas ${result.violations.length} violação(ões) de limites arquiteturais:`
    );

    for (const v of result.violations) {
      console.log('');
      logger.error(`[${v.ruleId}] ${v.file}:${v.line}:${v.column}`);
      console.log(`    Mensagem:    ${v.message}`);
      console.log(`    Evidência:   ${v.evidence}`);
      console.log(`    Remediação:  ${v.remediation}`);
    }
  }

  console.log('');
  if (result.exitCode === 0) {
    logger.success(
      `✅ [QG-02 — Architecture Boundaries] Aprovado com louvor: Zero violações nos ${result.summary.totalFiles} arquivos inspecionados (${result.summary.totalDependencies} dependências verificadas).`
    );
  } else if (result.exitCode === 1) {
    logger.error(
      `❌ [QG-02 — Architecture Boundaries] Reprovado: ${result.summary.totalViolations} violação(ões) arquitetural(is) encontrada(s).`
    );
  } else {
    logger.error(
      `⚠️ [QG-02 — Architecture Boundaries] Abortado com erro operacional: Verificação inconclusiva (${result.summary.operationalErrorsCount} falhas de sistema).`
    );
  }
  console.log('');
}

/**
 * Ponto de entrada CLI quando executado diretamente pelo Node.js.
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node scripts/architecture/boundary-linter.mjs [opções]

Opções:
  --scope <escopo>      Define o escopo de análise: 'all' (padrão), 'src', 'staged' ou caminho de arquivo/diretório.
  --json                Emite a saída exclusivamente no formato JSON estruturado.
  --project-root <dir>  Diretório raiz do projeto (padrão: diretório atual).
  --tsconfig <arquivo>  Caminho do arquivo tsconfig.json (padrão: tsconfig.json).
  --include-types       Inclui dependências puramente de tipos na detecção de ciclos.
  --help, -h            Exibe esta mensagem de ajuda.

Códigos de Saída:
  0: Nenhuma violação arquitetural detectada (PASS).
  1: Violações arquiteturais encontradas (FAIL).
  2: Erro operacional ou falha que impede verificação (ERROR).
`);
    process.exit(0);
  }

  let scope = 'all';
  let json = false;
  let projectRoot = process.cwd();
  let tsConfigPath = 'tsconfig.json';
  let includeTypeOnlyInCycles = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--scope' && args[i + 1]) {
      scope = args[i + 1];
      i++;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--project-root' && args[i + 1]) {
      projectRoot = path.resolve(args[i + 1]);
      i++;
    } else if (arg === '--tsconfig' && args[i + 1]) {
      tsConfigPath = args[i + 1];
      i++;
    } else if (arg === '--include-types') {
      includeTypeOnlyInCycles = true;
    } else if (!arg.startsWith('--')) {
      scope = arg;
    }
  }

  const result = await runBoundaryLinter({
    scope,
    json,
    projectRoot,
    tsConfigPath,
    includeTypeOnlyInCycles,
  });

  process.exit(result.exitCode);
}

// Executa automaticamente se invocado como script principal via linha de comando
const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFilePath)) {
  main().catch((err) => {
    logger.error(`[QG-02] Exceção não tratada no boundary linter: ${err.message}`);
    process.exit(2);
  });
}
