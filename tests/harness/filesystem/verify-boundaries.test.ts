/**
 * @file verify-boundaries.test.ts
 * @description Suíte de testes unitários e de integração para scripts/filesystem/verify-boundaries.mjs.
 * Valida a fiscalização de fronteiras arquiteturais:
 * - FS-ARC-01: Proibição de pickers em componentes React
 * - FS-ARC-02: Confinamento de APIs de FSA em platform/file-system
 * - FS-ARC-03: Proibição de manipulação de FS em platform/messaging
 * - FS-ARC-04: Proibição de React em contratos de File System
 * - FS-ARC-05: Proibição de pickers de Window no Background Service Worker
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  stripCommentsPreservingLayout,
  inspectFileBoundaries,
  verifyFilesystemBoundaries,
} from '../../../scripts/filesystem/verify-boundaries.mjs';

describe('FS-BOUNDARIES — Verificador de Fronteiras Arquiteturais de File System', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-boundary-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignora falhas de cleanup temporário
    }
  });

  describe('Função stripCommentsPreservingLayout', () => {
    it('deve remover comentários mantendo o layout e número de linhas exato', () => {
      const source = `// Linha de comentário 1
const x = 10; /* Comentário de bloco */
/* Bloco
   multilinha */
const y = 20;`;

      const stripped = stripCommentsPreservingLayout(source);
      expect(stripped.split('\n').length).toBe(source.split('\n').length);
      expect(stripped).not.toContain('Linha de comentário 1');
      expect(stripped).not.toContain('Comentário de bloco');
      expect(stripped).toContain('const x = 10;');
      expect(stripped).toContain('const y = 20;');
    });

    it('não deve remover padrões que estejam dentro de strings literais', () => {
      const source = `const msg = "showOpenFilePicker() inside string";`;
      const stripped = stripCommentsPreservingLayout(source);
      expect(stripped).toContain('showOpenFilePicker() inside string');
    });
  });

  describe('Regra FS-ARC-01: Componentes React não devem invocar pickers diretamente', () => {
    it('detecta componente React chamando showDirectoryPicker diretamente', () => {
      const code = `
import React from 'react';

export const MyComponent: React.FC = () => {
  const handleClick = async () => {
    const handle = await window.showDirectoryPicker();
  };
  return <button onClick={handleClick}>Open</button>;
};
`;
      const violations = inspectFileBoundaries('src/features/markdown/ui/Editor.tsx', code);
      expect(violations.some((v) => v.ruleId === 'FS-ARC-01')).toBe(true);
      expect(violations[0].message).toContain('showDirectoryPicker');
    });

    it('detecta arquivo .tsx chamando showOpenFilePicker sem prefixo window', () => {
      const code = `
export function FilePickerButton() {
  const open = () => {
    showOpenFilePicker();
  };
  return <div onClick={open}>Select</div>;
}
`;
      const violations = inspectFileBoundaries('src/features/quick-files/ui/Button.tsx', code);
      expect(violations.some((v) => v.ruleId === 'FS-ARC-01')).toBe(true);
    });

    it('aprova componente React que consome adaptador de plataforma', () => {
      const code = `
import React from 'react';
import { useFileSystem } from '@/platform/file-system';

export const CompliantComponent: React.FC = () => {
  const { selectDirectory } = useFileSystem();
  return <button onClick={selectDirectory}>Open Folder</button>;
};
`;
      const violations = inspectFileBoundaries('src/features/quick-files/ui/View.tsx', code);
      expect(violations.filter((v) => v.ruleId === 'FS-ARC-01').length).toBe(0);
    });
  });

  describe('Regra FS-ARC-02: APIs nativas de File System confinadas à camada de plataforma', () => {
    it('detecta feature chamando createWritable diretamente fora de platform/file-system', () => {
      const code = `
