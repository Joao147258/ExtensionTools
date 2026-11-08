/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/security/scan-forbidden-references.mjs
 * Responsabilidade: Auditoria do conteúdo de arquivos contra termos corporativos
 *                  e identificadores confidenciais definidos em configuração privada.
 *
 * Propósito:
 * Garantir que nomes de clientes, códigos de projetos internos ou identificadores
 * corporativos restritos definidos em `.local/repository-safety.private.json` jamais
 * apareçam no repositório público, sem expor os termos proibidos nas mensagens de erro.
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
 * Realiza a varredura do conteúdo de arquivos em busca de identificadores corporativos proibidos.
 * NUNCA revela os termos proibidos em saídas ou relatórios.
 *
 * @param {string[]} filePaths - Lista de caminhos de arquivos a inspecionar.
 * @param {Object} [options={}] - Opções de configuração (ex: requirePrivateConfig, projectRoot).
 * @returns {{ violations: Array<{ file: string, rule: string, details: string, line: number }>, passed: boolean }}
 */
export function scanForbiddenReferences(filePaths, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const { privateConfig, hasPrivateConfig } = loadSafetyConfig(projectRoot);

  const violations = [];

  if (options.requirePrivateConfig && !hasPrivateConfig) {
    violations.push({
      file: 'PROJECT_ROOT',
      rule: 'MISSING_REQUIRED_PRIVATE_CONFIG',
      details:
        'A configuração privada de segurança (.local/repository-safety.private.json) é obrigatória para este escopo mas está ausente.',
      line: 0,
    });
    return { violations, passed: false };
  }

  const forbiddenRefs = privateConfig.forbiddenReferences || [];
  if (forbiddenRefs.length === 0) {
    return { violations, passed: true };
  }

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

      for (let idx = 0; idx < forbiddenRefs.length; idx++) {
        const ref = forbiddenRefs[idx];
        if (!ref || ref.trim().length === 0) continue;

        const regex = new RegExp(`\\b${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            violations.push({
              file: normalizedPath,
              rule: 'FORBIDDEN_REFERENCE_DETECTED',
              details: `Referência confidencial proibida #${idx} detectada. O termo específico foi protegido e redigido.`,
              line: i + 1,
            });
          }
        }
      }
    } catch (err) {
      if (err.code !== 'EISDIR') {
        violations.push({
          file: normalizedPath,
          rule: 'READ_ERROR',
          details: `Falha ao inspecionar arquivo para referências proibidas: ${err.message}`,
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
if (process.argv[1] && process.argv[1].endsWith('scan-forbidden-references.mjs')) {
  const files = process.argv.slice(2);
  const targetFiles = files.length > 0 ? files : ['.'];
  const res = scanForbiddenReferences(targetFiles);
  if (!res.passed) {
    logger.error('Scanner de Referências Proibidas encontrou violações:');
    res.violations.forEach((v) =>
      logger.error(`  - [${v.rule}] ${v.file}:${v.line} -> ${v.details}`)
    );
    process.exit(1);
  } else {
    logger.success(
      'Scanner de Referências Proibidas: Todos os arquivos examinados foram aprovados.'
    );
    process.exit(0);
  }
}
