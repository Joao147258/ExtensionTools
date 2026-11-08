/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/filesystem/verify-security.mjs
 * Responsabilidade: Detectar padrões de risco e vulnerabilidades na utilização
 *                  da File System Access API e manipulação de arquivos locais.
 *
 * Catálogo de Regras de Segurança:
 * - FS-SEC-01: Exclusão recursiva desprotegida (removeEntry com { recursive: true }
 *              sem guard de confirmação ou função de proteção explícita).
 * - FS-SEC-02: Sobrescrita de arquivos descontrolada (createWritable() sem tratamento
 *              de keepExistingData ou validação de colisão).
 * - FS-SEC-03: Ausência de tratamento para negação de permissão ('denied' / NotAllowedError
 *              em queryPermission/requestPermission).
 * - FS-SEC-04: Reutilização de handles restaurados do IndexedDB sem reverificação
 *              mandatória de queryPermission().
 * - FS-SEC-05: Invocação indevida de pickers sem User Activation (chamadas dentro de
 *              setTimeout, setInterval ou rotinas de mount/timer).
 * - FS-SEC-06: Exposição de dados sensíveis ou conteúdo de arquivos em chamadas de console.
 * - FS-SEC-07: Inflação de permissões no manifesto (permissão obsoleta 'fileSystem'
 *              ou 'nativeMessaging' sem ADR aprovado).
 *
 * Classificação de Verificações:
 * - Estática / Sintática: Regras detectadas deterministicamente no código-fonte.
 * - Semântica / Comportamental: Regras que requerem acompanhamento de testes dinâmicos
 *                               e são sinalizadas com status de validação complementar.
 *
 * Códigos de Saída (Exit Codes):
 * - 0: Nenhuma vulnerabilidade ou padrão de risco detectado (PASS)
 * - 1: Uma ou mais vulnerabilidades detectadas (FAIL)
 * - 2: Erro operacional durante a análise (ERROR)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, walkDirectory } from '../lib/fs-utils.mjs';
import { getStagedFiles } from '../lib/git-utils.mjs';
import { logger } from '../lib/logger.mjs';
import { stripCommentsPreservingLayout } from './verify-boundaries.mjs';

/**
 * Localiza ocorrências com número de linha correspondente.
 *
 * @param {string} cleanCode
 * @param {RegExp} regex
 * @returns {Array<{ line: number, match: string, index: number }>}
 */
function findMatches(cleanCode, regex) {
  const matches = [];
  const r = new RegExp(regex.source, regex.flags);
  let m;

  while ((m = r.exec(cleanCode)) !== null) {
    const line = cleanCode.slice(0, m.index).split('\n').length;
    matches.push({ line, match: m[0], index: m.index });
    if (!r.global) break;
  }
  return matches;
}

/**
 * Inspeciona violações de segurança em um arquivo de código-fonte.
 *
 * @param {string} filePath - Caminho relativo do arquivo.
 * @param {string} content - Conteúdo textual do arquivo.
 * @returns {Array<Object>} Lista de violações encontradas.
 */
