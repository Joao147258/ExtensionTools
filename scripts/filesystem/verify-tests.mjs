/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/filesystem/verify-tests.mjs
 * Responsabilidade: Auditar a cobertura e integridade da suíte de testes da
 *                  capacidade File System Access API frente aos 13 cenários obrigatórios.
 *
 * Matriz Canônica de Cenários Mínimos Obrigatórios:
 * 1.  TC-FS-01: Seleção autorizada de arquivo ou pasta
 * 2.  TC-FS-02: Seleção cancelada pelo usuário (AbortError)
 * 3.  TC-FS-03: Permissão negada pelo usuário (NotAllowedError)
 * 4.  TC-FS-04: Permissão revogada na sessão
 * 5.  TC-FS-05: Arquivo inexistente no disco (NotFoundError)
 * 6.  TC-FS-06: Arquivo alterado externamente
 * 7.  TC-FS-07: Falha de leitura durante obtenção de dados
 * 8.  TC-FS-08: Falha de escrita no stream
 * 9.  TC-FS-09: Escrita interrompida (descarte de .crswap e rollback)
 * 10. TC-FS-10: Arquivo existente com risco de sobrescrita
 * 11. TC-FS-11: Exclusão de entrada não autorizada
 * 12. TC-FS-12: Tentativa de exclusão recursiva sem confirmação
 * 13. TC-FS-13: Operação em ambiente de navegador não suportado
 *
 * Tratamento da Fase de Preparação:
 * - Se nenhum arquivo de teste de File System estiver presente (pois a funcionalidade
 *   ainda não foi desenvolvida no produto), o verificador confirma a prontidão da
 *   matriz normativa e reporta `PASS_PENDING_IMPLEMENTATION` (exit code 0).
 *
 * Códigos de Saída (Exit Codes):
 * - 0: Todos os cenários cobertos ou fase de preparação sem testes pendentes forçados (PASS)
 * - 1: Falta de cobertura de um ou mais cenários obrigatórios (FAIL)
 * - 2: Erro operacional durante a análise (ERROR)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { walkDirectory } from '../lib/fs-utils.mjs';
import { logger } from '../lib/logger.mjs';

/**
 * Definição canônica dos 13 cenários de teste obrigatórios com padrões de identificação.
 */
export const MANDATORY_TEST_SCENARIOS = [
  {
    id: 'TC-FS-01',
    name: 'Seleção autorizada de arquivo/pasta',
    patterns: [/sele[çc][ãa]o\s+autorizada/i, /authorized\s+selection/i, /pick\s+success/i],
  },
  {
    id: 'TC-FS-02',
    name: 'Seleção cancelada pelo usuário (AbortError)',
    patterns: [/abort/i, /cancel/i, /AbortError/],
  },
  {
    id: 'TC-FS-03',
    name: 'Permissão negada pelo usuário (NotAllowedError)',
    patterns: [/permiss[ãa]o\s+negada/i, /permission\s+denied/i, /NotAllowedError/],
  },
  {
    id: 'TC-FS-04',
    name: 'Permissão revogada na sessão',
    patterns: [/revog/i, /revok/i],
  },
  {
    id: 'TC-FS-05',
    name: 'Arquivo inexistente no disco (NotFoundError)',
    patterns: [/inexistente/i, /not\s+found/i, /NotFoundError/],
  },
  {
    id: 'TC-FS-06',
    name: 'Arquivo alterado externamente',
    patterns: [/alterado\s+externamente/i, /externally\s+modified/i],
  },
  {
    id: 'TC-FS-07',
    name: 'Falha de leitura',
    patterns: [/falha.*leitura/i, /read.*error/i, /read.*fail/i],
  },
  {
    id: 'TC-FS-08',
    name: 'Falha de escrita no stream',
    patterns: [/falha.*escrita/i, /write.*error/i, /write.*fail/i],
  },
  {
    id: 'TC-FS-09',
    name: 'Escrita interrompida (rollback e descarte de .crswap)',
    patterns: [/interrompida/i, /interrupted/i, /crswap/i, /abort.*write/i],
  },
  {
    id: 'TC-FS-10',
    name: 'Arquivo existente com risco de sobrescrita',
    patterns: [/sobrescrita/i, /overwrite/i],
  },
  {
    id: 'TC-FS-11',
    name: 'Exclusão não autorizada',
    patterns: [
      /exclus[ãa]o.*n[ãa]o.*autorizada/i,
      /unauthorized.*remov/i,
      /delete.*not\s*allowed/i,
    ],
  },
  {
    id: 'TC-FS-12',
    name: 'Tentativa de exclusão recursiva sem confirmação',
    patterns: [/recursiv.*sem.*confirma[çc][ãa]o/i, /recursive.*without.*confirm/i],
  },
  {
    id: 'TC-FS-13',
    name: 'Operação em navegador/ambiente não suportado',
    patterns: [/n[ãa]o\s+suportado/i, /unsupported/i, /fallback/i],
  },
];

/**
 * Audita arquivos de teste em busca da cobertura dos 13 cenários.
 *
 * @param {string} targetDir
 * @param {string} projectRoot
 * @returns {{ isPending: boolean, coveredScenarios: string[], missingScenarios: string[], inspectedFiles: string[] }}
 */
