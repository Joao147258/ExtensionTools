/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging Background Listener
 *
 * Adaptador de entrada que conecta a API runtime.onMessage do navegador
 * ao Background Message Router.
 *
 * Responsabilidades:
 * - Registrar o listener em browser.runtime.onMessage.
 * - Reconhecer mensagens pertencentes ao protocolo via isProtocolMessage().
 * - Encaminhar mensagens reconhecidas e metadados de remetente (sender) ao roteador.
 * - Manter o canal aberto para resposta assíncrona retornando literalmente `true`.
 * - Ignorar mensagens alheias ao protocolo retornando `false`.
 * - Encapsular sendResponse garantindo chamada única e tolerância a canal fechado.
 * - Tratar rejeições do roteador retornando HANDLER_FAILED com erro controlado.
 * - Prevenir respostas concorrentes e reenvios indevidos.
 *
 * Limites e Invariantes:
 * - Não é função async no callback do onMessage (preserva MV3 spec).
 * - Não implementa regras de negócio ou lógica de operações de produto.
 * - Centraliza o recebimento de mensagens do protocolo na extensão.
 * ==============================================================================
 */

import { browser } from 'wxt/browser';
import type { MessageRoute, SenderInfo } from './background-router';
import { errorReply, publicErrorMessage } from './errors';
import { isProtocolMessage, readRequestId } from './validation';

/**
 * Registra o adaptador de recebimento de mensagens do Background conectado à rota especificada.
 *
 * @param route Função de roteamento produzida por createBackgroundRouter.
 * @returns Função para cancelar o registro do listener (útil para testes e encerramento limpo).
 */
export function registerBackgroundMessaging(route: MessageRoute): () => void {
  if (typeof route !== 'function') {
    throw new TypeError('route deve ser uma função de roteamento válida.');
  }

  const listener = (
    message: unknown,
    sender: SenderInfo,
    sendResponse: (response?: unknown) => void
  ): boolean => {
    // 1. Mensagens que não pertencem ao protocolo são ignoradas e não abrem canal assíncrono
    if (!isProtocolMessage(message)) {
      return false;
    }

    let hasResponded = false;

    const respond = (response: unknown): void => {
      if (hasResponded) {
        return;
      }
      hasResponded = true;

      try {
        sendResponse(response);
      } catch {
        // Canal de comunicação pode ter sido encerrado prematuramente pelo navegador
      }
    };

    // 2. Encaminhamento assíncrono para o roteador
    void Promise.resolve()
      .then(() => route(message, sender))
      .then(
        (reply) => {
          if (reply !== undefined) {
            respond(reply);
          } else {
            const id = readRequestId(message);
            if (id !== null) {
              respond(errorReply(id, 'HANDLER_FAILED', publicErrorMessage('HANDLER_FAILED')));
            }
          }
        },
        () => {
          const id = readRequestId(message);
          if (id !== null) {
            respond(errorReply(id, 'HANDLER_FAILED', publicErrorMessage('HANDLER_FAILED')));
          }
        }
      );

    // 3. Retorno literal true informa ao runtime que a resposta será enviada assincronamente via sendResponse
    return true;
  };

  browser.runtime.onMessage.addListener(listener);

  return () => {
    browser.runtime.onMessage.removeListener(listener);
  };
}
