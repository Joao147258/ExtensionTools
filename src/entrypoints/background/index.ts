import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { createBackgroundRouter, registerBackgroundMessaging } from '../../platform/messaging';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/entrypoints/background/index.ts
 * Responsabilidade: Service Worker para gerenciar eventos de ciclo de vida,
 *                   abertura automática do Side Panel ao clicar no ícone
 *                   e Composition Root da infraestrutura de Platform Messaging.
 * ==============================================================================
 */

export default defineBackground(() => {
  // 1. Configuração do Side Panel (preserva comportamento do Bloco 1)
  const sidePanelApi = browser?.sidePanel;

  if (sidePanelApi?.setPanelBehavior) {
    sidePanelApi
      .setPanelBehavior({
        openPanelOnActionClick: true,
      })
      .catch((err: unknown) => {
        console.error('Falha ao configurar comportamento do Side Panel:', err);
      });
  } else {
    console.error('[ExtensionTools] Side Panel API indisponível.');
  }

  // 2. Composition Root de Platform Messaging (B3-F09)
  const extensionId = browser?.runtime?.id || 'extensiontools';

  const router = createBackgroundRouter(extensionId, {
    ping: async ({ probe }) => ({
      alive: true,
      echo: probe,
    }),
  });

  if (browser?.runtime?.onMessage) {
    registerBackgroundMessaging(router);
  }
});
