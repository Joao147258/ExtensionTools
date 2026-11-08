/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/security/scan-markdown.mjs
 * Responsabilidade: Auditoria de conformidade de documentos Markdown (.md).
 *
 * Propósito:
 * Verificar se arquivos Markdown destinados à publicação estão em diretórios
 * públicos autorizados, se não utilizam sufixos protegidos (*.private.md, *.local.md)
 * e se não contêm marcadores explícitos de confidencialidade (ex: CONFIDENTIAL).
 *
 * Integração com a Biblioteca Compartilhada:
 * Utiliza `scripts/lib/fs-utils.mjs` para normalização universal de caminhos e
 * `scripts/lib/logger.mjs` para emissão padronizada de diagnósticos CLI sanitizados.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadSafetyConfig } from './config-loader.mjs';
import { normalizePath } from '../lib/fs-utils.mjs';
import { logger } from '../lib/logger.mjs';

/**
 * Realiza a varredura de arquivos Markdown contra regras de confidencialidade.
 *
 * @param {string[]} filePaths - Lista de caminhos de arquivos a examinar.
 * @param {Object} [options={}] - Opções de configuração (ex: projectRoot).
 * @returns {{ violations: Array<{ file: string, rule: string, details: string }>, passed: boolean }}
 */
export function scanMarkdownFiles(filePaths, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const { publicConfig } = loadSafetyConfig(projectRoot);
  const { rules } = publicConfig;

  const violations = [];

  for (const rawFile of filePaths) {
    const relFile = path.isAbsolute(rawFile) ? path.relative(projectRoot, rawFile) : rawFile;
    const normalizedPath = normalizePath(relFile);

    // Processa exclusivamente arquivos com extensão .md
    if (!normalizedPath.toLowerCase().endsWith('.md')) {
      continue;
    }

    // 1. Verificação de localização em diretórios estritamente proibidos
    for (const prohibitedDir of rules.prohibitedDirectories) {
      if (
        normalizedPath.startsWith(`${prohibitedDir}/`) ||
        normalizedPath === prohibitedDir ||
        normalizedPath.includes(`/${prohibitedDir}/`)
      ) {
        violations.push({
          file: normalizedPath,
          rule: 'PROHIBITED_DIRECTORY',
          details: `O documento Markdown reside dentro de diretório proibido: ${prohibitedDir}`,
        });
      }
    }

    // 2. Verificação de sufixos de nomenclatura restrita (*.private.md, *.local.md, etc.)
    for (const suffix of rules.privateMarkdownSuffixes) {
      if (normalizedPath.toLowerCase().endsWith(suffix.toLowerCase())) {
        violations.push({
          file: normalizedPath,
          rule: 'PRIVATE_MARKDOWN_SUFFIX',
          details: `O documento Markdown utiliza um sufixo privado protegido: ${suffix}`,
        });
      }
    }

    // 3. Inspeção de conteúdo para detecção de marcadores de confidencialidade
    const fullPath = path.isAbsolute(rawFile) ? rawFile : path.join(projectRoot, rawFile);

    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');

        for (const marker of rules.confidentialityMarkers) {
          if (content.toUpperCase().includes(marker.toUpperCase())) {
            violations.push({
              file: normalizedPath,
              rule: 'CONFIDENTIALITY_MARKER',
              details: `O arquivo contém marcador explícito de confidencialidade: ${marker}`,
            });
            break;
          }
        }
      } catch (err) {
        violations.push({
          file: normalizedPath,
          rule: 'READ_ERROR',
          details: `Falha ao ler arquivo Markdown para inspeção: ${err.message}`,
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
if (process.argv[1] && process.argv[1].endsWith('scan-markdown.mjs')) {
  const files = process.argv.slice(2);
  const targetFiles = files.length > 0 ? files : ['.'];
  const res = scanMarkdownFiles(targetFiles);
  if (!res.passed) {
    logger.error('Scanner de Documentos Markdown encontrou violações:');
    res.violations.forEach((v) => logger.error(`  - [${v.rule}] ${v.file}: ${v.details}`));
    process.exit(1);
  } else {
    logger.success('Scanner de Documentos Markdown: Todos os arquivos examinados foram aprovados.');
    process.exit(0);
  }
}
