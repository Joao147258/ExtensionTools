/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/security/scan-sensitive-files.mjs
 * Responsabilidade: Auditoria de caminhos de arquivos contra extensões proibidas,
 *                  padrões perigosos e nomes de arquivos sensíveis.
 *
 * Propósito:
 * Bloquear sumariamente o versionamento ou empacotamento de arquivos com extensões
 * perigosas (ex: `.env`, `.pem`, `.key`, `.sql`, `.bak`), respeitando as exceções
 * legítimas registradas formalmente em `allowedFileExceptions` (ex: `.env.example`).
 *
 * Integração com a Biblioteca Compartilhada:
 * Utiliza `scripts/lib/fs-utils.mjs` para normalização universal de caminhos e
 * `scripts/lib/logger.mjs` para emissão padronizada de diagnósticos CLI.
 * ==============================================================================
 */

import path from 'node:path';
import { loadSafetyConfig } from './config-loader.mjs';
import { normalizePath } from '../lib/fs-utils.mjs';
import { logger } from '../lib/logger.mjs';

/**
 * Realiza a varredura de caminhos de arquivos contra padrões sensíveis e extensões proibidas.
 *
 * @param {string[]} filePaths - Lista de caminhos de arquivos a inspecionar.
 * @param {Object} [options={}] - Opções de configuração (ex: projectRoot).
 * @returns {{ violations: Array<{ file: string, rule: string, details: string }>, passed: boolean }}
 */
export function scanSensitiveFiles(filePaths, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const { publicConfig } = loadSafetyConfig(projectRoot);
  const { rules } = publicConfig;

  const violations = [];

  for (const rawFile of filePaths) {
    const relFile = path.isAbsolute(rawFile) ? path.relative(projectRoot, rawFile) : rawFile;
    const normalizedPath = normalizePath(relFile);
    const basename = path.basename(normalizedPath);

    // 1. Verifica se o arquivo é uma exceção legítima autorizada (ex: .env.example)
    let isAllowed = false;
    for (const allowedPattern of rules.allowedFileExceptions || []) {
      const reg = new RegExp(allowedPattern);
      if (reg.test(normalizedPath) || reg.test(basename)) {
        isAllowed = true;
        break;
      }
    }
    if (isAllowed) {
      continue;
    }

    // 2. Verifica se está contido em diretórios proibidos
    for (const prohibitedDir of rules.prohibitedDirectories) {
      if (
        normalizedPath.startsWith(`${prohibitedDir}/`) ||
        normalizedPath === prohibitedDir ||
        normalizedPath.includes(`/${prohibitedDir}/`)
      ) {
        violations.push({
          file: normalizedPath,
          rule: 'SENSITIVE_DIRECTORY',
          details: `O arquivo está localizado dentro do diretório proibido: ${prohibitedDir}`,
        });
        break;
      }
    }

    // 3. Verifica padrões regex de arquivos e extensões proibidas (.env, .pem, .bak, etc.)
    for (const pattern of rules.prohibitedFilePatterns) {
      const reg = new RegExp(pattern, 'i');
      if (reg.test(basename) || reg.test(normalizedPath)) {
        violations.push({
          file: normalizedPath,
          rule: 'SENSITIVE_FILE_PATTERN',
          details: `O arquivo coincide com o padrão de arquivo sensível/proibido: ${pattern}`,
        });
        break;
      }
    }
  }

  return {
    violations,
    passed: violations.length === 0,
  };
}

// Ponto de entrada CLI para execução direta do scanner
if (process.argv[1] && process.argv[1].endsWith('scan-sensitive-files.mjs')) {
  const files = process.argv.slice(2);
  const targetFiles = files.length > 0 ? files : ['.'];
  const res = scanSensitiveFiles(targetFiles);
  if (!res.passed) {
    logger.error('Scanner de Arquivos Sensíveis encontrou violações:');
    res.violations.forEach((v) => logger.error(`  - [${v.rule}] ${v.file}: ${v.details}`));
    process.exit(1);
  } else {
    logger.success('Scanner de Arquivos Sensíveis: Todos os caminhos examinados foram aprovados.');
    process.exit(0);
  }
}