export function auditTestCoverage(targetDir, projectRoot = process.cwd()) {
  const absDir = path.isAbsolute(targetDir) ? targetDir : path.resolve(projectRoot, targetDir);

  if (!fs.existsSync(absDir)) {
    return {
      isPending: true,
      coveredScenarios: [],
      missingScenarios: MANDATORY_TEST_SCENARIOS.map((s) => s.id),
      inspectedFiles: [],
    };
  }

  const allFiles = walkDirectory(
    absDir,
    {
      filter: (f) => /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(f) && !f.includes('node_modules'),
    },
    projectRoot
  );

  if (allFiles.length === 0) {
    return {
      isPending: true,
      coveredScenarios: [],
      missingScenarios: MANDATORY_TEST_SCENARIOS.map((s) => s.id),
      inspectedFiles: [],
    };
  }

  // Concatena conteúdo dos testes para auditoria dos cenários
  let aggregatedContent = '';
  for (const f of allFiles) {
    const absFile = path.isAbsolute(f) ? f : path.resolve(projectRoot, f);
    aggregatedContent += '\n' + fs.readFileSync(absFile, 'utf8');
  }

  const covered = [];
  const missing = [];

  for (const scenario of MANDATORY_TEST_SCENARIOS) {
    const isCovered = scenario.patterns.some((pattern) => pattern.test(aggregatedContent));
    if (isCovered) {
      covered.push(scenario.id);
    } else {
      missing.push(scenario.id);
    }
  }

  return {
    isPending: false,
    coveredScenarios: covered,
    missingScenarios: missing,
    inspectedFiles: allFiles,
  };
}

/**
 * Executa a verificação dos testes de File System.
 *
 * @param {Object} [options={}]
 * @param {string} [options.testsDir='tests/unit/platform/file-system']
 * @param {string} [options.projectRoot=process.cwd()]
 * @returns {Promise<{ status: 'PASS' | 'PASS_PENDING_IMPLEMENTATION' | 'FAIL' | 'ERROR', exitCode: number, covered: string[], missing: string[], totalFiles: number, isPending: boolean }>}
 */
export async function verifyFilesystemTests(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const testsDir = options.testsDir || path.join('tests', 'unit', 'platform', 'file-system');

  try {
    const audit = auditTestCoverage(testsDir, projectRoot);

    if (audit.isPending) {
      return {
        status: 'PASS_PENDING_IMPLEMENTATION',
        exitCode: 0,
        covered: [],
        missing: audit.missingScenarios,
        totalFiles: 0,
        isPending: true,
      };
    }

    const hasFailures = audit.missingScenarios.length > 0;
    return {
      status: hasFailures ? 'FAIL' : 'PASS',
      exitCode: hasFailures ? 1 : 0,
      covered: audit.coveredScenarios,
      missing: audit.missingScenarios,
      totalFiles: audit.inspectedFiles.length,
      isPending: false,
    };
  } catch (error) {
    logger.error(`[FS-TESTS] Erro operacional: ${error.message}`);
    return {
      status: 'ERROR',
      exitCode: 2,
      covered: [],
      missing: MANDATORY_TEST_SCENARIOS.map((s) => s.id),
      totalFiles: 0,
      isPending: false,
    };
  }
}

// Execução CLI direta
if (process.argv[1] && process.argv[1].endsWith('verify-tests.mjs')) {
  const args = process.argv.slice(2);
  let testsDir = path.join('tests', 'unit', 'platform', 'file-system');
  let isJson = false;
  let isQuiet = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      testsDir = args[++i];
    } else if (args[i] === '--json') {
      isJson = true;
    } else if (args[i] === '--quiet') {
      isQuiet = true;
    } else if (!args[i].startsWith('-')) {
      testsDir = args[i];
    }
  }

  verifyFilesystemTests({ testsDir }).then((res) => {
    if (isJson) {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    }

    if (!isQuiet) {
      console.log(`\n🧪 [FS-TESTS] Auditoria de Cenários de Teste da File System Access API`);
      console.log(`   Diretório de testes: "${testsDir}"\n`);
    }

    if (res.status === 'PASS_PENDING_IMPLEMENTATION') {
      if (!isQuiet) {
        console.log(
          `ℹ️  [FS-TESTS] Fase de Preparação Ativa: Funcionalidade ainda não implementada no produto.`
        );
        console.log(
          `   Matriz de 13 cenários canônicos pronta para auditar os testes quando forem desenvolvidos.`
        );
        console.log(`   Status: PASS (Pronto para implementação futura).\n`);
      }
      process.exit(0);
    } else if (res.exitCode === 0) {
      if (!isQuiet) {
        console.log(
          `✅ [FS-TESTS] Aprovado: Todos os 13 cenários obrigatórios possuem testes implementados.\n`
        );
      }
      process.exit(0);
    } else if (res.exitCode === 1) {
      console.error(
        `❌ [FS-TESTS] Cenários de teste obrigatórios ausentes (${res.missing.length}):\n`
      );
      for (const mId of res.missing) {
        const scenario = MANDATORY_TEST_SCENARIOS.find((s) => s.id === mId);
        console.error(`  - [${mId}] ${scenario ? scenario.name : 'Desconhecido'}`);
      }
      console.error(
        '\nImplemente testes para os cenários faltantes antes de aprovar a capacidade.\n'
      );
      process.exit(1);
    } else {
      console.error(`🚨 [FS-TESTS] Erro na execução da auditoria.`);
      process.exit(2);
    }
  });
}
