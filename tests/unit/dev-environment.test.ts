/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/unit/dev-environment.test.ts
 * Responsabilidade: Testes unitários para saneamento do ambiente de desenvolvimento
 *                   e resiliência contra vazamento de variáveis Snap/GTK.
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import {
  cleanupStaleLock,
  sanitizeEnvironment,
  setupProcessGuards,
  SNAP_ENV_VARS,
} from '../../wxt.config';

describe('Ambiente de Desenvolvimento — Saneamento de Variáveis Snap/GTK', () => {
  it('deve listar todas as variáveis de ambiente propensas a conflito de schemas GLib/GTK', () => {
    expect(SNAP_ENV_VARS).toContain('GSETTINGS_SCHEMA_DIR');
    expect(SNAP_ENV_VARS).toContain('GIO_MODULE_DIR');
    expect(SNAP_ENV_VARS).toContain('GTK_PATH');
    expect(SNAP_ENV_VARS).toContain('GTK_EXE_PREFIX');
    expect(SNAP_ENV_VARS).toContain('GTK_IM_MODULE_FILE');
    expect(SNAP_ENV_VARS).toContain('LOCPATH');
  });

  it('deve remover variáveis poluídas pelo VS Code Snap quando o valor original for vazio', () => {
    const mockEnv: NodeJS.ProcessEnv = {
      GSETTINGS_SCHEMA_DIR: '/var/mock-env/snap/code/274/.local/share/glib-2.0/schemas',
      GSETTINGS_SCHEMA_DIR_VSCODE_SNAP_ORIG: '',
      GTK_PATH: '/snap/code/274/usr/lib/x86_64-linux-gnu/gtk-3.0',
      GTK_PATH_VSCODE_SNAP_ORIG: '',
      OTHER_VAR: 'preserved',
    };

    sanitizeEnvironment(mockEnv);

    expect(mockEnv.GSETTINGS_SCHEMA_DIR).toBeUndefined();
    expect(mockEnv.GTK_PATH).toBeUndefined();
    expect(mockEnv.OTHER_VAR).toBe('preserved');
  });

  it('deve restaurar valores originais caso o usuário possua configurações prévias legítimas', () => {
    const mockEnv: NodeJS.ProcessEnv = {
      GSETTINGS_SCHEMA_DIR: '/var/mock-env/snap/code/274/.local/share/glib-2.0/schemas',
      GSETTINGS_SCHEMA_DIR_VSCODE_SNAP_ORIG: '/usr/share/glib-2.0/schemas',
      XDG_DATA_DIRS: '/var/mock-env/snap/code/274/.local/share:/snap/code/274/usr/share',
      XDG_DATA_DIRS_VSCODE_SNAP_ORIG: '/usr/local/share:/usr/share',
    };

    sanitizeEnvironment(mockEnv);

    expect(mockEnv.GSETTINGS_SCHEMA_DIR).toBe('/usr/share/glib-2.0/schemas');
    expect(mockEnv.XDG_DATA_DIRS).toBe('/usr/local/share:/usr/share');
  });

  it('deve purgar caminhos que apontem para /snap/code/ mesmo se as variáveis originais não estiverem definidas', () => {
    const mockEnv: NodeJS.ProcessEnv = {
      GSETTINGS_SCHEMA_DIR: '/var/mock-env/snap/code/common/.local/share/glib-2.0/schemas',
      GIO_MODULE_DIR: '/var/mock-env/snap/code/common/.cache/gio-modules',
      CUSTOM_SAFE_DIR: '/var/mock-env/safe/dir',
    };

    sanitizeEnvironment(mockEnv);

    expect(mockEnv.GSETTINGS_SCHEMA_DIR).toBeUndefined();
    expect(mockEnv.GIO_MODULE_DIR).toBeUndefined();
    expect(mockEnv.CUSTOM_SAFE_DIR).toBe('/var/mock-env/safe/dir');
  });

  it('deve executar cleanupStaleLock sem lançar exceções mesmo na ausência do diretório ou lock', () => {
    expect(() => cleanupStaleLock()).not.toThrow();
  });

  it('deve registrar guardas de processo sem falhas', () => {
    expect(() => setupProcessGuards()).not.toThrow();
  });
});
