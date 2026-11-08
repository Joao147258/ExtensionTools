/**
 * @file verify-security.test.ts
 * @description Suíte de testes unitários e de integração para scripts/filesystem/verify-security.mjs.
 * Valida os detectores de vulnerabilidades e padrões de risco:
 * - FS-SEC-01: Exclusão recursiva sem confirmação
 * - FS-SEC-03: Negação de permissão não tratada
 * - FS-SEC-05: Disparo de picker em timers sem User Activation
 * - FS-SEC-06: Vazamento de conteúdo de arquivo em console
 * - FS-SEC-07: Permissões indevidas no manifesto (fileSystem legada / nativeMessaging sem ADR)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  inspectFileSecurity,
  inspectManifestSecurity,
  verifyFilesystemSecurity,
} from '../../../scripts/filesystem/verify-security.mjs';

describe('FS-SECURITY — Verificador de Segurança e Salvaguardas de File System', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-security-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignora falhas de cleanup temporário
    }
  });

  describe('Regra FS-SEC-01: Exclusão recursiva sem confirmação do usuário', () => {
    it('detecta removeEntry com { recursive: true } sem guard de confirmação', () => {
      const code = `
export async function deleteFolder(dirHandle: any, folderName: string) {
  await dirHandle.removeEntry(folderName, { recursive: true });
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/adapter.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-SEC-01')).toBe(true);
      expect(violations[0].severity).toBe('CRITICAL');
    });

    it('aprova removeEntry com { recursive: true } envolvido em guard de confirmação', () => {
      const code = `
export async function deleteFolderWithGuard(dirHandle: any, folderName: string, isConfirmed: boolean) {
  if (isConfirmed) {
    await dirHandle.removeEntry(folderName, { recursive: true });
  }
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/adapter.ts', code);
      expect(violations.filter((v) => v.ruleId === 'FS-SEC-01').length).toBe(0);
    });

    it('aprova removeEntry de arquivo unitário sem flag recursive', () => {
      const code = `
export async function deleteSingleFile(dirHandle: any, fileName: string) {
  await dirHandle.removeEntry(fileName);
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/adapter.ts', code);
      expect(violations.filter((v) => v.ruleId === 'FS-SEC-01').length).toBe(0);
    });
  });

  describe('Regra FS-SEC-03: Tratamento de negação de permissão', () => {
    it('detecta requestPermission sem checar denied ou capturar NotAllowedError', () => {
      const code = `
export async function acquireAccess(handle: FileSystemHandle) {
  const status = await handle.requestPermission({ mode: 'readwrite' });
  return status;
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/adapter.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-SEC-03')).toBe(true);
    });

    it('aprova requestPermission que trata explicitamente status === "denied"', () => {
      const code = `
export async function acquireAccessSafe(handle: FileSystemHandle) {
  const status = await handle.requestPermission({ mode: 'readwrite' });
  if (status === 'denied') {
    throw new Error('Permissão negada pelo usuário');
  }
  return status;
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/adapter.ts', code);
      expect(violations.filter((v) => v.ruleId === 'FS-SEC-03').length).toBe(0);
    });
  });

  describe('Regra FS-SEC-05: Invocação de pickers sem User Activation (Timers)', () => {
    it('detecta showOpenFilePicker chamado dentro de setTimeout', () => {
      const code = `
export function scheduleFilePicker() {
  setTimeout(async () => {
    await window.showOpenFilePicker();
  }, 2000);
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/timers.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-SEC-05')).toBe(true);
    });

    it('aprova showOpenFilePicker invocado diretamente em função exportada', () => {
      const code = `
export async function openFileAction() {
  return await window.showOpenFilePicker();
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/actions.ts', code);
      expect(violations.filter((v) => v.ruleId === 'FS-SEC-05').length).toBe(0);
    });
  });

  describe('Regra FS-SEC-06: Vazamento de conteúdo de arquivo em console', () => {
    it('detecta console.log com fileContent', () => {
      const code = `
export function printData(fileContent: string) {
  console.log('Dados do arquivo:', fileContent);
}
`;
      const violations = inspectFileSecurity('src/platform/file-system/debug.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-SEC-06')).toBe(true);
    });
  });

  describe('Regra FS-SEC-07: Permissões indevidas no manifesto', () => {
    it('detecta permissão legada "fileSystem" no wxt.config.ts', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'wxt.config.ts'),
        `export default defineConfig({ manifest: { permissions: ['storage', 'fileSystem'] } });`
      );

      const violations = inspectManifestSecurity(tmpDir);
      expect(violations.some((v) => v.ruleId === 'FS-SEC-07')).toBe(true);
      expect(violations[0].message).toContain('obsoleta "fileSystem"');
    });

    it('detecta permissão "nativeMessaging" sem ADR aprovado', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'wxt.config.ts'),
        `export default defineConfig({ manifest: { permissions: ['storage', 'nativeMessaging'] } });`
      );

      const violations = inspectManifestSecurity(tmpDir);
      expect(violations.some((v) => v.ruleId === 'FS-SEC-07')).toBe(true);
      expect(violations[0].message).toContain('nativeMessaging');
    });

    it('aprova manifesto limpo sem permissões perigosas', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'wxt.config.ts'),
        `export default defineConfig({ manifest: { permissions: ['storage', 'sidePanel'] } });`
      );

      const violations = inspectManifestSecurity(tmpDir);
      expect(violations.length).toBe(0);
    });
  });

  describe('Execução Completa via verifyFilesystemSecurity', () => {
    it('aprova projeto sem violações de segurança e emite nota de validação semântica', async () => {
      fs.writeFileSync(
        path.join(tmpDir, 'wxt.config.ts'),
        `export default defineConfig({ manifest: { permissions: ['storage'] } });`
      );
      fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'src', 'safe.ts'), 'export const active = true;');

      const res = await verifyFilesystemSecurity({
        projectRoot: tmpDir,
        scope: 'all',
      });

      expect(res.status).toBe('PASS');
      expect(res.exitCode).toBe(0);
      expect(res.violations.length).toBe(0);
      expect(res.semanticRulesNotice).toContain('testes comportamentais dinâmicos');
    });
  });
});
