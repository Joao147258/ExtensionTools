/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging Runtime Validation
 *
 * Módulo de validação em tempo de execução para mensagens que atravessam os
 * limites entre contextos (Side Panel, Background, Content Scripts).
 *
 * Este módulo não executa transporte, roteamento ou regras de negócio; sua
 * responsabilidade exclusiva é verificar a conformidade dos dados recebidos
 * contra os contratos canônicos estabelecidos em contracts.ts.
 * ==============================================================================
 */

import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type AnyRequest,
  type MessageErrorCode,
  type MessageReply,
  type MessageType,
} from './contracts';

// =============================================================================
// 1. Validadores Primitivos e Auxiliares
// =============================================================================

/**
 * Validador básico de estrutura de objeto plano ou dicionário em runtime.
 * Garante que o valor não seja nulo, não seja array e possua typeof 'object'.
 *
 * @param value Valor desconhecido a ser verificado.
 * @returns Type predicate indicando se o valor é Record<string, unknown>.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Valida se um valor desconhecido é uma string dentro dos limites estabelecidos.
 *
 * @param value Valor desconhecido a ser verificado.
 * @param minLength Tamanho mínimo permitido (em unidades de código UTF-16).
 * @param maxLength Tamanho máximo permitido (em unidades de código UTF-16).
 * @returns Type predicate indicando se o valor é uma string válida com limites respeitados.
 */
export function isBoundedString(
  value: unknown,
  minLength: number,
  maxLength: number
): value is string {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
}

// =============================================================================
// 2. Identificação do Protocolo e das Operações
// =============================================================================

/**
 * Verifica se a mensagem apresenta a identidade básica do protocolo ExtensionTools.
 * Esta verificação avalia unicamente o identificador do protocolo, sem garantir a
 * validade da versão, do envelope completo ou do payload.
 *
 * @param value Valor desconhecido recebido pelo canal de mensagens.
 * @returns boolean indicando se o valor pertence ao protocolo.
 */
export function isProtocolMessage(value: unknown): boolean {
  return isRecord(value) && value.protocol === MESSAGE_PROTOCOL;
}

/**
 * Type guard para identificar se uma operação é reconhecida pelo catálogo atual.
 *
 * @param value Valor desconhecido a ser verificado.
 * @returns Type predicate indicando se o valor pertence ao catálogo MessageType.
 */
export function isKnownMessageType(value: unknown): value is MessageType {
  return value === 'platform.ping';
}

/**
 * Tenta extrair com segurança o identificador de uma mensagem arbitrária.
 * Retorna null quando o valor não for um objeto válido ou quando o id não respeitar
 * as restrições de string não-vazia até 128 caracteres.
 *
 * @param value Valor desconhecido do qual se deseja extrair o ID.
 * @returns O identificador extraído ou null se ausente/inválido.
 */
export function readRequestId(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isBoundedString(value.id, 1, 128)) {
    return null;
  }

  return value.id;
}

// =============================================================================
// 3. Catálogo e Validação dos Códigos de Erro
// =============================================================================

/**
 * Lista canônica dos códigos de erro suportados pelo protocolo em runtime.
 */
export const ERROR_CODES = [
  'INVALID_REQUEST',
  'UNKNOWN_OPERATION',
  'UNAUTHORIZED',
  'HANDLER_FAILED',
  'TRANSPORT_FAILURE',
  'UNAVAILABLE',
  'TIMEOUT',
  'INVALID_RESPONSE',
] as const satisfies readonly MessageErrorCode[];

const ERROR_CODE_SET: ReadonlySet<string> = new Set<string>(ERROR_CODES);

/**
 * Type guard que comprova se uma string desconhecida representa um código de erro
 * registrado e permitido pelo protocolo.
 *
 * @param value Valor desconhecido a ser verificado.
 * @returns Type predicate indicando se o valor é MessageErrorCode.
 */
export function isErrorCode(value: unknown): value is MessageErrorCode {
  return typeof value === 'string' && ERROR_CODE_SET.has(value);
}

// =============================================================================
// 4. Validação Completa de Solicitações (Requests)
// =============================================================================

/**
 * Validador completo de solicitações em tempo de execução.
 * Avalia progressivamente:
 * 1. Estrutura do objeto (isRecord);
 * 2. Correspondência exata de protocolo e versão;
 * 3. Identificador de correlação (1 a 128 caracteres);
 * 4. Operação reconhecida no catálogo (MessageType);
 * 5. Estrutura básica do payload (objeto);
 * 6. Contrato específico do payload da operação selecionada.
 *
 * @param value Valor desconhecido recebido como solicitação.
 * @returns Type predicate confirmando se o valor satisfaz AnyRequest.
 */
export function isRequestMessage(value: unknown): value is AnyRequest {
  if (!isRecord(value)) {
    return false;
  }

  if (value.protocol !== MESSAGE_PROTOCOL || value.version !== MESSAGE_VERSION) {
    return false;
  }

  if (!isBoundedString(value.id, 1, 128)) {
    return false;
  }

  if (!isKnownMessageType(value.type)) {
    return false;
  }

  if (!isRecord(value.payload)) {
    return false;
  }

  switch (value.type) {
    case 'platform.ping':
      return isBoundedString(value.payload.probe, 1, 64);

    default:
      return false;
  }
}

// =============================================================================
// 5. Validação Completa de Respostas (Replies)
// =============================================================================

/**
 * Validador completo de respostas em tempo de execução correlacionadas à solicitação.
 * Avalia progressivamente:
 * 1. Estrutura do objeto (isRecord);
 * 2. Validação da operação esperada e do ID da solicitação original;
 * 3. Correspondência exata de protocolo, versão e correlação de ID;
 * 4. Resposta de erro (ok === false): estrutura de erro, código reconhecido e mensagem descritiva (1 a 300 caracteres);
 * 5. Resposta de sucesso (ok === true): payload correspondente ao contrato da operação esperada.
 *
 * @param value Valor desconhecido recebido como resposta.
 * @param type Operação esperada para a qual a resposta foi solicitada.
 * @param requestId Identificador original da solicitação emitida.
 * @returns Type predicate confirmando se o valor satisfaz MessageReply<K>.
 */
export function isReplyFor<K extends MessageType>(
  value: unknown,
  type: K,
  requestId: string
): value is MessageReply<K> {
  if (!isRecord(value)) {
    return false;
  }

  if (!isKnownMessageType(type)) {
    return false;
  }

  if (!isBoundedString(requestId, 1, 128)) {
    return false;
  }

  if (
    value.protocol !== MESSAGE_PROTOCOL ||
    value.version !== MESSAGE_VERSION ||
    value.id !== requestId
  ) {
    return false;
  }

  // 1. Respostas de falha / erro
  if (value.ok === false) {
    if (!isRecord(value.error)) {
      return false;
    }

    return isErrorCode(value.error.code) && isBoundedString(value.error.message, 1, 300);
  }

  // 2. Respostas de sucesso
  if (value.ok !== true || !isRecord(value.payload)) {
    return false;
  }

  switch (type) {
    case 'platform.ping':
      return value.payload.alive === true && isBoundedString(value.payload.echo, 0, 64);

    default:
      return false;
  }
}
