import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/entrypoints/background/index.ts
 * Responsabilidade: Service Worker para gerenciar eventos de ciclo de vida e
 *                   abertura automática do Side Panel ao clicar no ícone.
 * ==============================================================================
 */

export default defineBackground(() => {
  const sidePanelApi = browser?.sidePanel;

  if (!sidePanelApi?.setPanelBehavior) {
    console.error('[ExtensionTools] Side Panel API indisponível.');
    return;
  }

  sidePanelApi
    .setPanelBehavior({
      openPanelOnActionClick: true,
    })
    .catch((err: unknown) => {
      console.error('Falha ao configurar comportamento do Side Panel:', err);
    });
});
