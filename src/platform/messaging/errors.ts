/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging Error Handling
 *
 * Módulo para construção padronizada de representações de falha na infraestrutura
 * de Platform Messaging.
 *
 * Responsabilidade exclusiva:
 * - Construir resultados lógicos de falha (MessageResult<never>)
 * - Construir envelopes de resposta de erro (MessageReply<MessageType>)
 * - Fornecer catálogo e resolvedor de mensagens públicas controladas
 *
 * Este módulo não realiza transporte, não inspeciona runtime do navegador,
 * não captura exceções automaticamente e é composto exclusivamente por funções puras.
 * ==============================================================================
 */

import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type MessageErrorCode,
  type MessageReply,
  type MessageResult,
  type MessageType,
} from './contracts';

// =============================================================================
// 1. Catálogo Canônico de Mensagens Públicas Controladas
// =============================================================================

/**
 * Mensagens públicas padrão e seguras para cada código de erro do protocolo.
 * Evita a propagação de detalhes técnicos, exceções não tratadas ou dados sensíveis.
 */
export const PUBLIC_ERROR_MESSAGES = {
  INVALID_REQUEST: 'A solicitação é inválida.',
  UNKNOWN_OPERATION: 'A operação não é reconhecida.',
  UNAUTHORIZED: 'A operação não está autorizada.',
  HANDLER_FAILED: 'Não foi possível processar a solicitação.',
  TRANSPORT_FAILURE: 'Não foi possível concluir a comunicação.',
  UNAVAILABLE: 'O serviço está indisponível.',
  TIMEOUT: 'O tempo de espera foi excedido.',
  INVALID_RESPONSE: 'A resposta recebida é inválida.',
} as const satisfies Record<MessageErrorCode, string>;

/**
 * Retorna a mensagem pública padrão associada a um código de erro do protocolo.
 *
 * @param code Código de erro canônico.
 * @returns Mensagem descritiva segura e controlada.
 */
export function publicErrorMessage(code: MessageErrorCode): string {
  return PUBLIC_ERROR_MESSAGES[code];
}

// =============================================================================
// 2. Fábricas de Erro Padronizadas
// =============================================================================

/**
 * Constrói um resultado lógico de falha no padrão MessageResult.
 *
 * Não inclui metadados de envelope ou transporte.
 * Deve receber apenas mensagens públicas seguras ou resolvidas via publicErrorMessage().
 *
 * @param code Código de erro canônico do protocolo.
 * @param message Descrição pública segura da falha.
 * @returns MessageResult<never> indicando falha da operação lógica.
 */
export function failure(code: MessageErrorCode, message: string): MessageResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Constrói uma resposta completa de erro dentro do envelope de mensageria.
 *
 * O identificador recebido deve ser previamente validado pelo receptor
 * da mensagem original para manter a integridade de correlação.
 *
 * @param id Identificador da solicitação original correlacionada.
 * @param code Código de erro canônico do protocolo.
 * @param message Descrição pública segura da falha.
 * @returns MessageReply<K> (padrão MessageReply<MessageType>) compatível com o protocolo e envelope.
 */
export function errorReply<K extends MessageType = MessageType>(
  id: string,
  code: MessageErrorCode,
  message: string
): MessageReply<K> {
  return {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id,
    ok: false,
    error: {
      code,
      message,
    },
  };
}
