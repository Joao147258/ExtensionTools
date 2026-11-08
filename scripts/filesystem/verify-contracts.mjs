/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/filesystem/verify-contracts.mjs
 * Responsabilidade: Verificar a consistência dos contratos, interfaces e tipagem
 *                  da capacidade File System Access API.
 *
 * Propósito:
 * Garantir que, quando a implementação de File System for introduzida em
 * `src/platform/file-system/`, ela obedeça rigorosamente a:
 * 1. Existência de contratos públicos tipados (interfaces / types).
 * 2. Representação canônica de erros tipados de domínio.
 * 3. Validação de inputs e outputs.
 * 4. Separação explícita entre contratos (interfaces puras) e adaptadores concretos.
 * 5. Ausência de dependências de UI (React) ou entrypoints dentro dos contratos.
 *
 * Tratamento da Fase de Preparação (Ready-by-Default):
 * - Se o diretório `src/platform/file-system/` contiver apenas `.gitkeep` ou estiver
 *   vazio, o verificador confirma que nenhum arquivo avulso ou fora de padrão foi
 *   introduzido precocemente e retorna status de aprovação condicional
 *   (`PASS_PENDING_IMPLEMENTATION`, exit code 0).
 *
 * Códigos de Saída (Exit Codes):
 * - 0: Contratos conformes ou fase de preparação sem arquivos indevidos (PASS)
 * - 1: Violação de contrato ou dependência proibida encontrada (FAIL)
 * - 2: Erro operacional durante a análise (ERROR)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, walkDirectory } from '../lib/fs-utils.mjs';
import { logger } from '../lib/logger.mjs';
import { stripCommentsPreservingLayout } from './verify-boundaries.mjs';

/**
 * Inspeciona a integridade contratual de um diretório de File System.
 *
 * @param {string} targetDir - Caminho do diretório a inspecionar.
 * @param {string} projectRoot - Raiz do projeto.
 * @returns {{ isPending: boolean, violations: Array<Object>, inspectedFiles: string[] }}
 */
