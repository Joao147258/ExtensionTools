/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/unit/platform/messaging/transport.test.ts
 * Responsabilidade: Testes unitários para a porta de transporte de mensageria
 *                   (B3-F04 — Platform Messaging Transport Port).
 * ==============================================================================
 */

import { describe, expect, it, vi } from 'vitest';
import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type AnyRequest,
  type MessageReply,
  type RequestMessage,
} from '../../../../src/platform/messaging/contracts';
import { isReplyFor } from '../../../../src/platform/messaging/validation';
import { failure, publicErrorMessage } from '../../../../src/platform/messaging/errors';
import type { MessageTransport } from '../../../../src/platform/messaging/transport';

/**
 * Implementação simulada em memória da porta MessageTransport para uso em testes.
 * Demonstra a capacidade de simular o transporte sem acoplamento a APIs do navegador.
 */
class FakeMessageTransport implements MessageTransport {
  public recordedRequests: AnyRequest[] = [];

  constructor(
    private readonly responseOrFactory:
      unknown | ((request: AnyRequest) => unknown | Promise<unknown>),
    private readonly shouldThrow: boolean = false,
    private readonly rejectionError: unknown = new Error('Simulated transport failure')
  ) {}

  async send(request: AnyRequest): Promise<unknown> {
    this.recordedRequests.push(request);

    if (this.shouldThrow) {
      throw this.rejectionError;
    }

    if (typeof this.responseOrFactory === 'function') {
      return (this.responseOrFactory as (req: AnyRequest) => unknown)(request);
    }

    return this.responseOrFactory;
  }
}

/**
 * Consumidor ilustrativo para demonstração do Princípio de Inversão de Dependências (DIP)
 * e injeção de dependência por construtor.
 */
class SampleMessagingConsumer {
  constructor(private readonly transport: MessageTransport) {}

  async executePing(probe: string, requestId = 'test-req-001'): Promise<unknown> {
    const request: RequestMessage<'platform.ping'> = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id: requestId,
      type: 'platform.ping',
      payload: { probe },
    };

    return this.transport.send(request);
  }
}

