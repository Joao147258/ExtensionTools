/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/filesystem/verify-boundaries.mjs
 * Responsabilidade: Verificar fronteiras arquiteturais para a File System Access API.
 *
 * Catálogo de Regras:
 * - FS-ARC-01: Componentes React (*.tsx ou imports de 'react') não devem invocar
 *              diretamente APIs globais de pickers (showOpenFilePicker, showSaveFilePicker,
 *              showDirectoryPicker). Devem consumir abstrações em platform/file-system.
 * - FS-ARC-02: APIs e manipuladores nativos de File System devem residir exclusivamente
 *              em adaptadores sob 'src/platform/file-system/' ou adaptadores autorizados.
 * - FS-ARC-03: A infraestrutura de mensageria ('src/platform/messaging/') não deve conter
 *              regras de manipulação ou gravação de arquivos no sistema de arquivos.
 * - FS-ARC-04: Contratos e tipos compartilhados não devem importar React ou módulos executáveis
 *              de infraestrutura.
 * - FS-ARC-05: APIs de Window (pickers) não podem ser executadas no Background Service Worker
 *              ('src/entrypoints/background/').
 *
 * Códigos de Saída (Exit Codes):
 * - 0: Todas as fronteiras respeitadas (PASS)
 * - 1: Uma ou mais violações arquiteturais detectadas (FAIL)
 * - 2: Erro operacional ou falha de sistema (ERROR)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, walkDirectory } from '../lib/fs-utils.mjs';
import { getStagedFiles } from '../lib/git-utils.mjs';
import { logger } from '../lib/logger.mjs';

/**
 * Remove comentários de bloco e linha preservando rigorosamente linhas e colunas.
 * Substitui o conteúdo dos comentários por espaços em branco para manter posições exatas.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripCommentsPreservingLayout(text) {
  let result = '';
  let inString = false;
  let stringDelim = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (c === '\n') {
        inLineComment = false;
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }

    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        result += '  ';
        i++;
      } else if (c === '\n') {
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }

    if (inString) {
      result += c;
      if (c === '\\') {
        i++;
        if (i < text.length) result += text[i];
      } else if (c === stringDelim) {
        inString = false;
      }
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringDelim = c;
      result += c;
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      result += '  ';
      i++;
      continue;
    }

    if (c === '/' && next === '*') {
      inBlockComment = true;
      result += '  ';
      i++;
      continue;
    }

    result += c;
  }
  return result;
}

/**
 * Padrões de invocação de pickers nativos de Window.
 */