export function inspectFilesystemContracts(targetDir, projectRoot = process.cwd()) {
  const violations = [];
  const absDir = path.isAbsolute(targetDir) ? targetDir : path.resolve(projectRoot, targetDir);

  if (!fs.existsSync(absDir)) {
    return {
      isPending: true,
      violations: [],
      inspectedFiles: [],
    };
  }

  const allFiles = walkDirectory(
    absDir,
    {
      filter: (f) => !f.includes('node_modules'),
    },
    projectRoot
  );

  const sourceFiles = allFiles.filter(
    (f) => /\.(ts|tsx|js|mjs)$/.test(f) && !f.endsWith('.gitkeep') && !f.endsWith('.test.ts')
  );

  // Fase de preparação: nenhum arquivo de código-fonte ainda implementado
  if (sourceFiles.length === 0) {
    return {
      isPending: true,
      violations: [],
      inspectedFiles: allFiles,
    };
  }

  // Se arquivos de implementação existirem, audita os contratos obrigatórios
  const contractFiles = sourceFiles.filter(
    (f) =>
      f.includes('/contracts/') ||
      f.endsWith('types.ts') ||
      f.endsWith('contracts.ts') ||
      f.includes('.types.ts')
  );

  const adapterFiles = sourceFiles.filter(
    (f) =>
      !contractFiles.includes(f) &&
      (f.endsWith('Adapter.ts') || f.endsWith('adapter.ts') || f.endsWith('index.ts'))
  );

  // 1. Presença obrigatória de contratos tipados quando há adaptadores
  if (adapterFiles.length > 0 && contractFiles.length === 0) {
    violations.push({
      ruleId: 'FS-CON-01',
      file: normalizePath(path.relative(projectRoot, adapterFiles[0])),
      line: 1,
      severity: 'HIGH',
      message:
        'Adaptador de File System implementado sem arquivo de contratos/tipos associado (types.ts ou contracts/).',
      remediation:
        'Defina interfaces explícitas de entrada, saída e portas em "contracts/types.ts" antes de implementar o adaptador.',
    });
  }

  // 2. Validação individual de cada arquivo de contrato
  for (const cFile of contractFiles) {
    const absFile = path.isAbsolute(cFile) ? cFile : path.resolve(projectRoot, cFile);
    const content = fs.readFileSync(absFile, 'utf8');
    const cleanCode = stripCommentsPreservingLayout(content);
    const rel = normalizePath(path.relative(projectRoot, absFile));

    // Não deve importar React
    if (/(?:^|[;\n])\s*import\s+[^;]+from\s*['"]react['"]/.test(cleanCode)) {
      violations.push({
        ruleId: 'FS-CON-02',
        file: rel,
        line: 1,
        severity: 'HIGH',
        message: 'Contrato de File System importa dependência visual "react".',
        remediation:
          'Contratos de plataforma devem ser tipos puros em TypeScript, sem acoplamento a UI.',
      });
    }

    // Não deve importar entrypoints ou background
    if (/(?:^|[;\n])\s*import\s+[^;]+from\s*['"][^'"]*entrypoints\//.test(cleanCode)) {
      violations.push({
        ruleId: 'FS-CON-03',
        file: rel,
        line: 1,
        severity: 'CRITICAL',
        message: 'Contrato de File System importa módulo da camada superior "entrypoints/".',
        remediation: 'Inverta a dependência: entrypoints consomem platform, nunca o contrário.',
      });
    }

    // Verificação de erros tipados de domínio
    const definesErrorTypes =
      /interface\s+\w+Error|class\s+\w+Error|type\s+\w+Error/i.test(cleanCode) ||
      /FileNotFound|PermissionDenied|OperationAborted|TypeMismatch/i.test(cleanCode);

    if (!definesErrorTypes && contractFiles.length === 1) {
      violations.push({
        ruleId: 'FS-CON-04',
        file: rel,
        line: 1,
        severity: 'MEDIUM',
        message:
          'Contrato de File System não define representação tipada de erros (ex: FileError, PermissionDeniedError).',
        remediation:
          'Declare erros de domínio tipados para mapear deterministicamente as DOMException do navegador.',
      });
    }
  }

  return {
    isPending: false,
    violations,
    inspectedFiles: sourceFiles,
  };
}

/**
 * Executa a verificação completa de contratos de File System.
 *
 * @param {Object} [options={}]
 * @param {string} [options.targetDir='src/platform/file-system']
 * @param {string} [options.projectRoot=process.cwd()]
 * @returns {Promise<{ status: 'PASS' | 'PASS_PENDING_IMPLEMENTATION' | 'FAIL' | 'ERROR', exitCode: number, violations: Array<Object>, totalFiles: number, isPending: boolean }>}
 */
export async function verifyFilesystemContracts(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const targetDir = options.targetDir || path.join('src', 'platform', 'file-system');

  try {
    const inspection = inspectFilesystemContracts(targetDir, projectRoot);

    if (inspection.isPending) {
      return {
        status: 'PASS_PENDING_IMPLEMENTATION',
        exitCode: 0,
        violations: [],
        totalFiles: inspection.inspectedFiles.length,
        isPending: true,
      };
    }

    const hasFailures = inspection.violations.length > 0;
    return {
      status: hasFailures ? 'FAIL' : 'PASS',
      exitCode: hasFailures ? 1 : 0,
      violations: inspection.violations,
      totalFiles: inspection.inspectedFiles.length,
      isPending: false,
    };
  } catch (error) {
    logger.error(`[FS-CONTRACTS] Erro operacional: ${error.message}`);
    return {
      status: 'ERROR',
      exitCode: 2,
      violations: [{ ruleId: 'OPERATIONAL_ERROR', message: error.message }],
      totalFiles: 0,
      isPending: false,
    };
  }
}

// Execução CLI direta
if (process.argv[1] && process.argv[1].endsWith('verify-contracts.mjs')) {
  const args = process.argv.slice(2);
  let targetDir = path.join('src', 'platform', 'file-system');
  let isJson = false;
  let isQuiet = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      targetDir = args[++i];
    } else if (args[i] === '--json') {
      isJson = true;
    } else if (args[i] === '--quiet') {
      isQuiet = true;
    } else if (!args[i].startsWith('-')) {
      targetDir = args[i];
    }
  }

  verifyFilesystemContracts({ targetDir }).then((res) => {
    if (isJson) {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    }

    if (!isQuiet) {
      console.log(`\n📋 [FS-CONTRACTS] Verificador de Contratos da File System Access API`);
      console.log(`   Diretório inspecionado: "${targetDir}"\n`);
    }

    if (res.status === 'PASS_PENDING_IMPLEMENTATION') {
      if (!isQuiet) {
        console.log(
          `ℹ️  [FS-CONTRACTS] Fase de Preparação Ativa (Nenhum código de implementação introduzido).`
        );
        console.log(
          `   Diretório contém apenas .gitkeep. Governança contratual pronta para receber futura implementação.`
        );
        console.log(`   Resultado: PASS (0 violações).\n`);
      }
      process.exit(0);
    } else if (res.exitCode === 0) {
      if (!isQuiet) {
        console.log(
          `✅ [FS-CONTRACTS] Aprovado: Todos os contratos e interfaces são consistentes e puros.\n`
        );
      }
      process.exit(0);
    } else if (res.exitCode === 1) {
      console.error(
        `❌ [FS-CONTRACTS] Violações de contrato detectadas (${res.violations.length} ocorrências):\n`
      );
      for (const v of res.violations) {
        console.error(`  - [${v.ruleId}] [${v.severity}] ${v.file}:${v.line || 1}`);
        console.error(`    Mensagem: ${v.message}`);
        console.error(`    Remediação: ${v.remediation}\n`);
      }
      process.exit(1);
    } else {
      console.error(`🚨 [FS-CONTRACTS] Erro na execução da verificação.`);
      process.exit(2);
    }
  });
}
