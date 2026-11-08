import { describe, it, expect, vi } from 'vitest';
import { MESSAGE_PROTOCOL, MESSAGE_VERSION } from '../../../../src/platform/messaging/contracts';
import {
  createBackgroundRouter,
  type BackgroundHandlers,
  type SenderInfo,
} from '../../../../src/platform/messaging/background-router';

describe('B3-F07 — Background Message Router Unit Tests', () => {
  const EXTENSION_ID = 'test-extension-id-123';
  const authorizedSender: SenderInfo = { id: EXTENSION_ID };

  it('valida parâmetros da fábrica createBackgroundRouter', () => {
    const dummyHandlers: BackgroundHandlers = {
      ping: vi.fn(),
    };

    expect(() => createBackgroundRouter('', dummyHandlers)).toThrow(TypeError);
    // @ts-expect-error teste de runtime
    expect(() => createBackgroundRouter(123, dummyHandlers)).toThrow(TypeError);
    // @ts-expect-error teste de runtime
    expect(() => createBackgroundRouter(EXTENSION_ID, null)).toThrow(TypeError);
    // @ts-expect-error teste de runtime
    expect(() => createBackgroundRouter(EXTENSION_ID, {})).toThrow(TypeError);
  });

  it('ignora mensagens que não pertencem ao protocolo retornando undefined', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const result1 = await router({ some: 'other-protocol' }, authorizedSender);
    const result2 = await router(null, authorizedSender);
    const result3 = await router('plain text', authorizedSender);

    expect(result1).toBeUndefined();
    expect(result2).toBeUndefined();
    expect(result3).toBeUndefined();
    expect(pingHandler).not.toHaveBeenCalled();
  });

  it('retorna undefined para mensagens que pertencem ao protocolo mas não possuem ID válido', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const msgWithoutId = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      type: 'platform.ping',
      payload: { probe: 'test' },
    };

    const msgWithInvalidId = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: '', // id vazio é inválido
      type: 'platform.ping',
      payload: { probe: 'test' },
    };

    expect(await router(msgWithoutId, authorizedSender)).toBeUndefined();
    expect(await router(msgWithInvalidId, authorizedSender)).toBeUndefined();
    expect(pingHandler).not.toHaveBeenCalled();
  });

  it('rejeita remetentes com extension ID diferente com UNAUTHORIZED', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const validMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-auth-1',
      type: 'platform.ping',
      payload: { probe: 'test' },
    };

    const result = await router(validMsg, { id: 'impostor-id' });

    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-auth-1',
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'A operação não está autorizada.',
      },
    });
    expect(pingHandler).not.toHaveBeenCalled();
  });

  it('rejeita mensagens originadas de abas/content scripts (sender.tab != null) com UNAUTHORIZED', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const validMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-tab-1',
      type: 'platform.ping',
      payload: { probe: 'test' },
    };

    const result = await router(validMsg, {
      id: EXTENSION_ID,
      tab: { id: 42, url: 'https://example.com' },
    });

    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-tab-1',
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'A operação não está autorizada.',
      },
    });
    expect(pingHandler).not.toHaveBeenCalled();
  });

  it('retorna UNKNOWN_OPERATION para operações não registradas no catálogo', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const unknownOpMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-unknown-1',
      type: 'platform.do_magic',
      payload: {},
    };

    const result = await router(unknownOpMsg, authorizedSender);

    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-unknown-1',
      ok: false,
      error: {
        code: 'UNKNOWN_OPERATION',
        message: 'A operação não é reconhecida.',
      },
    });
    expect(pingHandler).not.toHaveBeenCalled();
  });

  it('retorna INVALID_REQUEST quando o payload não atende ao contrato específico da operação', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const invalidPayloadMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-inv-1',
      type: 'platform.ping',
      payload: { probe: '' }, // probe vazio é inválido (mínimo 1 caracter)
    };

    const result = await router(invalidPayloadMsg, authorizedSender);

    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-inv-1',
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'A solicitação é inválida.',
      },
    });
    expect(pingHandler).not.toHaveBeenCalled();
  });

  it('encaminha a operação platform.ping ao handler e retorna a resposta de sucesso validada', async () => {
    const pingHandler = vi.fn().mockResolvedValue({
      alive: true,
      echo: 'custom-echo-reply',
    });

    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const validMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-ping-100',
      type: 'platform.ping',
      payload: { probe: 'custom-echo-reply' },
    };

    const result = await router(validMsg, authorizedSender);

    expect(pingHandler).toHaveBeenCalledWith({ probe: 'custom-echo-reply' });
    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-ping-100',
      ok: true,
      payload: {
        alive: true,
        echo: 'custom-echo-reply',
      },
    });
  });

  it('retorna HANDLER_FAILED quando o handler lança uma exceção, sem vazar a mensagem original da exceção', async () => {
    const pingHandler = vi
      .fn()
      .mockRejectedValue(new Error('Sensitive DB connection secret leaked!'));
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const validMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-exc-1',
      type: 'platform.ping',
      payload: { probe: 'test' },
    };

    const result = await router(validMsg, authorizedSender);

    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-exc-1',
      ok: false,
      error: {
        code: 'HANDLER_FAILED',
        message: 'Não foi possível processar a solicitação.',
      },
    });
    expect(JSON.stringify(result)).not.toContain('Sensitive DB');
  });

  it('retorna HANDLER_FAILED quando o handler retorna um objeto que viola o contrato de resposta', async () => {
    // Retorna alive: false, violando o contrato onde alive DEVE ser true
    const pingHandler = vi.fn().mockResolvedValue({
      alive: false,
      echo: 'test',
    });

    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const validMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-bad-ret',
      type: 'platform.ping',
      payload: { probe: 'test' },
    };

    const result = await router(validMsg, authorizedSender);

    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-bad-ret',
      ok: false,
      error: {
        code: 'HANDLER_FAILED',
        message: 'Não foi possível processar a solicitação.',
      },
    });
  });

  it('segurança: payload com metadados falsificados de origem não altera a verificação de autorização', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const spoofedMsg = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-spoof-1',
      type: 'platform.ping',
      payload: {
        probe: 'valid-probe',
        // Tentativa de injeção de atributos forjados no payload
        senderId: EXTENSION_ID,
        origin: 'chrome-extension://' + EXTENSION_ID,
        tab: null,
      },
    };

    // Remetente real no browser runtime é fraudulento
    const impostorSender: SenderInfo = { id: 'impostor-extension-id' };

    const result = await router(spoofedMsg, impostorSender);

    expect(result).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'req-spoof-1',
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'A operação não está autorizada.',
      },
    });
    // O handler jamais é executado
    expect(pingHandler).not.toHaveBeenCalled();
  });

  it('segurança: impede despacho dinâmico arbitrário baseado em propriedades do protótipo', async () => {
    const pingHandler = vi.fn();
    const router = createBackgroundRouter(EXTENSION_ID, { ping: pingHandler });

    const dangerousTypes = ['__proto__', 'constructor', 'toString', 'valueOf', 'isPrototypeOf'];

    for (const dangerousType of dangerousTypes) {
      const msg = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: `req-proto-${dangerousType}`,
        type: dangerousType,
        payload: { probe: 'test' },
      };

      const result = await router(msg, authorizedSender);

      expect(result).toEqual({
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: `req-proto-${dangerousType}`,
        ok: false,
        error: {
          code: 'UNKNOWN_OPERATION',
          message: 'A operação não é reconhecida.',
        },
      });
      expect(pingHandler).not.toHaveBeenCalled();
    }
  });
});
