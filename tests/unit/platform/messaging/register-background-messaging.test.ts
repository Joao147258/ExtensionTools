import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGE_PROTOCOL, MESSAGE_VERSION } from '../../../../src/platform/messaging/contracts';
import { registerBackgroundMessaging } from '../../../../src/platform/messaging/register-background-messaging';

const mocks = vi.hoisted(() => ({
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      onMessage: {
        addListener: mocks.addListener,
        removeListener: mocks.removeListener,
      },
    },
  },
}));

describe('B3-F08 — Background Messaging Listener Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valida que route deve ser uma função ao registrar', () => {
    // @ts-expect-error teste de runtime
    expect(() => registerBackgroundMessaging(null)).toThrow(TypeError);
    // @ts-expect-error teste de runtime
    expect(() => registerBackgroundMessaging('not-a-fn')).toThrow(TypeError);
  });

  it('registra o listener em browser.runtime.onMessage e permite desregistro limpo', () => {
    const dummyRoute = vi.fn();
    const unregister = registerBackgroundMessaging(dummyRoute);

    expect(mocks.addListener).toHaveBeenCalledTimes(1);
    const registeredListener = mocks.addListener.mock.calls[0][0];
    expect(typeof registeredListener).toBe('function');

    unregister();
    expect(mocks.removeListener).toHaveBeenCalledWith(registeredListener);
  });

  it('ignora mensagens que não pertencem ao protocolo retornando literalmente false', () => {
    const dummyRoute = vi.fn();
    registerBackgroundMessaging(dummyRoute);
    const listener = mocks.addListener.mock.calls[0][0];

    const sendResponse = vi.fn();
    const foreignMessage = { action: 'UNKNOWN_MSG', data: 123 };

    const handled = listener(foreignMessage, { id: 'ext-id' }, sendResponse);

    expect(handled).toBe(false);
    expect(dummyRoute).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it('assume mensagens do protocolo retornando literalmente true e encaminha ao roteador', async () => {
    const expectedReply = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-msg-01',
      ok: true,
      payload: { alive: true, echo: 'probe' },
    };

    const route = vi.fn().mockResolvedValue(expectedReply);
    registerBackgroundMessaging(route);
    const listener = mocks.addListener.mock.calls[0][0];

    const sendResponse = vi.fn();
    const message = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-msg-01',
      type: 'platform.ping',
      payload: { probe: 'probe' },
    };
    const sender = { id: 'ext-id' };

    const handled = listener(message, sender, sendResponse);

    expect(handled).toBe(true);

    // Aguarda a resolução assíncrona do microtask
    await vi.waitFor(() => {
      expect(route).toHaveBeenCalledWith(message, sender);
      expect(sendResponse).toHaveBeenCalledWith(expectedReply);
    });
  });

  it('envia resposta controlada HANDLER_FAILED quando a rota resolve para undefined em mensagem com ID válido', async () => {
    const route = vi.fn().mockResolvedValue(undefined);
    registerBackgroundMessaging(route);
    const listener = mocks.addListener.mock.calls[0][0];

    const sendResponse = vi.fn();
    const message = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-undef-01',
      type: 'platform.ping',
      payload: { probe: 'probe' },
    };

    const handled = listener(message, { id: 'ext-id' }, sendResponse);
    expect(handled).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-undef-01',
        ok: false,
        error: {
          code: 'HANDLER_FAILED',
          message: 'Não foi possível processar a solicitação.',
        },
      });
    });
  });

  it('envia resposta controlada HANDLER_FAILED quando o roteador rejeita', async () => {
    const route = vi.fn().mockRejectedValue(new Error('Internal unexpected crash'));
    registerBackgroundMessaging(route);
    const listener = mocks.addListener.mock.calls[0][0];

    const sendResponse = vi.fn();
    const message = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-crash-01',
      type: 'platform.ping',
      payload: { probe: 'probe' },
    };

    const handled = listener(message, { id: 'ext-id' }, sendResponse);
    expect(handled).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-crash-01',
        ok: false,
        error: {
          code: 'HANDLER_FAILED',
          message: 'Não foi possível processar a solicitação.',
        },
      });
    });
  });

  it('tolera falha ao chamar sendResponse quando o canal já tiver sido fechado pelo navegador', async () => {
    const route = vi.fn().mockResolvedValue({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-closed-01',
      ok: true,
      payload: { alive: true, echo: 'echo' },
    });
    registerBackgroundMessaging(route);
    const listener = mocks.addListener.mock.calls[0][0];

    const sendResponse = vi.fn().mockImplementation(() => {
      throw new Error('Channel closed');
    });

    const message = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-closed-01',
      type: 'platform.ping',
      payload: { probe: 'echo' },
    };

    expect(() => {
      const handled = listener(message, { id: 'ext-id' }, sendResponse);
      expect(handled).toBe(true);
    }).not.toThrow();

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalled();
    });
  });

  it('impede chamadas duplicadas a sendResponse para a mesma mensagem', async () => {
    let capturedSender: unknown;
    const route = vi.fn().mockImplementation(async (msg, snd) => {
      capturedSender = snd;
      return {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-dup-01',
        ok: true,
        payload: { alive: true, echo: 'once' },
      };
    });

    registerBackgroundMessaging(route);
    const listener = mocks.addListener.mock.calls[0][0];

    const sendResponse = vi.fn();
    const message = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-dup-01',
      type: 'platform.ping',
      payload: { probe: 'once' },
    };

    listener(message, { id: 'ext-id' }, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledTimes(1);
    });

    // Tentativa deliberada de reenvio manual ou posterior
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(capturedSender).toEqual({ id: 'ext-id' });
  });
});
