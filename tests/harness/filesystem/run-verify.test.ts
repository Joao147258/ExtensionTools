/**
 * @file run-verify.test.ts
 * @description Suíte de testes unitários e de integração de subprocesso para scripts/filesystem/run-verify.mjs.
 * Valida a orquestração mestre dos verificadores de governança de File System:
 * - Execução determinística dos 4 Quality Gates
 * - Emissão de saída estruturada em JSON (--json)
 * - Exibição de manual (--help)
 * - Propagação precisa de códigos de saída (0 para sucesso, 1 para falha de regra)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { runAllFilesystemVerifications } from '../../../scripts/filesystem/run-verify.mjs';

describe('RUN-VERIFY — Orquestrador de Governança de File System', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-orchestrator-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignora falhas de cleanup temporário
    }
  });

  it('executa a bateria completa sobre o repositório atual aprovando com exit code 0', async () => {
    const res = await runAllFilesystemVerifications({ scope: 'all' });

    expect(res.status).toBe('PASS');
    expect(res.exitCode).toBe(0);
    expect(res.summary.totalGates).toBe(4);
    expect(res.summary.failed).toBe(0);
    expect(res.summary.passed + res.summary.pending).toBe(4);
  });

  describe('Execução via Subprocesso CLI', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts/filesystem/run-verify.mjs');

    it('exibe ajuda ao passar flag --help com exit code 0', () => {
      const run = spawnSync('node', [scriptPath, '--help'], {
        encoding: 'utf8',
      });

      expect(run.status).toBe(0);
      expect(run.stdout).toContain('Uso: node scripts/filesystem/run-verify.mjs');
      expect(run.stdout).toContain('--scope');
    });

    it('emite JSON estruturado válido ao passar flag --json', () => {
      const run = spawnSync('node', [scriptPath, '--json', '--scope', 'src'], {
        encoding: 'utf8',
      });

      expect(run.status).toBe(0);
      const parsed = JSON.parse(run.stdout);
      expect(parsed.status).toBe('PASS');
      expect(parsed.summary.totalGates).toBe(4);
      expect(Array.isArray(parsed.results)).toBe(true);
    });

    it('encerra com exit code 1 quando há violação em fixture no escopo', () => {
      // Cria fixture temporária contendo violação de boundaries
      const badDir = path.join(tmpDir, 'bad-src');
      fs.mkdirSync(path.join(badDir, 'src', 'features', 'bad'), { recursive: true });
      fs.writeFileSync(
        path.join(badDir, 'src', 'features', 'bad', 'BadComponent.tsx'),
        `import React from 'react'; export const X = () => { window.showDirectoryPicker(); };`
      );

      const run = spawnSync('node', [scriptPath, '--scope', badDir], {
        encoding: 'utf8',
      });

      expect(run.status).toBe(1);
      expect(run.stderr).toContain('[REPROVADO]');
    });
  });
});
