/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/integration/browser-panel.test.ts
 * Responsabilidade: Testes de integração do Browser Panel e Manifest V3 (B1-I02).
 *
 * Valida a conformidade da integração entre o navegador Chromium, o manifesto
 * gerado pelo WXT e o ciclo de vida do Service Worker em background.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import backgroundEntrypoint from '../../src/entrypoints/background/index';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    sidePanel: {
      setPanelBehavior: vi.fn(),
    },
  },
}));

describe('B1-I02 — Browser Panel Integration & Manifest V3', () => {
  describe('Manifesto Gerado (.output/chrome-mv3/manifest.json)', () => {
    const manifestPath = path.resolve(process.cwd(), '.output/chrome-mv3/manifest.json');

    it('deve existir o arquivo manifest.json gerado pelo build', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    it('deve declarar manifest_version 3 e versão mínima do Chromium 114', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.minimum_chrome_version).toBe('114');
    });

    it('deve declarar permissão obrigatória "sidePanel"', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(Array.isArray(manifest.permissions)).toBe(true);
      expect(manifest.permissions).toContain('sidePanel');
    });

    it('deve registrar o Side Panel nativo apontando para sidepanel.html', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.side_panel).toBeDefined();
      expect(manifest.side_panel.default_path).toBe('sidepanel.html');
    });

    it('deve declarar a Action API com default_title para apresentação e clique no ícone', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.action).toBeDefined();
      expect(manifest.action.default_title).toBe('Abrir ExtensionTools');
    });

    it('deve registrar o background service worker como background.js', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.background).toBeDefined();
      expect(manifest.background.service_worker).toBe('background.js');
    });
  });

  describe('Background Service Worker (B1-I02)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('deve exportar a definição de background do WXT', () => {
      expect(backgroundEntrypoint).toBeDefined();
      expect(typeof backgroundEntrypoint).toBe('object');
      expect(typeof backgroundEntrypoint.main).toBe('function');
    });

    it('deve invocar setPanelBehavior com openPanelOnActionClick: true quando a API estiver presente', () => {
      const mockSetPanelBehavior = vi.fn().mockReturnValue(Promise.resolve());
      (
        browser.sidePanel as unknown as { setPanelBehavior: typeof mockSetPanelBehavior }
      ).setPanelBehavior = mockSetPanelBehavior;

      backgroundEntrypoint.main();

      expect(mockSetPanelBehavior).toHaveBeenCalledWith({
        openPanelOnActionClick: true,
      });
    });

    it('deve registrar aviso no console caso sidePanelApi esteja indisponível sem lançar exceção', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalSidePanel = browser.sidePanel;
      (browser as unknown as { sidePanel: unknown }).sidePanel = undefined;

      try {
        expect(() => backgroundEntrypoint.main()).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ExtensionTools] Side Panel API indisponível.'
        );
      } finally {
        (browser as unknown as { sidePanel: unknown }).sidePanel = originalSidePanel;
        consoleErrorSpy.mockRestore();
      }
    });

    it('deve capturar falhas em setPanelBehavior sem derrubar o service worker (resiliência)', async () => {
      const mockError = new Error('Falha simulada na API Chromium');
      const mockSetPanelBehavior = vi.fn().mockReturnValue(Promise.reject(mockError));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (
        browser.sidePanel as unknown as { setPanelBehavior: typeof mockSetPanelBehavior }
      ).setPanelBehavior = mockSetPanelBehavior;

      backgroundEntrypoint.main();

      // Aguarda a resolução da Promise / catch
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Falha ao configurar comportamento do Side Panel:',
        mockError
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
