/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/unit/platform/messaging/contracts.test.ts
 * Responsabilidade: Testes unitários para os contratos de mensageria da plataforma
 *                   (B3-F01 — Message Contracts).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type RequestMessage,
  type AnyRequest,
  type MessageReply,
  type MessageResult,
  type MessageError,
  type MessageErrorCode,
} from '../../../../src/platform/messaging/contracts';

describe('B3-F01 — Platform Messaging Contracts', () => {
  describe('E02 — Identidade e Versionamento do Protocolo', () => {
    it('deve exportar MESSAGE_PROTOCOL com valor constante exato', () => {
      expect(MESSAGE_PROTOCOL).toBe('extensiontools.messaging');
    });

    it('deve exportar MESSAGE_VERSION com valor numérico 1', () => {
      expect(MESSAGE_VERSION).toBe(1);
    });

    it('não deve exportar implementações de runtime ou transporte espúrias', async () => {
      const module = await import('../../../../src/platform/messaging/contracts');
      // Apenas constantes de protocolo existem em runtime
      const exportKeys = Object.keys(module);
      expect(exportKeys).toEqual(['MESSAGE_PROTOCOL', 'MESSAGE_VERSION']);
    });
  });

  describe('E03 / E04 / E05 — Catálogo de Operações e Envelope de Solicitação', () => {
    it('deve construir solicitação RequestMessage válida para platform.ping', () => {
      const request: RequestMessage<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-001',
        type: 'platform.ping',
        payload: {
          probe: 'sidepanel-diagnostic',
        },
      };

      expect(request.protocol).toBe('extensiontools.messaging');
      expect(request.version).toBe(1);
      expect(request.id).toBe('req-ping-001');
      expect(request.type).toBe('platform.ping');
      expect(request.payload.probe).toBe('sidepanel-diagnostic');
    });

    it('deve suportar AnyRequest mantendo correlação entre type e payload', () => {
      const anyReq: AnyRequest = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-any-002',
        type: 'platform.ping',
        payload: {
          probe: 'test-runner',
        },
      };

      function extractProbe(msg: AnyRequest): string {
        if (msg.type === 'platform.ping') {
          return msg.payload.probe;
        }
        return '';
      }

      expect(extractProbe(anyReq)).toBe('test-runner');
    });
  });

  describe('E06 — Contratos de Erro, Resposta (Reply) e Resultado (Result)', () => {
    const errorCodes: MessageErrorCode[] = [
      'INVALID_REQUEST',
      'UNKNOWN_OPERATION',
      'UNAUTHORIZED',
      'HANDLER_FAILED',
      'TRANSPORT_FAILURE',
      'UNAVAILABLE',
      'TIMEOUT',
      'INVALID_RESPONSE',
    ];

    it('deve validar estrutura de MessageError para todos os códigos reconhecidos', () => {
      for (const code of errorCodes) {
        const error: MessageError = {
          code,
          message: `Erro descritivo para ${code}`,
        };
        expect(error.code).toBe(code);
        expect(error.message).toContain(code);
      }
    });

    it('deve discriminar corretamente MessageReply em caso de sucesso', () => {
      const successReply: MessageReply<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-001',
        ok: true,
        payload: {
          alive: true,
          echo: 'sidepanel-diagnostic',
        },
      };

      if (successReply.ok) {
        expect(successReply.payload.alive).toBe(true);
        expect(successReply.payload.echo).toBe('sidepanel-diagnostic');
      } else {
        expect.unreachable('Não deveria cair no ramo de erro');
      }
    });

    it('deve discriminar corretamente MessageReply em caso de falha', () => {
      const failureReply: MessageReply<'platform.ping'> = {
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-ping-001',
        ok: false,
        error: {
          code: 'HANDLER_FAILED',
          message: 'Falha simulada na execução do handler.',
        },
      };

      if (!failureReply.ok) {
        expect(failureReply.error.code).toBe('HANDLER_FAILED');
        expect(failureReply.error.message).toBe('Falha simulada na execução do handler.');
      } else {
        expect.unreachable('Não deveria cair no ramo de sucesso');
      }
    });

    it('deve discriminar corretamente MessageResult para a aplicação', () => {
      const successResult: MessageResult<{ alive: true; echo: string }> = {
        ok: true,
        value: {
          alive: true,
          echo: 'ping-ok',
        },
      };

      const failureResult: MessageResult<{ alive: true; echo: string }> = {
        ok: false,
        error: {
          code: 'TIMEOUT',
          message: 'Timeout ao aguardar resposta do background.',
        },
      };

      function handleResult<T>(result: MessageResult<T>): {
        isSuccess: boolean;
        output: T | string;
      } {
        if (result.ok) {
          return { isSuccess: true, output: result.value };
        }
        return { isSuccess: false, output: result.error.message };
      }

      const resSuccess = handleResult(successResult);
      expect(resSuccess.isSuccess).toBe(true);
      expect(resSuccess.output).toEqual({ alive: true, echo: 'ping-ok' });

      const resFailure = handleResult(failureResult);
      expect(resFailure.isSuccess).toBe(false);
      expect(resFailure.output).toBe('Timeout ao aguardar resposta do background.');
    });
  });

  describe('E01 / Limites Arquiteturais — Independência de Runtime', () => {
    it('deve importar os contratos sem requerer APIs do navegador ou React', async () => {
      const contracts = await import('../../../../src/platform/messaging/contracts');
      expect(contracts).toBeDefined();
      expect(contracts.MESSAGE_PROTOCOL).toBe('extensiontools.messaging');
    });

    it('deve reexportar contratos através da API pública index.ts', async () => {
      const messaging = await import('../../../../src/platform/messaging');
      expect(messaging.MESSAGE_PROTOCOL).toBe(MESSAGE_PROTOCOL);
      expect(messaging.MESSAGE_VERSION).toBe(MESSAGE_VERSION);
    });
  });
});
