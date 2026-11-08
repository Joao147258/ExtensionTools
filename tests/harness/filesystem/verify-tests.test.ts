/**
 * @file verify-tests.test.ts
 * @description Suíte de testes unitários e de integração para scripts/filesystem/verify-tests.mjs.
 * Valida a auditoria da matriz de 13 cenários canônicos de teste da File System Access API:
 * - Fase de Preparação: reporta PASS_PENDING_IMPLEMENTATION (exit code 0) sem falsear coberturas
 * - Cenário Positivo: aprova quando todos os 13 cenários estão presentes nos testes
 * - Cenário Negativo: reprova e aponta os cenários faltantes quando há lacunas na suíte
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  MANDATORY_TEST_SCENARIOS,
  auditTestCoverage,
  verifyFilesystemTests,
} from '../../../scripts/filesystem/verify-tests.mjs';

describe('FS-TESTS — Verificador de Cenários de Teste de File System', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-tests-suite-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignora falhas de cleanup temporário
    }
  });

  it('possui a definição canônica de exatamente 13 cenários obrigatórios', () => {
    expect(MANDATORY_TEST_SCENARIOS.length).toBe(13);
    const ids = MANDATORY_TEST_SCENARIOS.map((s) => s.id);
    expect(ids).toContain('TC-FS-01');
    expect(ids).toContain('TC-FS-02');
    expect(ids).toContain('TC-FS-03');
    expect(ids).toContain('TC-FS-13');
  });

  describe('Tratamento da Fase de Preparação (Pending Implementation)', () => {
    it('aprova com status PASS_PENDING_IMPLEMENTATION quando não existem arquivos de teste ainda', async () => {
      const nonExistentDir = path.join(tmpDir, 'tests', 'unit', 'platform', 'file-system');

      const res = await verifyFilesystemTests({
        projectRoot: tmpDir,
        testsDir: nonExistentDir,
      });

      expect(res.status).toBe('PASS_PENDING_IMPLEMENTATION');
      expect(res.exitCode).toBe(0);
      expect(res.isPending).toBe(true);
      expect(res.totalFiles).toBe(0);
    });
  });

  describe('Auditoria de Cobertura quando Testes Existem', () => {
    it('reprova e lista cenários faltantes quando a suíte cobre apenas parte dos requisitos', () => {
      const testDir = path.join(tmpDir, 'tests', 'file-system');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(
        path.join(testDir, 'partial.test.ts'),
        `
describe('Partial FS Test', () => {
  it('realiza selecao autorizada de arquivo', () => {});
  it('trata cancelamento pelo usuario com AbortError', () => {});
  it('trata permissao negada com NotAllowedError', () => {});
});
`
      );

      const audit = auditTestCoverage(testDir, tmpDir);
      expect(audit.isPending).toBe(false);
      expect(audit.coveredScenarios).toContain('TC-FS-01');
      expect(audit.coveredScenarios).toContain('TC-FS-02');
      expect(audit.coveredScenarios).toContain('TC-FS-03');
      expect(audit.missingScenarios.length).toBe(10);
      expect(audit.missingScenarios).toContain('TC-FS-04');
      expect(audit.missingScenarios).toContain('TC-FS-12');
    });

    it('aprova com louvor quando todos os 13 cenários canônicos estão implementados', async () => {
      const testDir = path.join(tmpDir, 'tests', 'file-system');
      fs.mkdirSync(testDir, { recursive: true });

      const completeTestContent = `
describe('Complete File System Test Suite', () => {
  it('TC-FS-01: selecao autorizada de arquivo com sucesso', () => {});
  it('TC-FS-02: selecao cancelada com AbortError', () => {});
  it('TC-FS-03: permissao negada com NotAllowedError', () => {});
  it('TC-FS-04: detecta permissao revogada', () => {});
  it('TC-FS-05: arquivo inexistente com NotFoundError', () => {});
  it('TC-FS-06: trata arquivo alterado externamente', () => {});
  it('TC-FS-07: trata falha na leitura do arquivo', () => {});
  it('TC-FS-08: trata falha na escrita do stream', () => {});
  it('TC-FS-09: limpa arquivo temporario crswap em escrita interrompida', () => {});
  it('TC-FS-10: solicita confirmacao contra sobrescrita indevida', () => {});
  it('TC-FS-11: rejeita exclusao nao autorizada de arquivo', () => {});
  it('TC-FS-12: bloqueia remocao recursiva sem confirmacao do usuario', () => {});
  it('TC-FS-13: oferece fallback limpo para ambiente nao suportado', () => {});
});
`;
      fs.writeFileSync(path.join(testDir, 'filesystem.test.ts'), completeTestContent);

      const res = await verifyFilesystemTests({
        projectRoot: tmpDir,
        testsDir: testDir,
      });

      expect(res.status).toBe('PASS');
      expect(res.exitCode).toBe(0);
      expect(res.covered.length).toBe(13);
      expect(res.missing.length).toBe(0);
      expect(res.isPending).toBe(false);
    });
  });
});