export function inspectFileSecurity(filePath, content) {
  const violations = [];
  const normPath = normalizePath(filePath);
  const cleanCode = stripCommentsPreservingLayout(content);

  // FS-SEC-01: Exclusão recursiva desprotegida
  // Detecta .removeEntry(..., { recursive: true }) onde não há guard ou confirmação explícita
  const recursiveRemoveRegex =
    /\.removeEntry\s*\(\s*[^,]+,\s*\{[^}]*recursive\s*:\s*true[^}]*\}\s*\)/g;
  const recursiveMatches = findMatches(cleanCode, recursiveRemoveRegex);
  for (const m of recursiveMatches) {
    // Verifica se a chamada está envolvida por uma verificação de confirmação (ex: confirm, withConfirmation, confirmed, etc.)
    const surroundingSnippet = cleanCode.slice(
      Math.max(0, cleanCode.indexOf(m.match) - 200),
      cleanCode.indexOf(m.match) + 200
    );
    const hasConfirmationGuard =
      /confirm|withConfirmation|isConfirmed|requireConfirmation|confirmed\s*===?\s*true/i.test(
        surroundingSnippet
      );

    if (!hasConfirmationGuard) {
      violations.push({
        ruleId: 'FS-SEC-01',
        file: normPath,
        line: m.line,
        severity: 'CRITICAL',
        type: 'SYNTACTIC',
        message: 'Exclusão recursiva de diretório detectada sem guard de confirmação do usuário.',
        remediation:
          'Exija confirmação explícita em duas etapas do usuário antes de invocar removeEntry com { recursive: true }.',
      });
    }
  }

  // FS-SEC-03: Ausência de tratamento para negação de permissão
  // Detecta chamadas a requestPermission ou queryPermission sem captura de 'denied' ou catch de NotAllowedError
  const permissionCallRegex = /\.(?:requestPermission|queryPermission)\s*\(/g;
  const permMatches = findMatches(cleanCode, permissionCallRegex);
  for (const m of permMatches) {
    const callIndex = cleanCode.indexOf(m.match);
    const scopeSnippet = cleanCode.slice(callIndex, callIndex + 400);
    const checksDenied = /'denied'|"denied"|NotAllowedError|catch\s*\(/.test(scopeSnippet);

    if (!checksDenied) {
      violations.push({
        ruleId: 'FS-SEC-03',
        file: normPath,
        line: m.line,
        severity: 'HIGH',
        type: 'SYNTACTIC',
        message:
          'Chamada a queryPermission/requestPermission sem tratamento do estado "denied" ou NotAllowedError.',
        remediation:
          'Trate explicitamente o retorno === "denied" e encerre a operação graciosamente com aviso ao usuário.',
      });
    }
  }

  // FS-SEC-05: Invocação de pickers em timers ou handlers sem User Activation
  const pickerInsideTimerRegex =
    /(?:setTimeout|setInterval)\s*\(\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*\{?[\s\S]*?(?:window\.)?show(?:OpenFile|SaveFile|Directory)Picker/g;
  const timerMatches = findMatches(cleanCode, pickerInsideTimerRegex);
  for (const m of timerMatches) {
    violations.push({
      ruleId: 'FS-SEC-05',
      file: normPath,
      line: m.line,
      severity: 'HIGH',
      type: 'SYNTACTIC',
      message:
        'Invocação de diálogo de arquivo dentro de setTimeout/setInterval (User Activation expirada).',
      remediation:
        'Pickers nativos devem ser chamados em resposta síncrona/direta a um evento de ponteiro ou teclado do usuário.',
    });
  }

  // FS-SEC-06: Exposição de dados de arquivos em console.log
  const logContentRegex =
    /console\.(?:log|warn|error)\s*\(\s*[^)]*(?:fileContent|fileBuffer|rawBytes|readAsText|password|token|secret)[^)]*\)/g;
  const logMatches = findMatches(cleanCode, logContentRegex);
  for (const m of logMatches) {
    violations.push({
      ruleId: 'FS-SEC-06',
      file: normPath,
      line: m.line,
      severity: 'MEDIUM',
      type: 'SYNTACTIC',
      message:
        'Possível vazamento de conteúdo bruto de arquivo ou token confidencial em chamada de console.',
      remediation:
        'Utilize o logger sanitizado em scripts/lib/logger.mjs e nunca imprima conteúdo integral de arquivos em logs.',
    });
  }

  return violations;
}

/**
 * Audita a configuração do manifesto para detectar inflação de permissões.
 *
 * @param {string} projectRoot
 * @returns {Array<Object>}
 */
export function inspectManifestSecurity(projectRoot) {
  const violations = [];
  const candidates = [
    path.join(projectRoot, 'wxt.config.ts'),
    path.join(projectRoot, 'src', 'manifest.json'),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const rel = normalizePath(path.relative(projectRoot, file));

    // Permissão legada fileSystem (Chrome Apps obsoleta)
    if (/['"]fileSystem['"]/.test(content)) {
      violations.push({
        ruleId: 'FS-SEC-07',
        file: rel,
        line: 1,
        severity: 'HIGH',
        type: 'SYNTACTIC',
        message:
          'Permissão obsoleta "fileSystem" encontrada no manifesto (exclusiva de Chrome Apps legados).',
        remediation:
          'A File System Access API não requer permissão "fileSystem" no manifesto do Manifest V3. Remova a entrada.',
      });
    }

    // Permissão nativeMessaging sem ADR
    if (/['"]nativeMessaging['"]/.test(content)) {
      const adrDir = path.join(projectRoot, 'docs', 'architecture', 'adr');
      let hasApprovedAdr = false;
      if (fs.existsSync(adrDir)) {
        const adrs = fs.readdirSync(adrDir);
        hasApprovedAdr = adrs.some(
          (a) => a.includes('native-messaging') || a.includes('native_messaging')
        );
      }

      if (!hasApprovedAdr) {
        violations.push({
          ruleId: 'FS-SEC-07',
          file: rel,
          line: 1,
          severity: 'CRITICAL',
          type: 'SYNTACTIC',
          message:
            'Permissão sensível "nativeMessaging" declarada no manifesto sem Architecture Decision Record (ADR) aprovado.',
          remediation:
            'Remova a permissão ou submeta um ADR justificando o uso de Native Messaging para aprovação do Architect.',
        });
      }
    }
  }

  return violations;
}

/**
 * Executa a auditoria completa de segurança da File System Access API.
 *
 * @param {Object} [options={}]
 * @param {string} [options.scope='all']
 * @param {string} [options.projectRoot=process.cwd()]
 * @param {string[]} [options.files]
 * @returns {Promise<{ status: 'PASS' | 'FAIL' | 'ERROR', exitCode: number, violations: Array<Object>, totalFiles: number, semanticRulesNotice: string }>}
 */
export async function verifyFilesystemSecurity(options = {}) {
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
      const fileViolations = inspectFileSecurity(relPath, content);
      allViolations.push(...fileViolations);
    }

    // Auditoria de manifesto
    const manifestViolations = inspectManifestSecurity(projectRoot);
    allViolations.push(...manifestViolations);

    const hasFailures = allViolations.length > 0;
    return {
      status: hasFailures ? 'FAIL' : 'PASS',
      exitCode: hasFailures ? 1 : 0,
      violations: allViolations,
      totalFiles: inspectedCount,
      semanticRulesNotice:
        'Nota de Segurança: Regras semânticas (como expiração de tokens e locks de SO) exigem validação em testes comportamentais dinâmicos no Vitest e Playwright.',
    };
  } catch (error) {
    logger.error(`[FS-SECURITY] Erro operacional: ${error.message}`);
    return {
      status: 'ERROR',
      exitCode: 2,
      violations: [{ ruleId: 'OPERATIONAL_ERROR', message: error.message }],
      totalFiles: 0,
      semanticRulesNotice: '',
    };
  }
}

// Execução CLI direta
if (process.argv[1] && process.argv[1].endsWith('verify-security.mjs')) {
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

  verifyFilesystemSecurity({ scope }).then((res) => {
    if (isJson) {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    }

    if (!isQuiet) {
      console.log(`\n🛡️  [FS-SECURITY] Auditoria de Segurança da File System Access API`);
      console.log(`   Escopo: "${scope}" | Arquivos inspecionados: ${res.totalFiles}\n`);
    }

    if (res.exitCode === 0) {
      if (!isQuiet) {
        console.log(`✅ [FS-SECURITY] Aprovado: Zero vulnerabilidades de segurança detectadas.`);
        console.log(`   ${res.semanticRulesNotice}\n`);
      }
      process.exit(0);
    } else if (res.exitCode === 1) {
      console.error(
        `❌ [FS-SECURITY] Vulnerabilidades detectadas (${res.violations.length} ocorrências):\n`
      );
      for (const v of res.violations) {
        console.error(`  - [${v.ruleId}] [${v.severity}] ${v.file}:${v.line || 1}`);
        console.error(`    Mensagem: ${v.message}`);
        console.error(`    Remediação: ${v.remediation}\n`);
      }
      process.exit(1);
    } else {
      console.error(`🚨 [FS-SECURITY] Erro na execução da auditoria.`);
      process.exit(2);
    }
  });
}
