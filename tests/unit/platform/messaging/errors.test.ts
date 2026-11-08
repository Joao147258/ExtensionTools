/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/unit/platform/messaging/errors.test.ts
 * Responsabilidade: Testes unitários para o componente de Error Handling da mensageria
 *                   (B3-F03 — Platform Messaging Error Handling).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type MessageErrorCode,
  type MessageReply,
  type MessageResult,
} from '../../../../src/platform/messaging/contracts';
import {
  errorReply,
  failure,
  publicErrorMessage,
  PUBLIC_ERROR_MESSAGES,
} from '../../../../src/platform/messaging/errors';

describe('B3-F03 — Platform Messaging Error Handling', () => {
  const allCodes: MessageErrorCode[] = [
    'INVALID_REQUEST',
    'UNKNOWN_OPERATION',
    'UNAUTHORIZED',
    'HANDLER_FAILED',
    'TRANSPORT_FAILURE',
    'UNAVAILABLE',
    'TIMEOUT',
    'INVALID_RESPONSE',
  ];

  // ===========================================================================
  // 1. Testes da função failure()
  // ===========================================================================

  describe('failure()', () => {
    it('deve construir um resultado lógico de falha com ok: false', () => {
      const result = failure('INVALID_REQUEST', 'Solicitação inválida.');

      expect(result).toEqual({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Solicitação inválida.',
        },
      });
      expect(result.ok).toBe(false);
    });

    it('deve preservar fielmente o código e a mensagem fornecidos', () => {
      const code: MessageErrorCode = 'TIMEOUT';
      const msg = 'Tempo limite de 5000ms atingido.';
      const result = failure(code, msg);

      expect(result.error.code).toBe(code);
      expect(result.error.message).toBe(msg);
    });

    it('deve suportar todos os códigos de erro canônicos de MessageErrorCode', () => {
      for (const code of allCodes) {
        const result = failure(code, `Mensagem de erro para ${code}`);
        expect(result.ok).toBe(false);
        expect(result.error.code).toBe(code);
      }
    });

    it('deve retornar tipo compatível com MessageResult<T> de qualquer tipo', () => {
      interface CustomPayload {
        data: string[];
      }

      function executeOperation(): MessageResult<CustomPayload> {
        return failure('HANDLER_FAILED', 'Falha no processador.');
      }

      const outcome = executeOperation();
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) {
        expect(outcome.error.code).toBe('HANDLER_FAILED');
      }
    });

    it('deve ser uma função pura e determinística sem efeitos colaterais', () => {
      const res1 = failure('UNAUTHORIZED', 'Não autorizado');
      const res2 = failure('UNAUTHORIZED', 'Não autorizado');

      expect(res1).toEqual(res2);
      expect(res1).not.toBe(res2); // novas instâncias imutáveis
    });
  });

  // ===========================================================================
  // 2. Testes da função errorReply()
  // ===========================================================================

  describe('errorReply()', () => {
    it('deve construir uma resposta de erro completa compatível com o envelope', () => {
      const reply = errorReply(
        'req-12345',
        'UNKNOWN_OPERATION',
        'Operação solicitada não reconhecida.'
      );

      expect(reply).toEqual({
        protocol: MESSAGE_PROTOCOL,
        version: MESSAGE_VERSION,
        id: 'req-12345',
        ok: false,
        error: {
          code: 'UNKNOWN_OPERATION',
          message: 'Operação solicitada não reconhecida.',
        },
      });
    });

    it('deve conter as constantes canônicas MESSAGE_PROTOCOL e MESSAGE_VERSION', () => {
      const reply = errorReply('req-check-proto', 'INVALID_REQUEST', 'Erro de validação.');

      expect(reply.protocol).toBe('extensiontools.messaging');
      expect(reply.version).toBe(1);
    });

    it('deve preservar o ID da solicitação original para correlação no cliente', () => {
      const originalId = 'corr-id-9988-uuid-v4';
      const reply = errorReply(originalId, 'HANDLER_FAILED', 'Erro interno.');

      expect(reply.id).toBe(originalId);
    });

    it('deve permitir especialização de MessageReply<K> sem quebras de tipo', () => {
      const reply: MessageReply<'platform.ping'> = errorReply<'platform.ping'>(
        'ping-req-01',
        'UNAVAILABLE',
        'Background inativo.'
      );

      expect(reply.ok).toBe(false);
      if (!reply.ok) {
        expect(reply.error.code).toBe('UNAVAILABLE');
      }
    });

    it('deve gerar instâncias independentes para chamadas com mesmos parâmetros', () => {
      const rep1 = errorReply('id-1', 'TIMEOUT', 'Expirado');
      const rep2 = errorReply('id-1', 'TIMEOUT', 'Expirado');

      expect(rep1).toEqual(rep2);
      expect(rep1).not.toBe(rep2);
    });
  });

  // ===========================================================================
  // 3. Catálogo de Mensagens Públicas e publicErrorMessage()
  // ===========================================================================

  describe('PUBLIC_ERROR_MESSAGES & publicErrorMessage()', () => {
    it('deve cobrir 100% dos códigos de MessageErrorCode no catálogo', () => {
      for (const code of allCodes) {
        expect(PUBLIC_ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof PUBLIC_ERROR_MESSAGES[code]).toBe('string');
        expect(PUBLIC_ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      }
    });

    it('deve retornar a mensagem segura correspondente via publicErrorMessage()', () => {
      expect(publicErrorMessage('INVALID_REQUEST')).toBe('A solicitação é inválida.');
      expect(publicErrorMessage('UNKNOWN_OPERATION')).toBe('A operação não é reconhecida.');
      expect(publicErrorMessage('UNAUTHORIZED')).toBe('A operação não está autorizada.');
      expect(publicErrorMessage('HANDLER_FAILED')).toBe(
        'Não foi possível processar a solicitação.'
      );
      expect(publicErrorMessage('TRANSPORT_FAILURE')).toBe(
        'Não foi possível concluir a comunicação.'
      );
      expect(publicErrorMessage('UNAVAILABLE')).toBe('O serviço está indisponível.');
      expect(publicErrorMessage('TIMEOUT')).toBe('O tempo de espera foi excedido.');
      expect(publicErrorMessage('INVALID_RESPONSE')).toBe('A resposta recebida é inválida.');
    });

    it('deve integrar publicErrorMessage com failure e errorReply garantindo segurança', () => {
      const sanitizedResult = failure('HANDLER_FAILED', publicErrorMessage('HANDLER_FAILED'));
      expect(sanitizedResult.error.message).toBe('Não foi possível processar a solicitação.');

      const sanitizedReply = errorReply(
        'req-safe-01',
        'UNAVAILABLE',
        publicErrorMessage('UNAVAILABLE')
      );
      expect(sanitizedReply.error.message).toBe('O serviço está indisponível.');
    });
  });

  // ===========================================================================
  // 4. Cenários de Segurança e Proteção contra Vazamento de Detalhes Internos
  // ===========================================================================

  describe('Segurança: Proteção contra Exposição de Erros Internos', () => {
    it('deve permitir que o consumidor mascare exceções técnicas sensíveis usando catálogo público', () => {
      // Cenário: Uma exceção do runtime contém dados sensíveis (path interno, stack, token)
      const internalException = new Error(
        'Database connection failed at /var/data/secret/db.sqlite: Token secret-key-xyz invalid'
      );

      // O consumidor captura a exceção e utiliza o catálogo para construir resposta pública
      function safeHandler(requestId: string): MessageReply<'platform.ping'> {
        try {
          throw internalException;
        } catch {
          return errorReply(requestId, 'HANDLER_FAILED', publicErrorMessage('HANDLER_FAILED'));
        }
      }

      const reply = safeHandler('req-prod-001');

      expect(reply.ok).toBe(false);
      if (!reply.ok) {
        expect(reply.error.message).not.toContain('/var/data/secret');
        expect(reply.error.message).not.toContain('secret-key-xyz');
        expect(reply.error.message).toBe('Não foi possível processar a solicitação.');
      }
    });
  });

  // ===========================================================================
  // 5. Limites Arquiteturais e API Pública
  // ===========================================================================

  describe('Limites Arquiteturais e Exportações', () => {
    it('deve reexportar failure, errorReply e catálogo através do index.ts de messaging', async () => {
      const messaging = await import('../../../../src/platform/messaging');
      expect(typeof messaging.failure).toBe('function');
      expect(typeof messaging.errorReply).toBe('function');
      expect(typeof messaging.publicErrorMessage).toBe('function');
      expect(messaging.PUBLIC_ERROR_MESSAGES).toBeDefined();
    });

    it('não deve conter dependências de navegador, React ou DOM', async () => {
      const module = await import('../../../../src/platform/messaging/errors');
      const exportKeys = Object.keys(module);
      expect(exportKeys).toEqual([
        'PUBLIC_ERROR_MESSAGES',
        'publicErrorMessage',
        'failure',
        'errorReply',
      ]);
    });
  });
});
