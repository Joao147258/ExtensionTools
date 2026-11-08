/**
 * @file verify-contracts.test.ts
 * @description Suíte de testes unitários e de integração para scripts/filesystem/verify-contracts.mjs.
 * Valida a governança de contratos e tipagem de File System:
 * - Fase de Preparação: Reconhece .gitkeep sem código e reporta PASS_PENDING_IMPLEMENTATION (exit code 0)
 * - FS-CON-01: Exigência de contratos tipados acompanhando adaptadores
 * - FS-CON-02: Proibição de React em contratos de File System
 * - FS-CON-03: Proibição de imports de entrypoints em contratos
 * - FS-CON-04: Exigência de erros de domínio tipados
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  inspectFilesystemContracts,
  verifyFilesystemContracts,
} from '../../../scripts/filesystem/verify-contracts.mjs';

describe('FS-CONTRACTS — Verificador de Contratos e Tipagem de File System', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-contracts-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignora falhas de cleanup temporário
    }
  });

  describe('Tratamento da Fase de Preparação (Pending Implementation)', () => {
    it('aprova com status PASS_PENDING_IMPLEMENTATION quando diretório só contém .gitkeep', async () => {
      const fsDir = path.join(tmpDir, 'src', 'platform', 'file-system');
      fs.mkdirSync(fsDir, { recursive: true });
      fs.writeFileSync(path.join(fsDir, '.gitkeep'), '');

      const res = await verifyFilesystemContracts({
        projectRoot: tmpDir,
        targetDir: fsDir,
      });

      expect(res.status).toBe('PASS_PENDING_IMPLEMENTATION');
      expect(res.exitCode).toBe(0);
      expect(res.isPending).toBe(true);
      expect(res.violations.length).toBe(0);
    });

    it('aprova quando diretório de destino ainda não existe fisicamente', async () => {
      const nonExistentDir = path.join(tmpDir, 'src', 'platform', 'uncreated');

      const res = await verifyFilesystemContracts({
        projectRoot: tmpDir,
        targetDir: nonExistentDir,
      });

      expect(res.status).toBe('PASS_PENDING_IMPLEMENTATION');
      expect(res.exitCode).toBe(0);
      expect(res.isPending).toBe(true);
    });
  });

  describe('Auditoria de Contratos quando Implementação Existe', () => {
    it('detecta adaptador implementado sem arquivo de tipos/contratos (FS-CON-01)', () => {
      const fsDir = path.join(tmpDir, 'src', 'platform', 'file-system');
      fs.mkdirSync(fsDir, { recursive: true });
      fs.writeFileSync(
        path.join(fsDir, 'FileSystemAdapter.ts'),
        'export class FileSystemAdapter {}'
      );

      const inspection = inspectFilesystemContracts(fsDir, tmpDir);
      expect(inspection.isPending).toBe(false);
      expect(inspection.violations.some((v) => v.ruleId === 'FS-CON-01')).toBe(true);
    });

    it('detecta contrato importando dependência visual React (FS-CON-02)', () => {
      const fsDir = path.join(tmpDir, 'src', 'platform', 'file-system');
      fs.mkdirSync(fsDir, { recursive: true });
      fs.writeFileSync(
        path.join(fsDir, 'types.ts'),
        `import React from 'react';\nexport interface FileProps { node: React.ReactNode; }\nexport class FileNotFoundError extends Error {}`
      );

      const inspection = inspectFilesystemContracts(fsDir, tmpDir);
      expect(inspection.violations.some((v) => v.ruleId === 'FS-CON-02')).toBe(true);
    });

    it('detecta contrato importando módulo de entrypoints (FS-CON-03)', () => {
      const fsDir = path.join(tmpDir, 'src', 'platform', 'file-system');
      fs.mkdirSync(fsDir, { recursive: true });
      fs.writeFileSync(
        path.join(fsDir, 'types.ts'),
        `import { config } from '@/entrypoints/sidepanel';\nexport interface FileDesc { id: string; }\nexport class FileNotFoundError extends Error {}`
      );

      const inspection = inspectFilesystemContracts(fsDir, tmpDir);
      expect(inspection.violations.some((v) => v.ruleId === 'FS-CON-03')).toBe(true);
      expect(inspection.violations[0].severity).toBe('CRITICAL');
    });

    it('detecta contrato sem representação de erros de domínio (FS-CON-04)', () => {
      const fsDir = path.join(tmpDir, 'src', 'platform', 'file-system');
      fs.mkdirSync(fsDir, { recursive: true });
      fs.writeFileSync(
        path.join(fsDir, 'types.ts'),
        `export interface FileDescriptor { id: string; name: string; }`
      );

      const inspection = inspectFilesystemContracts(fsDir, tmpDir);
      expect(inspection.violations.some((v) => v.ruleId === 'FS-CON-04')).toBe(true);
    });

    it('aprova conjunto íntegro contendo contratos tipados, erros de domínio e adaptador', () => {
      const fsDir = path.join(tmpDir, 'src', 'platform', 'file-system');
      fs.mkdirSync(fsDir, { recursive: true });
      fs.writeFileSync(
        path.join(fsDir, 'types.ts'),
        `
export interface IFileSystemAdapter {
  readFile(id: string): Promise<string>;
}
export interface FileDescriptor {
  id: string;
  name: string;
}
export class FileNotFoundError extends Error {
  readonly code = 'FILE_NOT_FOUND';
}
export class FilePermissionDeniedError extends Error {
  readonly code = 'PERMISSION_DENIED';
}
`
      );
      fs.writeFileSync(
        path.join(fsDir, 'FileSystemAdapter.ts'),
        `import { IFileSystemAdapter } from './types';\nexport class FileSystemAdapter implements IFileSystemAdapter { async readFile(id: string) { return ''; } }`
      );

      const inspection = inspectFilesystemContracts(fsDir, tmpDir);
      expect(inspection.violations.length).toBe(0);
    });
  });
});
