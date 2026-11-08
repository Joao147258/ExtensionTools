/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/filesystem/run-verify.mjs
 * Responsabilidade: Orquestrador unificado de governança e qualidade para a
 *                  File System Access API (QG Especializado).
 *
 * Sequência de Verificação Determinística:
 * 1. verify-boundaries.mjs: Fronteiras arquiteturais (React, Background, Messaging, Shared).
 * 2. verify-security.mjs:   Padrões de segurança e salvaguardas (Recursive remove, overwrite, permissions).
 * 3. verify-contracts.mjs:  Consistência de interfaces, tipagem e erros de domínio em platform/file-system.
 * 4. verify-tests.mjs:      Auditoria da matriz dos 13 cenários canônicos de teste.
 *
 * Códigos de Saída (Exit Codes):
 * - 0: Todas as verificações foram aprovadas (PASS)
 * - 1: Uma ou mais regras foram violadas (FAIL)
 * - 2: Erro operacional durante a execução (ERROR)
 * ==============================================================================
 */

import { verifyFilesystemBoundaries } from './verify-boundaries.mjs';
import { verifyFilesystemSecurity } from './verify-security.mjs';
import { verifyFilesystemContracts } from './verify-contracts.mjs';
import { verifyFilesystemTests } from './verify-tests.mjs';

/**
 * Executa a esteira unificada de governança de File System.
 *
 * @param {Object} [options={}]
 * @param {string} [options.scope='all']
 * @param {string} [options.projectRoot=process.cwd()]
 * @returns {Promise<{
 *   status: 'PASS' | 'FAIL' | 'ERROR',
 *   exitCode: number,
 *   summary: { totalGates: number, passed: number, pending: number, failed: number },
 *   results: Array<Object>
 * }>}
 */
export async function runAllFilesystemVerifications(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const scope = options.scope || 'all';

  const gates = [
    {
      name: 'QG-FS-01 — Fronteiras Arquiteturais (verify-boundaries)',
      runner: () => verifyFilesystemBoundaries({ scope, projectRoot }),
    },
    {
      name: 'QG-FS-02 — Salvaguardas e Segurança (verify-security)',
      runner: () => verifyFilesystemSecurity({ scope, projectRoot }),
    },
    {
      name: 'QG-FS-03 — Contratos e Tipagem (verify-contracts)',
      runner: () => verifyFilesystemContracts({ projectRoot }),
    },
    {
      name: 'QG-FS-04 — Cobertura de Cenários de Teste (verify-tests)',
      runner: () => verifyFilesystemTests({ projectRoot }),
    },
  ];

  const results = [];
  let passedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let errorCount = 0;

  for (const gate of gates) {
    try {
      const res = await gate.runner();
      results.push({
        gate: gate.name,
        ...res,
      });

      if (res.exitCode === 0) {
        if (res.status === 'PASS_PENDING_IMPLEMENTATION') {
          pendingCount++;
        } else {
          passedCount++;
        }
      } else if (res.exitCode === 1) {
        failedCount++;
      } else {
        errorCount++;
      }
    } catch (err) {
      errorCount++;
      results.push({
        gate: gate.name,
        status: 'ERROR',
        exitCode: 2,
        violations: [{ ruleId: 'OPERATIONAL_ERROR', message: err.message }],
      });
    }
  }

  const overallExitCode = errorCount > 0 ? 2 : failedCount > 0 ? 1 : 0;
  const overallStatus = overallExitCode === 0 ? 'PASS' : overallExitCode === 1 ? 'FAIL' : 'ERROR';

  return {
    status: overallStatus,
    exitCode: overallExitCode,
    summary: {
      totalGates: gates.length,
      passed: passedCount,
      pending: pendingCount,
      failed: failedCount,
      errors: errorCount,
    },
    results,
  };
}

// Execução CLI direta
if (process.argv[1] && process.argv[1].endsWith('run-verify.mjs')) {
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
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Uso: node scripts/filesystem/run-verify.mjs [opções]

Opções:
  --scope <all|src|staged|caminho>  Escopo de arquivos inspecionados (padrão: all)
  --json                            Emite resultado unificado em JSON
  --quiet                           Oprime mensagens informativas secundárias
  --help, -h                        Exibe este manual
`);
      process.exit(0);
    } else if (!args[i].startsWith('-')) {
      scope = args[i];
    }
  }

  if (!isQuiet && !isJson) {
    console.log(`\n======================================================================`);
    console.log(`   EXTENSIONTOOLS — QUALITY GATE ESPECIALIZADO: FILE SYSTEM ACCESS API `);
    console.log(`======================================================================`);
    console.log(`🔍 Iniciando esteira determinística de governança (Escopo: "${scope}")...\n`);
  }

  runAllFilesystemVerifications({ scope }).then((res) => {
    if (isJson) {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.exitCode);
    }

    for (const r of res.results) {
      if (r.exitCode === 0) {
        if (r.status === 'PASS_PENDING_IMPLEMENTATION') {
          console.log(`  [PENDENTE/PRONTO] ⏳ ${r.gate}`);
        } else {
          console.log(`  [APROVADO]        ✅ ${r.gate}`);
        }
      } else if (r.exitCode === 1) {
        console.error(
          `  [REPROVADO]       ❌ ${r.gate} (${r.violations?.length || r.missing?.length} violações)`
        );
      } else {
        console.error(`  [ERRO]            🚨 ${r.gate}`);
      }
    }

    console.log(`\n----------------------------------------------------------------------`);
    console.log(
      `Resumo: ${res.summary.totalGates} Gates | Aprovados: ${res.summary.passed} | Prontos/Pendentes: ${res.summary.pending} | Falhas: ${res.summary.failed}`
    );
    console.log(`----------------------------------------------------------------------\n`);

    if (res.exitCode === 0) {
      console.log(
        `🎉 [QG-FILESYSTEM] SUCESSO: Todos os gates de governança de File System foram aprovados.\n`
      );
      process.exit(0);
    } else if (res.exitCode === 1) {
      console.error(
        `❌ [QG-FILESYSTEM] FALHA: Corrija as violações reportadas antes de prosseguir.\n`
      );
      process.exit(1);
    } else {
      console.error(`🚨 [QG-FILESYSTEM] ERRO OPERACIONAL: A execução não pôde ser completada.\n`);
      process.exit(2);
    }
  });
}
