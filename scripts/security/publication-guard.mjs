/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/security/publication-guard.mjs
 * Responsabilidade: Orquestrador central e guardião de publicação do repositório.
 *
 * Propósito:
 * Orquestrar a execução encadeada de todos os scanners de segurança (Markdown,
 * arquivos sensíveis, segredos, referências proibidas e caminhos privados),
 * tanto para hooks locais do Git (`pre-commit`, `pre-push`) quanto para pipelines de CI.
 *
 * Integração com a Biblioteca Compartilhada (FASE-SCRIPTS-01):
 * - Utiliza `scripts/lib/git-utils.mjs` para operações seguras de consulta Git,
 *   inspeção autêntica de blobs do index Git e snapshots de commits outgoing.
 * - Utiliza `scripts/lib/logger.mjs` para diagnósticos CLI sanitizados e padronizados.
 *
 * Princípios Fail-Safe Adotados:
 * - Código 0: Todas as verificações concluídas com zero violações.
 * - Código 1: Violação de segurança detectada e bloqueada.
 * - Código 2: Erro operacional, configuração ausente ou falha irrecuperável.
 * ==============================================================================
 */

import {
  getStagedFiles,
  getOutgoingCommitObjects,
  getTrackedFiles,
  createStagedSnapshot,
  createOutgoingSnapshots,
} from '../lib/git-utils.mjs';
import { logger } from '../lib/logger.mjs';
import { scanMarkdownFiles } from './scan-markdown.mjs';
import { scanSensitiveFiles } from './scan-sensitive-files.mjs';
import { scanSecrets } from './scan-secrets.mjs';
import { scanForbiddenReferences } from './scan-forbidden-references.mjs';
import { scanPrivatePaths } from './scan-private-paths.mjs';

// Reexporta funções para garantir retrocompatibilidade integral com testes existentes
export {
  getStagedFiles,
  getOutgoingCommitObjects,
  createStagedSnapshot as prepareStagedSnapshot,
  createOutgoingSnapshots as prepareOutgoingSnapshots,
};

/**
 * Obtém a lista consolidada de nomes de arquivos alterados nos commits outgoing.
 *
 * @param {string} [projectRoot=process.cwd()]
 * @returns {string[]}
 */
export function getOutgoingFiles(projectRoot = process.cwd()) {
  const commitObjs = getOutgoingCommitObjects(projectRoot);
  return Array.from(new Set(commitObjs.map((o) => o.file)));
}

/**
 * Orquestra todos os scanners de segurança contra um conjunto de arquivos.
 *
 * @param {string[]} files - Lista de arquivos a inspecionar.
 * @param {Object} [options={}] - Opções de configuração (projectRoot, requirePrivateConfig).
 * @returns {{ passed: boolean, violations: Array<Object>, details: Object }}
 */
export function runGuard(files, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  logger.info(`Executando Guardião de Publicação em ${files.length} arquivo(s)...`);

  const results = {
    markdown: scanMarkdownFiles(files, { projectRoot }),
    sensitive: scanSensitiveFiles(files, { projectRoot }),
    secrets: scanSecrets(files, { projectRoot }),
    forbiddenRefs: scanForbiddenReferences(files, {
      projectRoot,
      requirePrivateConfig: Boolean(options.requirePrivateConfig),
    }),
    privatePaths: scanPrivatePaths(files, { projectRoot }),
  };

  const allViolations = [
    ...results.markdown.violations,
    ...results.sensitive.violations,
    ...results.secrets.violations,
    ...results.forbiddenRefs.violations,
    ...results.privatePaths.violations,
  ];

  const passed = allViolations.length === 0;

  return {
    passed,
    violations: allViolations,
    details: results,
  };
}

// Ponto de entrada CLI para execução via linha de comando ou hooks de Git
if (process.argv[1] && process.argv[1].endsWith('publication-guard.mjs')) {
  const mode = process.argv[2] || 'staged';
  let files = [];
  let stagedSnapshot = null;
  let outgoingSnapshots = [];

  try {
    if (mode === 'staged') {
      files = getStagedFiles();
      if (files.length > 0) {
        stagedSnapshot = createStagedSnapshot(files);
      }
    } else if (mode === 'outgoing') {
      const commitObjs = getOutgoingCommitObjects();
      files = Array.from(new Set(commitObjs.map((o) => o.file)));
      if (commitObjs.length > 0) {
        outgoingSnapshots = createOutgoingSnapshots(commitObjs);
      }
    } else if (mode === 'all') {
      files = getTrackedFiles();
    } else {
      files = process.argv.slice(2);
    }
  } catch (err) {
    logger.error(
      `Erro Operacional: Falha ao determinar escopo para o modo "${mode}": ${err.message}`
    );
    process.exit(2);
  }

  if (files.length === 0) {
    logger.info(`Nenhum arquivo detectado para inspeção no modo "${mode}". Verificação aprovada.`);
    process.exit(0);
  }

  let totalViolations = [];

  try {
    if (mode === 'staged' && stagedSnapshot) {
      const res = runGuard(files, { projectRoot: stagedSnapshot.targetRoot });
      totalViolations = res.violations;
    } else if (mode === 'outgoing' && outgoingSnapshots.length > 0) {
      logger.info(`Auditando ${outgoingSnapshots.length} snapshot(s) de commits outgoing...`);
      for (const snap of outgoingSnapshots) {
        const res = runGuard(snap.files, { projectRoot: snap.targetRoot });
        for (const v of res.violations) {
          totalViolations.push({
            ...v,
            details: `[Commit ${snap.commit.slice(0, 7)}] ${v.details}`,
          });
        }
      }
    } else {
      const res = runGuard(files, { projectRoot: process.cwd() });
      totalViolations = res.violations;
    }

    if (totalViolations.length > 0) {
      logger.section('OPERAÇÃO BLOQUEADA PELO GUARDIÃO DE PUBLICAÇÃO');
      logger.error(`Total de violações detectadas: ${totalViolations.length}\n`);
      totalViolations.forEach((v) => {
        logger.error(`[${v.rule}] ${v.file}${v.line ? ':' + v.line : ''} -> ${v.details}`);
      });
      logger.error(
        '\nPor favor, corrija as violações de segurança antes de commitar ou fazer push.\n'
      );
      process.exit(1);
    } else {
      logger.success('GUARDIÃO DE PUBLICAÇÃO: Todas as verificações foram concluídas com sucesso.');
      process.exit(0);
    }
  } finally {
    if (stagedSnapshot) {
      stagedSnapshot.cleanup();
    }
    for (const snap of outgoingSnapshots) {
      snap.cleanup();
    }
  }
}
