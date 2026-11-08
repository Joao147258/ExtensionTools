/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging Background Router
 *
 * Roteador de mensagens no Background Service Worker.
 *
 * Responsabilidades:
 * - Reconhecer mensagens pertencentes ao protocolo (isProtocolMessage).
 * - Extrair de forma segura o ID de correlação (readRequestId).
 * - Aplicar política de autorização de remetente (SenderInfo).
 * - Diferenciar operações desconhecidas de requisições estruturalmente inválidas.
 * - Validar requisições antes do encaminhamento a handlers (isRequestMessage).
 * - Despachar operações para handlers especializados por injeção de dependência.
 * - Validar respostas produzidas por handlers (isReplyFor).
 * - Construir envelopes de resposta compatíveis com o protocolo.
 * - Tratar exceções de handlers convertendo-as em erros públicos controlados (HANDLER_FAILED).
 *
 * Invariantes e Limites:
 * - Totalmente isolado de APIs do navegador (browser.* / chrome.*).
 * - Não executa handlers caso a autorização ou validação falhem.
 * - Não inventa identificadores quando ausentes ou inválidos.
 * - Retorna undefined para mensagens que não pertençam ao protocolo ou não possuam correlação segura.
 * ==============================================================================
 */

import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type RequestData,
  type ResponseData,
} from './contracts';
import { errorReply, publicErrorMessage } from './errors';
import {
  isKnownMessageType,
  isProtocolMessage,
  isRecord,
  isReplyFor,
  isRequestMessage,
  readRequestId,
} from './validation';

/**
 * Informações confiáveis do remetente fornecidas pelo mecanismo do navegador.
 */
export interface SenderInfo {
  id?: string;
  tab?: unknown;
}

/**
 * Contrato de handlers executados no Background Service Worker.
 */
export interface BackgroundHandlers {
  ping(payload: RequestData<'platform.ping'>): Promise<ResponseData<'platform.ping'>>;
}

/**
 * Função de roteamento produzida pela fábrica createBackgroundRouter.
 */
export type MessageRoute = (raw: unknown, sender: SenderInfo) => Promise<unknown | undefined>;

/**
 * Fábrica do Background Message Router.
 *
 * @param extensionId Identificador oficial da extensão (ex: browser.runtime.id).
 * @param handlers Handlers responsáveis pelas operações do protocolo.
 * @returns Função assíncrona de roteamento.
 */
export function createBackgroundRouter(
  extensionId: string,
  handlers: BackgroundHandlers
): MessageRoute {
  if (typeof extensionId !== 'string' || extensionId.trim().length === 0) {
    throw new TypeError('extensionId deve ser uma string não-vazia.');
  }

  if (!handlers || typeof handlers.ping !== 'function') {
    throw new TypeError('handlers deve conter a implementação de ping.');
  }

  return async (raw: unknown, sender: SenderInfo): Promise<unknown | undefined> => {
    // 1. Mensagens que não pertencem ao protocolo são ignoradas
    if (!isProtocolMessage(raw)) {
      return undefined;
    }

    // 2. Extração segura do ID de correlação
    const id = readRequestId(raw);
    if (id === null) {
      // Sem um ID válido, não é possível construir um envelope de resposta correlacionado
      return undefined;
    }

    // 3. Verificação de autorização do remetente
    // Política inicial: deve pertencer à própria extensão e não ter origem em abas (content scripts)
    if (sender.id !== extensionId || sender.tab != null) {
      return errorReply(id, 'UNAUTHORIZED', publicErrorMessage('UNAUTHORIZED'));
    }

    // 4. Identificação de operação desconhecida
    const rawType = isRecord(raw) ? raw.type : undefined;
    if (!isKnownMessageType(rawType)) {
      return errorReply(id, 'UNKNOWN_OPERATION', publicErrorMessage('UNKNOWN_OPERATION'));
    }

    // 5. Validação estrutural da solicitação
    if (!isRequestMessage(raw)) {
      return errorReply(id, 'INVALID_REQUEST', publicErrorMessage('INVALID_REQUEST'));
    }

    // 6. Execução controlada do handler
    try {
      switch (raw.type) {
        case 'platform.ping': {
          const payload = await handlers.ping(raw.payload);

          const reply = {
            protocol: MESSAGE_PROTOCOL,
            version: MESSAGE_VERSION,
            id: raw.id,
            ok: true as const,
            payload,
          };

          if (!isReplyFor(reply, raw.type, raw.id)) {
            return errorReply(raw.id, 'HANDLER_FAILED', publicErrorMessage('HANDLER_FAILED'));
          }

          return reply;
        }

        default:
          return errorReply(raw.id, 'UNKNOWN_OPERATION', publicErrorMessage('UNKNOWN_OPERATION'));
      }
    } catch {
      return errorReply(raw.id, 'HANDLER_FAILED', publicErrorMessage('HANDLER_FAILED'));
    }
  };
}