const PICKER_PATTERNS = [
  /\b(?:window\.)?showOpenFilePicker\s*\(/g,
  /\b(?:window\.)?showSaveFilePicker\s*\(/g,
  /\b(?:window\.)?showDirectoryPicker\s*\(/g,
];

/**
 * Padrões de chamadas nativas de baixo nível de File System.
 */
const LOW_LEVEL_FSA_PATTERNS = [
  /\.createWritable\s*\(/g,
  /\.createSyncAccessHandle\s*\(/g,
  /\b(?:window\.)?showOpenFilePicker\s*\(/g,
  /\b(?:window\.)?showSaveFilePicker\s*\(/g,
  /\b(?:window\.)?showDirectoryPicker\s*\(/g,
];

/**
 * Localiza números de linha para correspondências de regex em código limpo.
 *
 * @param {string} cleanCode
 * @param {RegExp} regex
 * @returns {Array<{ line: number, match: string }>}
 */
function findMatchesWithLine(cleanCode, regex) {
  const matches = [];
  const lines = cleanCode.split('\n');
  const r = new RegExp(regex.source, regex.flags);

  for (let idx = 0; idx < lines.length; idx++) {
    const lineText = lines[idx];
    r.lastIndex = 0;
    const m = r.exec(lineText);
    if (m) {
      matches.push({ line: idx + 1, match: m[0] });
    }
  }
  return matches;
}

/**
 * Inspeciona violações arquiteturais de File System em um único arquivo de código.
 *
 * @param {string} filePath - Caminho relativo do arquivo.
 * @param {string} content - Conteúdo textual do arquivo.
 * @returns {Array<Object>} Lista de violações encontradas.
 */
export function inspectFileBoundaries(filePath, content) {
  const violations = [];
  const normPath = normalizePath(filePath);
  const cleanCode = stripCommentsPreservingLayout(content);

  const isReactFile =
    normPath.endsWith('.tsx') ||
    normPath.endsWith('.jsx') ||
    /(?:^|[;\n])\s*import\s+[^;]+from\s*['"]react['"]/.test(cleanCode);

  const isBackgroundFile =
    normPath.includes('entrypoints/background') ||
    normPath.includes('background/index') ||
    normPath.includes('background.ts');

  const isMessagingFile =
    normPath.includes('platform/messaging') || normPath.includes('messaging/');

  const isContractFile =
    (normPath.includes('platform/file-system') ||
      normPath.includes('platform/filesystem') ||
      (normPath.includes('src/shared/types') && !normPath.includes('ui'))) &&
    (normPath.includes('contracts/') ||
      normPath.includes('.types.ts') ||
      normPath.endsWith('/types.ts') ||
      normPath.includes('contracts.ts'));

  const isPlatformFsAdapter =
    normPath.includes('platform/file-system') ||
    normPath.includes('platform/filesystem') ||
    normPath.includes('adapters/filesystem') ||
    normPath.includes('fixtures/filesystem');

  // FS-ARC-01: React não deve chamar pickers diretamente
  if (isReactFile) {
    for (const pattern of PICKER_PATTERNS) {
      const matches = findMatchesWithLine(cleanCode, pattern);
      for (const m of matches) {
        violations.push({
          ruleId: 'FS-ARC-01',
          file: normPath,
          line: m.line,
          severity: 'HIGH',
          message: `Componente React invoca diretamente API nativa de picker: "${m.match.trim()}".`,
          remediation:
            'Encapsule a seleção em adaptadores sob "src/platform/file-system/" ou utilize custom hooks autorizados.',
        });
      }
    }
  }

  // FS-ARC-02: APIs nativas de File System confinadas à camada de plataforma
  if (!isPlatformFsAdapter) {
    // Se estiver em features ou shared e chamar métodos diretos de I/O de FSA
    if (normPath.includes('src/features/') || normPath.includes('src/shared/')) {
      for (const pattern of LOW_LEVEL_FSA_PATTERNS) {
        const matches = findMatchesWithLine(cleanCode, pattern);
        for (const m of matches) {
          violations.push({
            ruleId: 'FS-ARC-02',
            file: normPath,
            line: m.line,
            severity: 'HIGH',
            message: `Chamada nativa de File System fora de "src/platform/file-system/": "${m.match.trim()}".`,
            remediation:
              'Mova a lógica de acesso a arquivos para "src/platform/file-system/" e consuma via contratos tipados.',
          });
        }
      }
    }
  }

  // FS-ARC-03: Messaging não deve conter lógica de manipulação de arquivos
  if (isMessagingFile) {
    for (const pattern of LOW_LEVEL_FSA_PATTERNS) {
      const matches = findMatchesWithLine(cleanCode, pattern);
      for (const m of matches) {
        violations.push({
          ruleId: 'FS-ARC-03',
          file: normPath,
          line: m.line,
          severity: 'HIGH',
          message: `Módulo de mensageria contém chamada de manipulação de File System: "${m.match.trim()}".`,
          remediation:
            'A infraestrutura de mensagens deve apenas transportar identificadores lógicos e metadados, nunca instâncias de stream ou I/O direto.',
        });
      }
    }
  }

  // FS-ARC-04: Contratos e tipos puros não devem importar React ou módulos executáveis
  if (isContractFile && !normPath.endsWith('.test.ts') && !normPath.endsWith('.test.tsx')) {
    if (/(?:^|[;\n])\s*import\s+[^;]+from\s*['"]react['"]/.test(cleanCode)) {
      const matches = findMatchesWithLine(
        cleanCode,
        /(?:^|[;\n])\s*import\s+[^;]+from\s*['"]react['"]/g
      );
      violations.push({
        ruleId: 'FS-ARC-04',
        file: normPath,
        line: matches[0]?.line || 1,
        severity: 'MEDIUM',
        message: 'Contrato ou arquivo de tipos importa dependência de visualização "react".',
        remediation: 'Remova imports de UI dos contratos puros de domínio/plataforma.',
      });
    }
  }

  // FS-ARC-05: Background Service Worker não pode chamar pickers de Window
  if (isBackgroundFile) {
    for (const pattern of PICKER_PATTERNS) {
      const matches = findMatchesWithLine(cleanCode, pattern);
      for (const m of matches) {
        violations.push({
          ruleId: 'FS-ARC-05',
          file: normPath,
          line: m.line,
          severity: 'CRITICAL',
          message: `Background Service Worker tenta invocar picker de Window: "${m.match.trim()}".`,
          remediation:
            'O Service Worker não possui contexto "window". Dispare a seleção a partir do Side Panel ou página gráfica com User Activation.',
        });
      }
    }
  }

  return violations;
}

/**
 * Executa a verificação completa de fronteiras arquiteturais de File System.
 *
 * @param {Object} [options={}]
 * @param {string} [options.scope='all']
 * @param {string} [options.projectRoot=process.cwd()]
 * @param {string[]} [options.files]
 * @returns {Promise<{ status: 'PASS' | 'FAIL' | 'ERROR', exitCode: number, violations: Array<Object>, totalFiles: number }>}
 */
export async function verifyFilesystemBoundaries(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const scope = options.scope || 'all';
  let targetFiles = options.files || [];
  let effectiveRoot = projectRoot;

  try {
    if (!options.files) {
      if (scope === 'staged') {
        targetFiles = getStagedFiles(projectRoot).filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f));
      } else if (scope === 'src') {
        const srcPath = path.resolve(projectRoot, 'src');
        if (fs.existsSync(srcPath)) {
          targetFiles = walkDirectory(
            srcPath,
            {
              filter: (f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f) && !f.includes('node_modules'),
            },
            projectRoot
          );
        }
      } else if (scope === 'all') {
        const srcPath = path.resolve(projectRoot, 'src');
        if (fs.existsSync(srcPath)) {
          targetFiles = walkDirectory(
            srcPath,
            {
              filter: (f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f) && !f.includes('node_modules'),
            },
            projectRoot
          );
        }
      } else {
        // Caminho explícito ou diretório customizado
        const absPath = path.isAbsolute(scope) ? scope : path.resolve(projectRoot, scope);
        if (fs.existsSync(absPath)) {
          const stat = fs.statSync(absPath);
          if (stat.isDirectory()) {
            effectiveRoot = absPath;
            targetFiles = walkDirectory(
              absPath,
              {
                filter: (f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f) && !f.includes('node_modules'),
              },
              absPath
            );
          } else {
            targetFiles = [absPath];
          }
        }
      }
    }

    const allViolations = [];
    let inspectedCount = 0;

    for (const filePath of targetFiles) {
      const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(effectiveRoot, filePath);
      if (!fs.existsSync(absPath)) continue;

      inspectedCount++;
      const content = fs.readFileSync(absPath, 'utf8');
      const relPath = normalizePath(path.relative(effectiveRoot, absPath));
      const fileViolations = inspectFileBoundaries(relPath, content);
      allViolations.push(...fileViolations);
    }

    const hasFailures = allViolations.length > 0;
    return {
      status: hasFailures ? 'FAIL' : 'PASS',
      exitCode: hasFailures ? 1 : 0,
      violations: allViolations,
      totalFiles: inspectedCount,
    };
  } catch (error) {
    logger.error(`[FS-BOUNDARIES] Erro operacional: ${error.message}`);
    return {
      status: 'ERROR',
      exitCode: 2,
      violations: [{ ruleId: 'OPERATIONAL_ERROR', message: error.message }],
      totalFiles: 0,
    };
  }
}

// Execução CLI direta
if (process.argv[1] && process.argv[1].endsWith('verify-boundaries.mjs')) {
  const args = process.argv.slice(2);
  let scope = 'all';
  let isJson = false;
  let isQuiet = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scope' && args[i + 1]) {
      scope = args[++i];
    } else if (args[i] === '--json') {
      isJson = true;
    } else if (args[i] === '--quiet') {
      isQuiet = true;
    } else if (!args[i].startsWith('-')) {
      scope = args[i];
    }
  }

  verifyFilesystemBoundaries({ scope }).then((res) => {
    if (isJson) {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    }

    if (!isQuiet) {
      console.log(`\n🔍 [FS-BOUNDARIES] Auditoria de Fronteiras Arquiteturais de File System`);
      console.log(`   Escopo: "${scope}" | Arquivos inspecionados: ${res.totalFiles}\n`);
    }

    if (res.exitCode === 0) {
      if (!isQuiet) {
        console.log(`✅ [FS-BOUNDARIES] Aprovado: Zero violações de fronteira encontradas.\n`);
      }
      process.exit(0);
    } else if (res.exitCode === 1) {
      console.error(`❌ [FS-BOUNDARIES] Falhas detectadas (${res.violations.length} violações):\n`);
      for (const v of res.violations) {
        console.error(`  - [${v.ruleId}] [${v.severity}] ${v.file}:${v.line || 1}`);
        console.error(`    Mensagem: ${v.message}`);
        console.error(`    Remediação: ${v.remediation}\n`);
      }
      process.exit(1);
    } else {
      console.error(`🚨 [FS-BOUNDARIES] Erro na execução da auditoria.`);
      process.exit(2);
    }
  });
}
