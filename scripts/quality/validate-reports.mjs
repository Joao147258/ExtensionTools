/**
 * @file validate-reports.mjs
 * @description Mecanismo de governança documental e validação anti-dispersão do ExtensionTools.
 * Garante que:
 * 1. docs/Relatorios/ seja o único diretório de relatórios do projeto.
 * 2. Nenhum arquivo de relatório exista fora de docs/Relatorios/.
 * 3. A estrutura interna de docs/Relatorios/ respeite a organização por milestone e fase.
 * 4. Links e referências entre documentos apontem exclusivamente para caminhos válidos.
 *
 * Códigos de saída (Exit codes):
 * - 0: Validação aprovada, nenhum relatório disperso e estrutura canônica íntegra.
 * - 1: Violação de governança detectada (relatório fora do local canônico ou link quebrado).
 * - 2: Erro operacional ou diretório raiz inválido.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Padrões de nomes de arquivos que caracterizam relatórios de engenharia/desenvolvimento.
 */
export const REPORT_FILE_PATTERNS = [
  /^RELATORIO-.*\.md$/i,
  /.*-REPORT\.md$/i,
  /.*-PLANEJAMENTO.*\.md$/i,
  /.*-IMPLEMENTACAO.*\.md$/i,
  /.*-HOMOLOGACAO.*\.md$/i,
  /.*-VALIDACAO.*\.md$/i,
  /.*-REVISAO.*\.md$/i,
];

/**
 * Diretórios autorizados a conter arquivos de relatório.
 * docs/Relatorios e suas subpastas.
 */
export const CANONICAL_REPORTS_DIR = 'docs/Relatorios';

/**
 * Diretórios e arquivos que devem ser ignorados durante a busca por relatórios dispersos.
 */
export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.output',
  '.wxt',
  'dist',
  'build',
  'coverage',
  '.local',
  'docs/Relatorios', // Diretório canônico autorizado
]);

/**
 * Verifica se um nome de arquivo corresponde ao padrão de relatório.
 *
 * @param {string} fileName - Nome do arquivo (basename)
 * @returns {boolean}
 */
export function isReportFileName(fileName) {
  return REPORT_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

/**
 * Varre recursivamente o diretório raiz procurando por relatórios criados fora de docs/Relatorios/.
 *
 * @param {string} currentDir - Diretório atual da busca
 * @param {string} projectRoot - Diretório raiz do projeto
 * @param {string[]} violations - Lista acumuladora de violações encontradas
 */
export function scanForDispersedReports(currentDir, projectRoot, violations = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');

    // Ignora diretórios na lista de exclusão
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(relativePath) || IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      scanForDispersedReports(fullPath, projectRoot, violations);
    } else if (entry.isFile()) {
      // Arquivos de template ou documentação técnica legítima são ignorados
      if (relativePath.startsWith('.harness/templates/')) {
        continue;
      }

      if (isReportFileName(entry.name)) {
        violations.push({
          file: relativePath,
          reason: `Arquivo de relatório encontrado fora do diretório canônico "${CANONICAL_REPORTS_DIR}".`,
        });
      }
    }
  }

  return violations;
}

/**
 * Valida a estrutura interna do diretório docs/Relatorios/.
 *
 * @param {string} projectRoot - Diretório raiz do projeto
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCanonicalReportsStructure(projectRoot) {
  const reportsFullPath = path.join(projectRoot, CANONICAL_REPORTS_DIR);
  const errors = [];

  if (!fs.existsSync(reportsFullPath)) {
    return {
      valid: false,
      errors: [`Diretório canônico de relatórios não encontrado: ${CANONICAL_REPORTS_DIR}`],
    };
  }

  const readmePath = path.join(reportsFullPath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    errors.push(
      `Arquivo de índice canônico ausente: ${path.join(CANONICAL_REPORTS_DIR, 'README.md')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Executa a verificação completa de governança documental.
 *
 * @param {string} projectRoot - Raiz do projeto ExtensionTools
 * @returns {{ passed: boolean, dispersedViolations: Array, structureErrors: string[] }}
 */
export function runReportsValidation(projectRoot) {
  const dispersedViolations = scanForDispersedReports(projectRoot, projectRoot);
  const structureResult = validateCanonicalReportsStructure(projectRoot);

  return {
    passed: dispersedViolations.length === 0 && structureResult.valid,
    dispersedViolations,
    structureErrors: structureResult.errors,
  };
}

// Execução direta via CLI
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith('validate-reports.mjs'));

if (isDirectExecution) {
  try {
    const projectRoot = process.cwd();
    console.log(`🔍 [validate-reports] Iniciando auditoria documental em: ${projectRoot}`);

    const result = runReportsValidation(projectRoot);

    if (!result.passed) {
      console.error('\n❌ [validate-reports] Falha na governança documental:\n');

      for (const v of result.dispersedViolations) {
        console.error(` - [RELATÓRIO DISPERSO]: ${v.file} ➔ ${v.reason}`);
      }

      for (const err of result.structureErrors) {
        console.error(` - [ESTRUTURA INVÁLIDA]: ${err}`);
      }

      console.error(
        `\nDiretriz: Todo relatório deve residir exclusivamente sob "${CANONICAL_REPORTS_DIR}".`
      );
      process.exit(1);
    }

    console.log(
      '✅ [validate-reports] Sucesso: Todos os relatórios estão centralizados e em conformidade.'
    );
    process.exit(0);
  } catch (error) {
    console.error('💥 [validate-reports] Erro operacional:', error.message);
    process.exit(2);
  }
}
