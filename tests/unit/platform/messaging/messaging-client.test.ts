import { describe, it, expect, vi } from 'vitest';
import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type AnyRequest,
} from '../../../../src/platform/messaging/contracts';
import {
  MessagingClient,
  RequestTimeoutError,
} from '../../../../src/platform/messaging/messaging-client';
import type { MessageTransport } from '../../../../src/platform/messaging/transport';

describe('B3-F06 — MessagingClient Unit Tests', () => {
  it('valida parâmetros do construtor rejeitando valores inválidos de timeoutMs e newId', () => {
    const dummyTransport: MessageTransport = { send: vi.fn() };

    expect(() => new MessagingClient(dummyTransport, 0)).toThrow(TypeError);
    expect(() => new MessagingClient(dummyTransport, -100)).toThrow(TypeError);
    expect(() => new MessagingClient(dummyTransport, Number.NaN)).toThrow(TypeError);
    expect(() => new MessagingClient(dummyTransport, Number.POSITIVE_INFINITY)).toThrow(TypeError);
    // @ts-expect-error teste de runtime para consumidor JS
    expect(() => new MessagingClient(dummyTransport, '5000')).toThrow(TypeError);
    // @ts-expect-error teste de runtime para consumidor JS
    expect(() => new MessagingClient(dummyTransport, 1000, 'not-a-fn')).toThrow(TypeError);
  });

  it('constrói o envelope de solicitação corretamente e entrega o resultado tipado em caso de sucesso', async () => {
    let capturedRequest: AnyRequest | undefined;

    const mockTransport: MessageTransport = {
      send: vi.fn().mockImplementation(async (req: AnyRequest) => {
        capturedRequest = req;
        return {
          protocol: MESSAGE_PROTOCOL,
          version: MESSAGE_VERSION,
          id: req.id,
          ok: true,
          payload: {
            alive: true,
            echo: 'sidepanel-probe',
          },
        };
      }),
    };

    const client = new MessagingClient(mockTransport, 5000, () => 'fixed-id-123');

    const result = await client.request('platform.ping', { probe: 'sidepanel-probe' });

    expect(capturedRequest).toEqual({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'fixed-id-123',
      type: 'platform.ping',
      payload: { probe: 'sidepanel-probe' },
    });

    expect(result).toEqual({
      ok: true,
      value: {
        alive: true,
        echo: 'sidepanel-probe',
      },
    });
  });

  it('retorna INVALID_REQUEST caso a solicitação construída não seja válida', async () => {
    const mockTransport: MessageTransport = { send: vi.fn() };
    // newId retornando string vazia (inválida segundo isBoundedString(1, 128))
    const client = new MessagingClient(mockTransport, 5000, () => '');

    const result = await client.request('platform.ping', { probe: 'test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_REQUEST');
    }
    expect(mockTransport.send).not.toHaveBeenCalled();
  });

  it('preserva a resposta de erro quando o Background responder ok: false', async () => {
    const mockTransport: MessageTransport = {
      send: vi.fn().mockResolvedValue({
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-err-456',
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Remetente não autorizado.',
        },
      }),
    };

    const client = new MessagingClient(mockTransport, 5000, () => 'req-err-456');

    const result = await client.request('platform.ping', { probe: 'test' });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Remetente não autorizado.',
      },
    });
  });

  it('retorna INVALID_RESPONSE caso a resposta seja malformada ou desconhecida', async () => {
    const mockTransport: MessageTransport = {
      send: vi.fn().mockResolvedValue({ not: 'a valid reply' }),
    };

    const client = new MessagingClient(mockTransport, 5000, () => 'req-invalid');

    const result = await client.request('platform.ping', { probe: 'test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_RESPONSE');
    }
  });

  it('retorna INVALID_RESPONSE caso o ID da resposta não corresponda ao ID da solicitação emitida', async () => {
    const mockTransport: MessageTransport = {
      send: vi.fn().mockResolvedValue({
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'wrong-id-999',
        ok: true,
        payload: { alive: true, echo: 'echo' },
      }),
    };

    const client = new MessagingClient(mockTransport, 5000, () => 'expected-id-001');

    const result = await client.request('platform.ping', { probe: 'echo' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_RESPONSE');
    }
  });

  it('retorna INVALID_RESPONSE se a versão do protocolo na resposta for incompatível', async () => {
    const mockTransport: MessageTransport = {
      send: vi.fn().mockResolvedValue({
        protocol: MESSAGE_PROTOCOL,
        version: 2, // Versão diferente da canônica
        id: 'req-v2',
        ok: true,
        payload: { alive: true, echo: 'echo' },
      }),
    };

    const client = new MessagingClient(mockTransport, 5000, () => 'req-v2');

    const result = await client.request('platform.ping', { probe: 'echo' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_RESPONSE');
    }
  });

  it('converte rejeição do transporte em TRANSPORT_FAILURE com mensagem pública controlada', async () => {
    const mockTransport: MessageTransport = {
      send: vi.fn().mockRejectedValue(new Error('Internal connection pipe broken')),
    };

    const client = new MessagingClient(mockTransport, 5000, () => 'req-rej');

    const result = await client.request('platform.ping', { probe: 'echo' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TRANSPORT_FAILURE');
      // Garante que o erro original não vazou
      expect(result.error.message).not.toContain('pipe broken');
    }
  });

  it('retorna TIMEOUT quando o transporte excede o tempo limite configurado', async () => {
    vi.useFakeTimers();

    try {
      const mockTransport: MessageTransport = {
        send: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              // Responde após 10 segundos
              setTimeout(() => {
                resolve({
                  protocol: MESSAGE_PROTOCOL,
                  version: MESSAGE_VERSION,
                  id: 'req-timeout',
                  ok: true,
                  payload: { alive: true, echo: 'echo' },
                });
              }, 10000);
            })
        ),
      };

      const client = new MessagingClient(mockTransport, 1000, () => 'req-timeout');

      const requestPromise = client.request('platform.ping', { probe: 'echo' });

      // Avança além do timeout de 1000ms
      await vi.advanceTimersByTimeAsync(1100);

      const result = await requestPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT');
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('resposta tardia após o timeout não altera o resultado já retornado nem causa erro não tratado', async () => {
    vi.useFakeTimers();

    try {
      let lateResolve: ((value: unknown) => void) | undefined;

      const mockTransport: MessageTransport = {
        send: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              lateResolve = resolve;
            })
        ),
      };

      const client = new MessagingClient(mockTransport, 500, () => 'req-late');

      const requestPromise = client.request('platform.ping', { probe: 'echo' });

      await vi.advanceTimersByTimeAsync(600);

      const result = await requestPromise;
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT');
      }

      // Agora o transporte tardiamente resolve
      expect(() => {
        lateResolve?.({
          protocol: MESSAGE_PROTOCOL,
          version: MESSAGE_VERSION,
          id: 'req-late',
          ok: true,
          payload: { alive: true, echo: 'late' },
        });
      }).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it('RequestTimeoutError possui nome de classe correto', () => {
    const error = new RequestTimeoutError();
    expect(error.name).toBe('RequestTimeoutError');
    expect(error instanceof Error).toBe(true);
  });

  it('suporta solicitações concorrentes com respostas fora de ordem garantindo correlação correta', async () => {
    const pendingResolvers = new Map<string, (val: unknown) => void>();

    const mockTransport: MessageTransport = {
      send: vi.fn().mockImplementation((req: AnyRequest) => {
        return new Promise((resolve) => {
          pendingResolvers.set(req.id, resolve);
        });
      }),
    };

    let idCounter = 1;
    const client = new MessagingClient(mockTransport, 5000, () => `corr-id-${idCounter++}`);

    // Dispara 3 requisições simultâneas
    const req1 = client.request('platform.ping', { probe: 'req-one' });
    const req2 = client.request('platform.ping', { probe: 'req-two' });
    const req3 = client.request('platform.ping', { probe: 'req-three' });

    expect(mockTransport.send).toHaveBeenCalledTimes(3);

    // Resolve as requisições em ordem inversa (Req 3, depois Req 1, depois Req 2)
    const resolve3 = pendingResolvers.get('corr-id-3');
    const resolve1 = pendingResolvers.get('corr-id-1');
    const resolve2 = pendingResolvers.get('corr-id-2');

    resolve3?.({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'corr-id-3',
      ok: true,
      payload: { alive: true, echo: 'req-three' },
    });

    resolve1?.({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'corr-id-1',
      ok: true,
      payload: { alive: true, echo: 'req-one' },
    });

    resolve2?.({
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: 'corr-id-2',
      ok: true,
      payload: { alive: true, echo: 'req-two' },
    });

    const [res1, res2, res3] = await Promise.all([req1, req2, req3]);

    expect(res1).toEqual({
      ok: true,
      value: { alive: true, echo: 'req-one' },
    });
    expect(res2).toEqual({
      ok: true,
      value: { alive: true, echo: 'req-two' },
    });
    expect(res3).toEqual({
      ok: true,
      value: { alive: true, echo: 'req-three' },
    });
  });

  it('não executa retry automático quando o transporte falha ou sofre timeout', async () => {
    vi.useFakeTimers();

    try {
      const sendSpy = vi.fn().mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Connection failure'));
            }, 2000);
          })
      );

      const mockTransport: MessageTransport = { send: sendSpy };
      const client = new MessagingClient(mockTransport, 1000, () => 'no-retry-id');

      const requestPromise = client.request('platform.ping', { probe: 'test' });

      await vi.advanceTimersByTimeAsync(1100);

      const result = await requestPromise;

      expect(result.ok).toBe(false);
      // Confirma que foi chamado estritamente uma única vez (sem retry automático)
      expect(sendSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
