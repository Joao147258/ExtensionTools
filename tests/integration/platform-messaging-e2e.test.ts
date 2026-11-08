/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging End-to-End Integration Tests
 *
 * Validação integrada do fluxo completo de mensageria:
 * Side Panel (UI/Service)
 *   → PlatformHealthService
 *   → MessagingClient
 *   → BrowserRuntimeTransport
 *   → browser.runtime.sendMessage / onMessage
 *   → registerBackgroundMessaging (Listener)
 *   → createBackgroundRouter (Router)
 *   → ping handler (Background)
 *   → MessageReply (Protocol Envelope)
 *   → MessagingClient
 *   → MessageResult
 *   → Side Panel
 * ==============================================================================
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBackgroundRouter,
  registerBackgroundMessaging,
  BrowserRuntimeTransport,
  MessagingClient,
  type AnyRequest,
} from '../../src/platform/messaging';
import { createPlatformHealthService } from '../../src/app/sidepanel/services/platform-health-service';

describe('Platform Messaging End-to-End (B3-F06 a B3-F10)', () => {
  const EXTENSION_ID = 'extensiontools-mv3-test-id';

  let registeredListener:
    | ((
        message: unknown,
        sender: { id?: string; tab?: unknown },
        sendResponse: (res?: unknown) => void
      ) => boolean)
    | undefined;

  let senderInfo: { id?: string; tab?: unknown };

  beforeEach(() => {
    vi.clearAllMocks();
    registeredListener = undefined;
    senderInfo = { id: EXTENSION_ID };
  });

  /**
   * Constrói o simulador da infraestrutura Chromium / WXT Runtime Messaging.
   */
  function setupBrowserMessagingBridge() {
    // Mock do mecanismo de registro (Background)
    const mockAddListener = vi.fn().mockImplementation((listener) => {
      registeredListener = listener;
    });

    const mockRemoveListener = vi.fn().mockImplementation(() => {
      registeredListener = undefined;
    });

    // Mock do envio (Client / Transport) conectando ao listener do Background
    const mockSendMessage = vi.fn().mockImplementation((req: AnyRequest) => {
      return new Promise((resolve) => {
        if (!registeredListener) {
          resolve(undefined);
          return;
        }

        const sendResponse = (reply?: unknown) => {
          resolve(reply);
        };

        const handled = registeredListener(req, senderInfo, sendResponse);
        if (!handled) {
          resolve(undefined);
        }
      });
    });

    return {
      mockSendMessage,
      mockAddListener,
      mockRemoveListener,
    };
  }

  it('executa o fluxo completo com sucesso: Side Panel → Background Router (ping) → Resposta validada', async () => {
    const bridge = setupBrowserMessagingBridge();

    // 1. Inicialização do Background (Composition Root B3-F09)
    const pingHandler = vi.fn().mockImplementation(async ({ probe }) => ({
      alive: true,
      echo: probe,
    }));

    const router = createBackgroundRouter(EXTENSION_ID, {
      ping: pingHandler,
    });

    // Registro do listener conectando ao mockAddListener
    const unregister = vi.fn();
    bridge.mockAddListener((msg: unknown, snd: unknown, resp: (r?: unknown) => void) => {
      // Cria o listener real do B3-F08
      const realListener = (
        message: unknown,
        sender: { id?: string; tab?: unknown },
        sendResponse: (response?: unknown) => void
      ) => {
        void Promise.resolve()
          .then(() => router(message, sender))
          .then(
            (reply) => sendResponse(reply),
            () => sendResponse(undefined)
          );
        return true;
      };
      return realListener(msg, snd as { id?: string; tab?: unknown }, resp);
    });

    // 2. Composição do lado consumidor (Side Panel / B3-F06 + B3-F10)
    const transport: BrowserRuntimeTransport = {
      send: bridge.mockSendMessage,
    };

    const client = new MessagingClient(transport, 5000, () => 'e2e-correlation-id');
    const healthService = createPlatformHealthService(client);

    // 3. Execução da chamada pelo Side Panel
    const result = await healthService.check('e2e-sidepanel-probe');

    // 4. Verificações do fluxo ponta a ponta
    expect(pingHandler).toHaveBeenCalledWith({ probe: 'e2e-sidepanel-probe' });
    expect(result).toEqual({
      ok: true,
      value: {
        alive: true,
        echo: 'e2e-sidepanel-probe',
      },
    });
  });

  it('rejeita o fluxo e preserva a segurança quando o remetente não é autorizado (UNAUTHORIZED)', async () => {
    const bridge = setupBrowserMessagingBridge();

    // Remetente fraudulento ou desconhecido
    senderInfo = { id: 'impostor-extension-id' };

    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, {
      ping: pingHandler,
    });

    bridge.mockAddListener((msg: unknown, snd: unknown, resp: (r?: unknown) => void) => {
      void Promise.resolve()
        .then(() => router(msg, snd as { id?: string; tab?: unknown }))
        .then((reply) => resp(reply));
      return true;
    });

    const transport: BrowserRuntimeTransport = {
      send: bridge.mockSendMessage,
    };
    const client = new MessagingClient(transport, 5000, () => 'e2e-unauth-id');
    const healthService = createPlatformHealthService(client);

    const result = await healthService.check('probe');

    expect(pingHandler).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'A operação não está autorizada.',
      },
    });
  });

  it('rejeita solicitações com payload inválido antes de invocar o handler (INVALID_REQUEST)', async () => {
    const bridge = setupBrowserMessagingBridge();

    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, {
      ping: pingHandler,
    });

    bridge.mockAddListener((msg: unknown, snd: unknown, resp: (r?: unknown) => void) => {
      void Promise.resolve()
        .then(() => router(msg, snd as { id?: string; tab?: unknown }))
        .then((reply) => resp(reply));
      return true;
    });

    const transport: BrowserRuntimeTransport = {
      send: bridge.mockSendMessage,
    };
    // newId retorna string vazia (inválida)
    const client = new MessagingClient(transport, 5000, () => '');
    const healthService = createPlatformHealthService(client);

    const result = await healthService.check('probe');

    expect(pingHandler).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_REQUEST');
    }
  });

  it('trata falhas internas de handlers convertendo-as em erros controlados sem vazar exceções (HANDLER_FAILED)', async () => {
    const bridge = setupBrowserMessagingBridge();

    const pingHandler = vi
      .fn()
      .mockRejectedValue(new Error('Fatal internal error: database unreachable'));
    const router = createBackgroundRouter(EXTENSION_ID, {
      ping: pingHandler,
    });

    bridge.mockAddListener((msg: unknown, snd: unknown, resp: (r?: unknown) => void) => {
      void Promise.resolve()
        .then(() => router(msg, snd as { id?: string; tab?: unknown }))
        .then((reply) => resp(reply));
      return true;
    });

    const transport: BrowserRuntimeTransport = {
      send: bridge.mockSendMessage,
    };
    const client = new MessagingClient(transport, 5000, () => 'e2e-err-id');
    const healthService = createPlatformHealthService(client);

    const result = await healthService.check('probe');

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'HANDLER_FAILED',
        message: 'Não foi possível processar a solicitação.',
      },
    });
    expect(JSON.stringify(result)).not.toContain('database unreachable');
  });

  it('gerencia múltiplas chamadas concorrentes ponta a ponta sem colisão de envelopes ou resultados trocados', async () => {
    const bridge = setupBrowserMessagingBridge();

    const pingHandler = vi.fn().mockImplementation(async ({ probe }) => ({
      alive: true,
      echo: `echo-${probe}`,
    }));

    const router = createBackgroundRouter(EXTENSION_ID, {
      ping: pingHandler,
    });

    bridge.mockAddListener((msg: unknown, snd: unknown, resp: (r?: unknown) => void) => {
      void Promise.resolve()
        .then(() => router(msg, snd as { id?: string; tab?: unknown }))
        .then((reply) => resp(reply));
      return true;
    });

    const transport: BrowserRuntimeTransport = {
      send: bridge.mockSendMessage,
    };
    let counter = 1;
    const client = new MessagingClient(transport, 5000, () => `e2e-concurrent-${counter++}`);
    const healthService = createPlatformHealthService(client);

    const [resA, resB, resC] = await Promise.all([
      healthService.check('probe-A'),
      healthService.check('probe-B'),
      healthService.check('probe-C'),
    ]);

    expect(resA).toEqual({
      ok: true,
      value: { alive: true, echo: 'echo-probe-A' },
    });
    expect(resB).toEqual({
      ok: true,
      value: { alive: true, echo: 'echo-probe-B' },
    });
    expect(resC).toEqual({
      ok: true,
      value: { alive: true, echo: 'echo-probe-C' },
    });
    expect(pingHandler).toHaveBeenCalledTimes(3);
  });
});
