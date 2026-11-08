/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/security/scan-private-paths.mjs
 * Responsabilidade: Detecção de caminhos absolutos e específicos de estações de
 *                  trabalho privadas nos arquivos destinados à publicação.
 *
 * Propósito:
 * Garantir a regra máxima do repositório público: nenhum caminho absoluto de
 * desenvolvimento (/home/username, C:\Users\username) deve ser commitado no repositório.
 *
 * Integração com a Biblioteca Compartilhada:
 * Utiliza `scripts/lib/fs-utils.mjs` para normalização de caminhos e
 * `scripts/lib/logger.mjs` para emissão padronizada de diagnósticos CLI.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadSafetyConfig } from './config-loader.mjs';
import { normalizePath } from '../lib/fs-utils.mjs';
import { logger } from '../lib/logger.mjs';

/**
 * Realiza a varredura do conteúdo de arquivos em busca de caminhos absolutos de estações privadas.
 *
 * @param {string[]} filePaths - Lista de caminhos de arquivos a inspecionar.
 * @param {Object} [options={}] - Opções de configuração (ex: projectRoot).
 * @returns {{ violations: Array<{ file: string, rule: string, details: string, line: number }>, passed: boolean }}
 */
export function scanPrivatePaths(filePaths, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const { publicConfig } = loadSafetyConfig(projectRoot);
  const { rules } = publicConfig;

  const violations = [];
  const patterns = (rules.privatePathPatterns || []).map((p) => new RegExp(p));
  const exceptions = (rules.privatePathExceptions || []).map((e) => new RegExp(e));

  for (const rawFile of filePaths) {
    const relFile = path.isAbsolute(rawFile) ? path.relative(projectRoot, rawFile) : rawFile;
    const normalizedPath = normalizePath(relFile);
    const fullPath = path.isAbsolute(rawFile) ? rawFile : path.join(projectRoot, rawFile);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory() || stats.size > 5 * 1024 * 1024) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];

        // Ignora linhas que coincidam com exceções registradas (ex: runners da CI do GitHub)
        const isExcepted = exceptions.some((exp) => exp.test(lineText));
        if (isExcepted) {
          continue;
        }

        for (const pat of patterns) {
          if (pat.test(lineText)) {
            violations.push({
              file: normalizedPath,
              rule: 'PRIVATE_ABSOLUTE_PATH',
              details: 'A linha contém caminho absoluto específico de estação de trabalho privada.',
              line: i + 1,
            });
            break;
          }
        }
      }
    } catch (err) {
      if (err.code !== 'EISDIR') {
        violations.push({
          file: normalizedPath,
          rule: 'READ_ERROR',
          details: `Falha ao inspecionar arquivo para caminhos privados: ${err.message}`,
          line: 0,
        });
      }
    }
  }

  return {
    violations,
    passed: violations.length === 0,
  };
}

// Ponto de entrada CLI para execução direta do scanner
if (process.argv[1] && process.argv[1].endsWith('scan-private-paths.mjs')) {
  const files = process.argv.slice(2);
  const targetFiles = files.length > 0 ? files : ['.'];
  const res = scanPrivatePaths(targetFiles);
  if (!res.passed) {
    logger.error('Scanner de Caminhos Privados encontrou violações:');
    res.violations.forEach((v) =>
      logger.error(`  - [${v.rule}] ${v.file}:${v.line} -> ${v.details}`)
    );
    process.exit(1);
  } else {
    logger.success('Scanner de Caminhos Privados: Todos os arquivos examinados foram aprovados.');
    process.exit(0);
  }
}