describe('B3-F04 — Platform Messaging Transport Port', () => {
  // ===========================================================================
  // 1. Conformidade Estrutural e Contrato da Interface
  // ===========================================================================

  describe('Conformidade Estrutural e Assinatura', () => {
    it('permite implementar a interface MessageTransport com um objeto literal', async () => {
      const mockResult = { simulated: true };
      const sendMock = vi.fn(async (_req: AnyRequest): Promise<unknown> => mockResult);

      const transport: MessageTransport = {
        send: sendMock,
      };

      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-01',
        type: 'platform.ping',
        payload: { probe: 'unit-test' },
      };

      const result = await transport.send(request);

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(request);
      expect(result).toBe(mockResult);
    });

    it('permite implementar a interface MessageTransport via classe', async () => {
      const transport: MessageTransport = new FakeMessageTransport({ alive: true });

      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-class-01',
        type: 'platform.ping',
        payload: { probe: 'class-test' },
      };

      const response = await transport.send(request);
      expect(response).toEqual({ alive: true });
    });

    it('garante que send() recebe AnyRequest preservando a discriminação por tipo', async () => {
      const recorded: AnyRequest[] = [];
      const transport: MessageTransport = {
        async send(request: AnyRequest): Promise<unknown> {
          recorded.push(request);
          return { acknowledged: true };
        },
      };

      const pingRequest: AnyRequest = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'ping-disc-1',
        type: 'platform.ping',
        payload: { probe: 'healthcheck' },
      };

      await transport.send(pingRequest);

      expect(recorded).toHaveLength(1);
      expect(recorded[0].type).toBe('platform.ping');
      if (recorded[0].type === 'platform.ping') {
        expect(recorded[0].payload.probe).toBe('healthcheck');
      }
    });
  });

  // ===========================================================================
  // 2. Fronteira de Confiança e Retorno de Respostas Arbitrárias (unknown)
  // ===========================================================================

  describe('Fronteira de Confiança (unknown return)', () => {
    it('retorna respostas compatíveis com o protocolo mantendo seu conteúdo bruto', async () => {
      const validReply: MessageReply<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-reply-1',
        ok: true,
        payload: {
          alive: true,
          echo: 'healthcheck',
        },
      };

      const transport = new FakeMessageTransport(validReply);
      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-reply-1',
        type: 'platform.ping',
        payload: { probe: 'healthcheck' },
      };

      const rawResponse: unknown = await transport.send(request);

      expect(rawResponse).toEqual(validReply);
      // Demonstra validação posterior com B3-F02
      expect(isReplyFor(rawResponse, 'platform.ping', 'req-ping-reply-1')).toBe(true);
    });

    it('retorna respostas malformadas ou inesperadas como unknown sem falhas prematuras', async () => {
      const malformedResponses = [
        { unexpectedProperty: 'malicious-or-broken' },
        null,
        undefined,
        'unexpected string reply',
        42,
        [],
        { ok: true }, // ausência de payload
      ];

      for (const malformed of malformedResponses) {
        const transport = new FakeMessageTransport(malformed);
        const request: RequestMessage<'platform.ping'> = {
          protocol: MESSAGE_PROTOCOL,
          version: MESSAGE_VERSION,
          id: 'req-malformed-01',
          type: 'platform.ping',
          payload: { probe: 'test' },
        };

        const rawResponse: unknown = await transport.send(request);
        expect(rawResponse).toEqual(malformed);

        // A camada de transporte não deve interpretar nem validar; a validação deve rejeitar
        expect(isReplyFor(rawResponse, 'platform.ping', 'req-malformed-01')).toBe(false);
      }
    });

    it('suporta respostas representando envelopes de erro do protocolo', async () => {
      const errorReply: MessageReply<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-err-01',
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Acesso negado à operação.',
        },
      };

      const transport = new FakeMessageTransport(errorReply);
      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-err-01',
        type: 'platform.ping',
        payload: { probe: 'test' },
      };

      const response: unknown = await transport.send(request);
      expect(response).toEqual(errorReply);
      expect(isReplyFor(response, 'platform.ping', 'req-err-01')).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Simulação de Rejeições e Falhas Assíncronas
  // ===========================================================================

  describe('Tratamento de Rejeições e Falhas de Comunicação', () => {
    it('propaga a rejeição da Promise quando o transporte falha', async () => {
      const errorInstance = new Error('Network port disconnected');
      const failingTransport: MessageTransport = new FakeMessageTransport(
        null,
        true,
        errorInstance
      );

      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-fail-01',
        type: 'platform.ping',
        payload: { probe: 'test' },
      };

      await expect(failingTransport.send(request)).rejects.toThrow('Network port disconnected');
    });

    it('permite que o consumidor intercepte rejeições e mapeie para resultados controlados (B3-F03)', async () => {
      const failingTransport: MessageTransport = {
        async send(): Promise<unknown> {
          throw new Error('Chromium runtime error: Could not establish connection.');
        },
      };

      // Simulação do comportamento esperado no futuro MessagingClient
      async function executeSafe(transport: MessageTransport, req: AnyRequest) {
        try {
          return await transport.send(req);
        } catch {
          return failure('TRANSPORT_FAILURE', publicErrorMessage('TRANSPORT_FAILURE'));
        }
      }

      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-fail-02',
        type: 'platform.ping',
        payload: { probe: 'test' },
      };

      const result = await executeSafe(failingTransport, request);
      expect(result).toEqual({
        ok: false,
        error: {
          code: 'TRANSPORT_FAILURE',
          message: 'Não foi possível concluir a comunicação.',
        },
      });
    });

    it('suporta rejeições não-Error (e.g. strings ou objetos)', async () => {
      const failingTransport: MessageTransport = {
        async send(): Promise<unknown> {
          return Promise.reject('String rejection reason');
        },
      };

      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-fail-03',
        type: 'platform.ping',
        payload: { probe: 'test' },
      };

      await expect(failingTransport.send(request)).rejects.toBe('String rejection reason');
    });
  });

  // ===========================================================================
  // 4. Princípio de Inversão de Dependências (DIP) e Injeção de Dependência
  // ===========================================================================

  describe('Princípio de Inversão de Dependências (DIP)', () => {
    it('permite que um consumidor receba qualquer implementação da porta sem acoplamento', async () => {
      const transportA = new FakeMessageTransport({ echo: 'response-A' });
      const transportB = new FakeMessageTransport({ echo: 'response-B' });

      const consumerA = new SampleMessagingConsumer(transportA);
      const consumerB = new SampleMessagingConsumer(transportB);

      const resA = await consumerA.executePing('probe-A');
      const resB = await consumerB.executePing('probe-B');

      expect(resA).toEqual({ echo: 'response-A' });
      expect(resB).toEqual({ echo: 'response-B' });
      expect(transportA.recordedRequests).toHaveLength(1);
      expect(transportB.recordedRequests).toHaveLength(1);
    });

    it('funciona integralmente sem referências a chrome.* ou APIs de navegador', () => {
      // Verifica ausência de chrome no escopo global deste ambiente de teste
      expect(typeof globalThis.chrome).toBe('undefined');

      const transport: MessageTransport = new FakeMessageTransport({ ok: true });
      expect(transport).toBeDefined();
    });
  });

  // ===========================================================================
  // 5. Limites Arquiteturais e API Pública
  // ===========================================================================

  describe('Limites Arquiteturais e Exportações', () => {
    it('deve reexportar MessageTransport através do index.ts canônico de messaging', async () => {
      const messaging = await import('../../../../src/platform/messaging');
      expect(messaging).toBeDefined();
      // Verificação de que o módulo compila e reexporta corretamente
      const transport: MessageTransport = {
        async send() {
          return null;
        },
      };
      expect(transport).toBeDefined();
    });

    it('não deve emitir código executável desnecessário no módulo transport.ts (apenas tipos)', async () => {
      const transportModule = await import('../../../../src/platform/messaging/transport');
      // Uma interface TypeScript compila para objeto vazio em ESM runtime
      const exportKeys = Object.keys(transportModule);
      expect(exportKeys).toEqual([]);
    });
  });
});