export async function saveDocument(handle: any, data: string) {
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}
`;
      const violations = inspectFileBoundaries('src/features/markdown/core/saver.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-ARC-02')).toBe(true);
      expect(violations[0].message).toContain('createWritable');
    });

    it('aprova chamada a createWritable dentro de src/platform/file-system/adapter.ts', () => {
      const code = `
export class ChromeFileSystemAdapter {
  async write(handle: FileSystemFileHandle, data: string) {
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }
}
`;
      const violations = inspectFileBoundaries('src/platform/file-system/adapter.ts', code);
      expect(violations.length).toBe(0);
    });
  });

  describe('Regra FS-ARC-03: Messaging não deve conter lógica de manipulação de File System', () => {
    it('detecta módulo de mensageria chamando createWritable', () => {
      const code = `
export function handleFileMessage(msg: any) {
  if (msg.type === 'WRITE') {
    msg.handle.createWritable();
  }
}
`;
      const violations = inspectFileBoundaries('src/platform/messaging/dispatcher.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-ARC-03')).toBe(true);
    });
  });

  describe('Regra FS-ARC-04: Contratos de File System não devem importar React', () => {
    it('detecta arquivo de contrato de File System importando React', () => {
      const code = `
import React from 'react';

export interface FileSystemViewProps {
  handle: FileSystemHandle;
}
`;
      const violations = inspectFileBoundaries('src/platform/file-system/contracts/types.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-ARC-04')).toBe(true);
    });

    it('aprova contrato puro com interfaces TypeScript', () => {
      const code = `
export interface IFileSystemAdapter {
  selectFile(): Promise<FileDescriptor>;
}
export interface FileDescriptor {
  id: string;
  name: string;
}
`;
      const violations = inspectFileBoundaries('src/platform/file-system/contracts/types.ts', code);
      expect(violations.length).toBe(0);
    });
  });

  describe('Regra FS-ARC-05: Background Service Worker não pode chamar pickers de Window', () => {
    it('detecta Background Service Worker tentando invocar showOpenFilePicker', () => {
      const code = `
chrome.runtime.onInstalled.addListener(() => {
  window.showOpenFilePicker();
});
`;
      const violations = inspectFileBoundaries('src/entrypoints/background/index.ts', code);
      expect(violations.some((v) => v.ruleId === 'FS-ARC-05')).toBe(true);
      expect(violations[0].severity).toBe('CRITICAL');
    });

    it('aprova Background Service Worker sem chamadas a pickers', () => {
      const code = `
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});
`;
      const violations = inspectFileBoundaries('src/entrypoints/background/index.ts', code);
      expect(violations.length).toBe(0);
    });
  });

  describe('Execução Completa via verifyFilesystemBoundaries', () => {
    it('retorna PASS quando o escopo é limpo e não contém violações', async () => {
      const fixtureDir = path.join(tmpDir, 'valid');
      fs.mkdirSync(path.join(fixtureDir, 'src', 'features', 'sample'), { recursive: true });
      fs.writeFileSync(
        path.join(fixtureDir, 'src', 'features', 'sample', 'sample.ts'),
        'export const value = 42;'
      );

      const res = await verifyFilesystemBoundaries({
        projectRoot: fixtureDir,
        scope: 'all',
      });

      expect(res.status).toBe('PASS');
      expect(res.exitCode).toBe(0);
      expect(res.violations.length).toBe(0);
    });

    it('retorna FAIL com violações quando arquivos com violação existem no escopo', async () => {
      const fixtureDir = path.join(tmpDir, 'invalid');
      fs.mkdirSync(path.join(fixtureDir, 'src', 'entrypoints', 'background'), { recursive: true });
      fs.writeFileSync(
        path.join(fixtureDir, 'src', 'entrypoints', 'background', 'index.ts'),
        'showDirectoryPicker();'
      );

      const res = await verifyFilesystemBoundaries({
        projectRoot: fixtureDir,
        scope: 'all',
      });

      expect(res.status).toBe('FAIL');
      expect(res.exitCode).toBe(1);
      expect(res.violations.length).toBeGreaterThan(0);
    });
  });
});
