/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/unit/platform/messaging/browser-runtime-transport.test.ts
 * Responsabilidade: Testes unitários para o adaptador de transporte concreto
 *                   BrowserRuntimeTransport (B3-F05 — Browser Runtime Adapter).
 * ==============================================================================
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRuntimeTransport } from '../../../../src/platform/messaging/browser-runtime-transport';
import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type AnyRequest,
  type MessageReply,
  type RequestMessage,
} from '../../../../src/platform/messaging/contracts';
import type { MessageTransport } from '../../../../src/platform/messaging/transport';

// Mock isolado do módulo wxt/browser com vi.hoisted
const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}));

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      sendMessage: mocks.sendMessage,
    },
  },
}));

describe('B3-F05 — Browser Runtime Adapter (BrowserRuntimeTransport)', () => {
  let transport: BrowserRuntimeTransport;

  const validPingRequest: RequestMessage<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-ping-b3-f05',
    type: 'platform.ping',
    payload: {
      probe: 'health-check',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    transport = new BrowserRuntimeTransport();
  });

  // ===========================================================================
  // 1. Conformidade Estrutural e Contrato da Porta (MessageTransport)
  // ===========================================================================

  describe('Conformidade Estrutural e DIP', () => {
    it('deve instanciar uma classe que implementa MessageTransport', () => {
      expect(transport).toBeDefined();
      expect(typeof transport.send).toBe('function');

      // Verificação estática e polimórfica da porta
      const port: MessageTransport = transport;
      expect(port).toBe(transport);
    });

    it('não deve invocar browser.runtime.sendMessage durante a instanciação', () => {
      new BrowserRuntimeTransport();
      expect(mocks.sendMessage).not.toHaveBeenCalled();
    });

    it('permite injeção em um consumidor desacoplado dependente da porta MessageTransport', async () => {
      class SampleClient {
        constructor(private readonly messageTransport: MessageTransport) {}

        async ping(id: string): Promise<unknown> {
          return this.messageTransport.send({
            protocol: MESSAGE_PROTOCOL,
            version: MESSAGE_VERSION,
            id,
            type: 'platform.ping',
            payload: { probe: 'consumer-test' },
          });
        }
      }

      mocks.sendMessage.mockResolvedValueOnce({ ok: true, probe: 'consumer-test' });

      const client = new SampleClient(transport);
      const res = await client.ping('req-client-01');

      expect(res).toEqual({ ok: true, probe: 'consumer-test' });
      expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // 2. Encaminhamento Fiel de Solicitações (send)
  // ===========================================================================

  describe('Encaminhamento de Solicitações', () => {
    it('deve encaminhar a solicitação exatamente como recebida, sem mutações', async () => {
      const mockResult = { status: 'acknowledged' };
      mocks.sendMessage.mockResolvedValueOnce(mockResult);

      const response = await transport.send(validPingRequest);

      expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
      expect(mocks.sendMessage).toHaveBeenCalledWith(validPingRequest);
      expect(response).toBe(mockResult);
    });

    it('deve encaminhar solicitações arbitrárias conformes a AnyRequest', async () => {
      const genericRequest: AnyRequest = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-arbitrary-02',
        type: 'platform.ping',
        payload: {
          probe: 'arbitrary-payload',
        },
      };

      mocks.sendMessage.mockResolvedValueOnce('ack');

      const response = await transport.send(genericRequest);

      expect(mocks.sendMessage).toHaveBeenCalledWith(genericRequest);
      expect(response).toBe('ack');
    });
  });

  // ===========================================================================
  // 3. Fronteira de Confiança (Retorno Bruto como unknown)
  // ===========================================================================

  describe('Fronteira de Confiança e Preservação de Respostas', () => {
    it('deve preservar envelopes de sucesso válidos do protocolo', async () => {
      const expectedReply: MessageReply<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-b3-f05',
        ok: true,
        payload: {
          alive: true,
          echo: 'health-check',
        },
      };

      mocks.sendMessage.mockResolvedValueOnce(expectedReply);

      const response = await transport.send(validPingRequest);
      expect(response).toBe(expectedReply);
    });

    it('deve preservar envelopes de erro do protocolo sem capturá-los ou modificá-los', async () => {
      const errorReply: MessageReply<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-b3-f05',
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Solicitação inválida.',
        },
      };

      mocks.sendMessage.mockResolvedValueOnce(errorReply);

      const response = await transport.send(validPingRequest);
      expect(response).toBe(errorReply);
    });

    it('deve preservar respostas brutas malformadas ou não conformes sem validação prematura', async () => {
      const rawResponses = [
        { unexpectedProperty: 123 },
        null,
        undefined,
        'plain string response',
        1337,
        false,
        [1, 2, 3],
      ];

      for (const raw of rawResponses) {
        mocks.sendMessage.mockResolvedValueOnce(raw);

        const response = await transport.send(validPingRequest);
        expect(response).toBe(raw);
      }
    });
  });

  // ===========================================================================
  // 4. Tratamento e Propagação de Rejeições do Runtime
  // ===========================================================================

  describe('Propagação de Rejeições do Mecanismo de Mensageria', () => {
    it('deve propagar fielmente rejeições do tipo Error', async () => {
      const runtimeError = new Error(
        'Could not establish connection. Receiving end does not exist.'
      );
      mocks.sendMessage.mockRejectedValueOnce(runtimeError);

      await expect(transport.send(validPingRequest)).rejects.toBe(runtimeError);
    });

    it('deve propagar rejeições primitivas ou não-Error sem mascaramento', async () => {
      mocks.sendMessage.mockRejectedValueOnce('Transport disconnected unexpectedly');

      await expect(transport.send(validPingRequest)).rejects.toBe(
        'Transport disconnected unexpectedly'
      );
    });

    it('não deve capturar exceções nem fabricar respostas de fallback', async () => {
      mocks.sendMessage.mockRejectedValueOnce(new TypeError('Invalid message clone'));

      let caughtError: unknown = null;
      try {
        await transport.send(validPingRequest);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(TypeError);
      expect((caughtError as TypeError).message).toBe('Invalid message clone');
    });
  });

  // ===========================================================================
  // 5. Integração com a API Pública de Messaging (index.ts)
  // ===========================================================================

  describe('API Pública e Re-exportação Canônica', () => {
    it('deve reexportar BrowserRuntimeTransport a partir do index.ts de platform/messaging', async () => {
      const messagingModule = await import('../../../../src/platform/messaging');
      expect(messagingModule.BrowserRuntimeTransport).toBeDefined();
      expect(messagingModule.BrowserRuntimeTransport).toBe(BrowserRuntimeTransport);

      const instance = new messagingModule.BrowserRuntimeTransport();
      expect(instance).toBeInstanceOf(BrowserRuntimeTransport);
    });
  });
});
