/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/unit/platform/messaging/validation.test.ts
 * Responsabilidade: Testes unitários para o validador em tempo de execução
 *                   (B3-F02 — Runtime Validation).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type MessageErrorCode,
} from '../../../../src/platform/messaging/contracts';
import {
  ERROR_CODES,
  isBoundedString,
  isErrorCode,
  isKnownMessageType,
  isProtocolMessage,
  isRecord,
  isReplyFor,
  isRequestMessage,
  readRequestId,
} from '../../../../src/platform/messaging/validation';

describe('B3-F02 — Platform Messaging Runtime Validation', () => {
  // Fixtures padrão
  const validRequest = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-ping-001',
    type: 'platform.ping',
    payload: {
      probe: 'healthcheck',
    },
  };

  const validReply = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-ping-001',
    ok: true,
    payload: {
      alive: true,
      echo: 'healthcheck',
    },
  };

  const validErrorReply = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-ping-001',
    ok: false,
    error: {
      code: 'INVALID_REQUEST' as MessageErrorCode,
      message: 'Solicitação inválida.',
    },
  };

  // ===========================================================================
  // 1. isRecord
  // ===========================================================================
  describe('isRecord', () => {
    it('aceita objetos literais e objetos vazios', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ name: 'test' })).toBe(true);
      expect(isRecord(Object.create(null))).toBe(true);
    });

    it('rejeita null e undefined', () => {
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
    });

    it('rejeita arrays', () => {
      expect(isRecord([])).toBe(false);
      expect(isRecord([1, 2, 3])).toBe(false);
    });

    it('rejeita tipos primitivos e funções', () => {
      expect(isRecord('string')).toBe(false);
      expect(isRecord(123)).toBe(false);
      expect(isRecord(0)).toBe(false);
      expect(isRecord(NaN)).toBe(false);
      expect(isRecord(true)).toBe(false);
      expect(isRecord(false)).toBe(false);
      expect(isRecord(Symbol('sym'))).toBe(false);
      expect(isRecord(() => {})).toBe(false);
    });
  });

  // ===========================================================================
  // 2. isBoundedString
  // ===========================================================================
  describe('isBoundedString', () => {
    it('aceita strings dentro dos limites especificados', () => {
      expect(isBoundedString('abc', 1, 5)).toBe(true);
      expect(isBoundedString('a', 1, 5)).toBe(true);
      expect(isBoundedString('abcde', 1, 5)).toBe(true);
      expect(isBoundedString('', 0, 5)).toBe(true);
    });

    it('rejeita strings abaixo do limite mínimo', () => {
      expect(isBoundedString('', 1, 10)).toBe(false);
      expect(isBoundedString('ab', 3, 10)).toBe(false);
    });

    it('rejeita strings acima do limite máximo', () => {
      expect(isBoundedString('abcdef', 1, 5)).toBe(false);
      expect(isBoundedString('a'.repeat(65), 1, 64)).toBe(false);
    });

    it('rejeita valores que não sejam strings', () => {
      expect(isBoundedString(123, 1, 10)).toBe(false);
      expect(isBoundedString(null, 0, 10)).toBe(false);
      expect(isBoundedString(undefined, 0, 10)).toBe(false);
      expect(isBoundedString({}, 0, 10)).toBe(false);
      expect(isBoundedString([], 0, 10)).toBe(false);
    });
  });

  // ===========================================================================
  // 3. isProtocolMessage
  // ===========================================================================
  describe('isProtocolMessage', () => {
    it('reconhece objeto com protocolo correto', () => {
      expect(isProtocolMessage(validRequest)).toBe(true);
      expect(isProtocolMessage({ protocol: MESSAGE_PROTOCOL })).toBe(true);
    });

    it('rejeita protocolo diferente ou ausente', () => {
      expect(isProtocolMessage({ protocol: 'other.messaging' })).toBe(false);
      expect(isProtocolMessage({ protocol: '' })).toBe(false);
      expect(isProtocolMessage({})).toBe(false);
    });

    it('rejeita entradas que não sejam objetos', () => {
      expect(isProtocolMessage(null)).toBe(false);
      expect(isProtocolMessage(undefined)).toBe(false);
      expect(isProtocolMessage('extensiontools.messaging')).toBe(false);
      expect(isProtocolMessage(123)).toBe(false);
    });
  });

  // ===========================================================================
  // 4. isKnownMessageType
  // ===========================================================================
  describe('isKnownMessageType', () => {
    it('reconhece platform.ping', () => {
      expect(isKnownMessageType('platform.ping')).toBe(true);
    });

    it('rejeita operações desconhecidas ou hipotéticas futuras', () => {
      expect(isKnownMessageType('workspace.list')).toBe(false);
      expect(isKnownMessageType('file.write')).toBe(false);
      expect(isKnownMessageType('unknown')).toBe(false);
      expect(isKnownMessageType('')).toBe(false);
    });

    it('rejeita valores não-string', () => {
      expect(isKnownMessageType(null)).toBe(false);
      expect(isKnownMessageType(undefined)).toBe(false);
      expect(isKnownMessageType(123)).toBe(false);
      expect(isKnownMessageType({})).toBe(false);
    });
  });

  // ===========================================================================
  // 5. readRequestId
  // ===========================================================================
  describe('readRequestId', () => {
    it('extrai ID válido de 1 a 128 caracteres', () => {
      expect(readRequestId({ id: 'req-001' })).toBe('req-001');
      expect(readRequestId({ id: 'a' })).toBe('a');
      expect(readRequestId({ id: 'x'.repeat(128) })).toBe('x'.repeat(128));
    });

    it('retorna null para ID vazio ou excedendo 128 caracteres', () => {
      expect(readRequestId({ id: '' })).toBeNull();
      expect(readRequestId({ id: 'x'.repeat(129) })).toBeNull();
    });

    it('retorna null para ID ausente ou de tipo não-string', () => {
      expect(readRequestId({})).toBeNull();
      expect(readRequestId({ id: 123 })).toBeNull();
      expect(readRequestId({ id: null })).toBeNull();
      expect(readRequestId({ id: true })).toBeNull();
    });

    it('retorna null para entradas que não são objetos', () => {
      expect(readRequestId(null)).toBeNull();
      expect(readRequestId(undefined)).toBeNull();
      expect(readRequestId('req-001')).toBeNull();
      expect(readRequestId([])).toBeNull();
    });
  });

  // ===========================================================================
  // 6. isErrorCode
  // ===========================================================================
  describe('isErrorCode', () => {
    it('reconhece todos os 8 códigos de erro canônicos', () => {
      for (const code of ERROR_CODES) {
        expect(isErrorCode(code)).toBe(true);
      }
    });

    it('rejeita códigos desconhecidos ou inválidos', () => {
      expect(isErrorCode('UNKNOWN_ERROR')).toBe(false);
      expect(isErrorCode('NOT_FOUND')).toBe(false);
      expect(isErrorCode('HTTP_500')).toBe(false);
      expect(isErrorCode('')).toBe(false);
    });

    it('rejeita valores que não sejam strings', () => {
      expect(isErrorCode(404)).toBe(false);
      expect(isErrorCode(null)).toBe(false);
      expect(isErrorCode(undefined)).toBe(false);
      expect(isErrorCode({})).toBe(false);
    });
  });

  // ===========================================================================
  // 7. isRequestMessage
  // ===========================================================================
  describe('isRequestMessage', () => {
    it('aceita solicitação válida para platform.ping', () => {
      expect(isRequestMessage(validRequest)).toBe(true);
    });

    it('aceita probe nos limites exatos (1 e 64 caracteres) e com caracteres Unicode', () => {
      expect(
        isRequestMessage({
          ...validRequest,
          payload: { probe: 'a' },
        })
      ).toBe(true);

      expect(
        isRequestMessage({
          ...validRequest,
          payload: { probe: 'p'.repeat(64) },
        })
      ).toBe(true);

      expect(
        isRequestMessage({
          ...validRequest,
          payload: { probe: '🔍 Teste com acentuação e emojis: café & cachaça' },
        })
      ).toBe(true);
    });

    it('aceita id nos limites exatos (1 e 128 caracteres)', () => {
      expect(
        isRequestMessage({
          ...validRequest,
          id: 'i',
        })
      ).toBe(true);

      expect(
        isRequestMessage({
          ...validRequest,
          id: 'i'.repeat(128),
        })
      ).toBe(true);
    });

    it('tolera propriedades adicionais sem falha estrutural', () => {
      expect(
        isRequestMessage({
          ...validRequest,
          extraField: 'allowed_metadata',
          payload: {
            probe: 'healthcheck',
            extraData: 123,
          },
        })
      ).toBe(true);
    });

    const invalidCases: Array<[string, unknown]> = [
      ['null', null],
      ['undefined', undefined],
      ['array', []],
      ['número', 123],
      ['string pura', 'mensagem'],
      ['objeto vazio', {}],
      ['protocolo incorreto', { ...validRequest, protocol: 'other.messaging' }],
      ['protocolo numérico', { ...validRequest, protocol: 123 }],
      ['versão incorreta (2)', { ...validRequest, version: 2 }],
      ['versão em string ("1")', { ...validRequest, version: '1' }],
      ['versão ausente', { ...validRequest, version: undefined }],
      ['id ausente', { ...validRequest, id: undefined }],
      ['id vazio', { ...validRequest, id: '' }],
      ['id numérico', { ...validRequest, id: 12345 }],
      ['id excedendo 128 chars', { ...validRequest, id: 'x'.repeat(129) }],
      ['operação desconhecida', { ...validRequest, type: 'workspace.list' }],
      ['operação vazia', { ...validRequest, type: '' }],
      ['operação numérica', { ...validRequest, type: 999 }],
      ['payload ausente', { ...validRequest, payload: undefined }],
      ['payload null', { ...validRequest, payload: null }],
      ['payload array', { ...validRequest, payload: ['healthcheck'] }],
      ['payload primitivo', { ...validRequest, payload: 'healthcheck' }],
      ['probe ausente', { ...validRequest, payload: {} }],
      ['probe vazio (0 chars)', { ...validRequest, payload: { probe: '' } }],
      ['probe numérico', { ...validRequest, payload: { probe: 123 } }],
      ['probe excedendo 64 chars', { ...validRequest, payload: { probe: 'x'.repeat(65) } }],
      ['probe booleano', { ...validRequest, payload: { probe: true } }],
    ];

    it.each(invalidCases)('rejeita caso inválido: %s', (_desc, input) => {
      expect(isRequestMessage(input)).toBe(false);
    });

    it('não lança exceções inesperadas diante de entradas arbitrárias ou estruturas anômalas', () => {
      const weirdInputs: unknown[] = [
        null,
        undefined,
        '',
        123,
        true,
        [],
        {},
        { protocol: null },
        { type: 'platform.ping' },
        Symbol('weird'),
        () => {},
        new Date(),
        new Map(),
        new Set(),
        {
          get protocol() {
            return MESSAGE_PROTOCOL;
          },
          get version() {
            return MESSAGE_VERSION;
          },
          get id() {
            return 'req-getter';
          },
          get type() {
            return 'platform.ping';
          },
          get payload() {
            return null;
          },
        },
      ];

      for (const input of weirdInputs) {
        expect(() => isRequestMessage(input)).not.toThrow();
        expect(() => isReplyFor(input, 'platform.ping', 'req-any')).not.toThrow();
        expect(() => isProtocolMessage(input)).not.toThrow();
        expect(() => readRequestId(input)).not.toThrow();
      }
    });
  });

  // ===========================================================================
  // 8. isReplyFor
  // ===========================================================================
  describe('isReplyFor', () => {
    it('aceita resposta de sucesso válida para platform.ping correlacionada ao ID', () => {
      expect(isReplyFor(validReply, 'platform.ping', 'req-ping-001')).toBe(true);
    });

    it('aceita echo com 0 caracteres (string vazia permitida pelo contrato)', () => {
      const emptyEchoReply = {
        ...validReply,
        payload: {
          alive: true,
          echo: '',
        },
      };
      expect(isReplyFor(emptyEchoReply, 'platform.ping', 'req-ping-001')).toBe(true);
    });

    it('aceita echo com 64 caracteres', () => {
      const maxEchoReply = {
        ...validReply,
        payload: {
          alive: true,
          echo: 'e'.repeat(64),
        },
      };
      expect(isReplyFor(maxEchoReply, 'platform.ping', 'req-ping-001')).toBe(true);
    });

    it('aceita resposta de erro válida com código registrado e mensagem entre 1 e 300 chars', () => {
      expect(isReplyFor(validErrorReply, 'platform.ping', 'req-ping-001')).toBe(true);

      const maxErrorMessageReply = {
        ...validErrorReply,
        error: {
          code: 'HANDLER_FAILED' as MessageErrorCode,
          message: 'm'.repeat(300),
        },
      };
      expect(isReplyFor(maxErrorMessageReply, 'platform.ping', 'req-ping-001')).toBe(true);
    });

    it('rejeita respostas com ID divergente do requestId esperado', () => {
      expect(isReplyFor(validReply, 'platform.ping', 'req-ping-999')).toBe(false);
      expect(isReplyFor(validErrorReply, 'platform.ping', 'other-id')).toBe(false);
    });

    it('rejeita se o requestId fornecido for inválido (vazio ou > 128)', () => {
      expect(isReplyFor(validReply, 'platform.ping', '')).toBe(false);
      expect(isReplyFor(validReply, 'platform.ping', 'x'.repeat(129))).toBe(false);
    });

    it('rejeita se a operação esperada for desconhecida', () => {
      // @ts-expect-error teste com tipo desconhecido
      expect(isReplyFor(validReply, 'unknown.op', 'req-ping-001')).toBe(false);
    });

    it('rejeita payload de sucesso com alive diferente de true literal', () => {
      const falseAlive = {
        ...validReply,
        payload: { alive: false, echo: 'test' },
      };
      expect(isReplyFor(falseAlive, 'platform.ping', 'req-ping-001')).toBe(false);

      const stringAlive = {
        ...validReply,
        payload: { alive: 'true', echo: 'test' },
      };
      expect(isReplyFor(stringAlive, 'platform.ping', 'req-ping-001')).toBe(false);
    });

    it('rejeita payload de sucesso com echo excedendo 64 caracteres ou de tipo incompatível', () => {
      const oversizedEcho = {
        ...validReply,
        payload: { alive: true, echo: 'e'.repeat(65) },
      };
      expect(isReplyFor(oversizedEcho, 'platform.ping', 'req-ping-001')).toBe(false);

      const numericEcho = {
        ...validReply,
        payload: { alive: true, echo: 123 },
      };
      expect(isReplyFor(numericEcho, 'platform.ping', 'req-ping-001')).toBe(false);
    });

    it('rejeita respostas com ok de tipo não-booleano', () => {
      expect(isReplyFor({ ...validReply, ok: 'true' }, 'platform.ping', 'req-ping-001')).toBe(
        false
      );

      expect(isReplyFor({ ...validReply, ok: 1 }, 'platform.ping', 'req-ping-001')).toBe(false);

      expect(isReplyFor({ ...validReply, ok: undefined }, 'platform.ping', 'req-ping-001')).toBe(
        false
      );
    });

    it('rejeita resposta de erro com código não reconhecido', () => {
      const invalidCodeReply = {
        ...validErrorReply,
        error: { code: 'NOT_A_CODE', message: 'Erro desconhecido' },
      };
      expect(isReplyFor(invalidCodeReply, 'platform.ping', 'req-ping-001')).toBe(false);
    });

    it('rejeita resposta de erro com mensagem vazia ou excedendo 300 caracteres', () => {
      const emptyMsgReply = {
        ...validErrorReply,
        error: { code: 'HANDLER_FAILED', message: '' },
      };
      expect(isReplyFor(emptyMsgReply, 'platform.ping', 'req-ping-001')).toBe(false);

      const oversizedMsgReply = {
        ...validErrorReply,
        error: { code: 'HANDLER_FAILED', message: 'x'.repeat(301) },
      };
      expect(isReplyFor(oversizedMsgReply, 'platform.ping', 'req-ping-001')).toBe(false);
    });

    it('rejeita resposta de erro sem objeto error ou com error nulo/array', () => {
      expect(isReplyFor({ ...validErrorReply, error: null }, 'platform.ping', 'req-ping-001')).toBe(
        false
      );

      expect(isReplyFor({ ...validErrorReply, error: [] }, 'platform.ping', 'req-ping-001')).toBe(
        false
      );

      expect(
        isReplyFor({ ...validErrorReply, error: undefined }, 'platform.ping', 'req-ping-001')
      ).toBe(false);
    });

    it('rejeita respostas com protocolo ou versão incompatíveis', () => {
      expect(
        isReplyFor({ ...validReply, protocol: 'other.proto' }, 'platform.ping', 'req-ping-001')
      ).toBe(false);

      expect(isReplyFor({ ...validReply, version: 2 }, 'platform.ping', 'req-ping-001')).toBe(
        false
      );

      expect(isReplyFor({ ...validReply, version: '1' }, 'platform.ping', 'req-ping-001')).toBe(
        false
      );
    });

    it('rejeita valores de entrada não-objeto', () => {
      expect(isReplyFor(null, 'platform.ping', 'req-ping-001')).toBe(false);
      expect(isReplyFor(undefined, 'platform.ping', 'req-ping-001')).toBe(false);
      expect(isReplyFor([], 'platform.ping', 'req-ping-001')).toBe(false);
      expect(isReplyFor(123, 'platform.ping', 'req-ping-001')).toBe(false);
    });
  });
});
