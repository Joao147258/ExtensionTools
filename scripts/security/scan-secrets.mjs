/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/security/scan-secrets.mjs
 * Responsabilidade: Auditoria profunda de conteúdo textual para detecção de
 *                  segredos, chaves criptográficas e credenciais de acesso.
 *
 * Propósito:
 * Analisar linha a linha arquivos monitorados buscando padrões conhecidos de tokens
 * (AWS, GitHub, chaves privadas PEM, atribuições de API keys), aplicando censura
 * e redação em todos os diagnósticos gerados para impedir vazamentos acidentais.
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
 * Realiza a varredura do conteúdo de arquivos em busca de segredos e credenciais.
 * Redige os valores detectados nos diagnósticos para garantir segurança perpétua.
 *
 * @param {string[]} filePaths - Lista de caminhos de arquivos a inspecionar.
 * @param {Object} [options={}] - Opções de configuração (ex: projectRoot).
 * @returns {{ violations: Array<{ file: string, rule: string, details: string, line: number }>, passed: boolean }}
 */
export function scanSecrets(filePaths, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const { publicConfig } = loadSafetyConfig(projectRoot);
  const { rules } = publicConfig;

  const violations = [];

  for (const rawFile of filePaths) {
    const relFile = path.isAbsolute(rawFile) ? path.relative(projectRoot, rawFile) : rawFile;
    const normalizedPath = normalizePath(relFile);
    const fullPath = path.isAbsolute(rawFile) ? rawFile : path.join(projectRoot, rawFile);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        continue;
      }
      // Pula arquivos gigantes (> 5MB) para não sobrecarregar a memória do scanner
      if (stats.size > 5 * 1024 * 1024) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      for (const secretDef of rules.secretsPatterns || []) {
        const regex = new RegExp(secretDef.regex, secretDef.flags || '');
        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i];
          if (regex.test(lineText)) {
            violations.push({
              file: normalizedPath,
              rule: 'SECRET_PATTERN_MATCH',
              details: `Padrão de segredo detectado (${secretDef.name}). O valor sensível foi redigido e mascarado.`,
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
          details: `Falha ao inspecionar arquivo para segredos: ${err.message}`,
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
if (process.argv[1] && process.argv[1].endsWith('scan-secrets.mjs')) {
  const files = process.argv.slice(2);
  const targetFiles = files.length > 0 ? files : ['.'];
  const res = scanSecrets(targetFiles);
  if (!res.passed) {
    logger.error('Scanner de Segredos encontrou violações:');
    res.violations.forEach((v) =>
      logger.error(`  - [${v.rule}] ${v.file}:${v.line} -> ${v.details}`)
    );
    process.exit(1);
  } else {
    logger.success('Scanner de Segredos: Todos os arquivos examinados foram aprovados.');
    process.exit(0);
  }
}
