/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging Client
 *
 * Coordenador de solicitações de mensageria da plataforma para consumidores
 * do protocolo (Side Panel, UI, etc.).
 *
 * Responsabilidades:
 * - Construir envelopes padronizados RequestMessage<K>.
 * - Gerar identificadores de correlação (injetável para determinismo).
 * - Validar solicitações antes do transporte via isRequestMessage().
 * - Encaminhar envelopes através da abstração MessageTransport (DIP).
 * - Aplicar timeout local configurável via Promise.race().
 * - Validar respostas recebidas via isReplyFor().
 * - Garantir a correlação unívoca entre solicitação e resposta.
 * - Converter envelopes validados em MessageResult<T>.
 * - Converter rejeições e timeouts em erros públicos controlados (MessageResult<never>).
 *
 * Invariantes e Limites:
 * - Não importa nem depende de browser.* ou Chromium APIs.
 * - Não executa as operações solicitadas (responsabilidade do Background).
 * - Não implementa retry automático nem cancelamento remoto.
 * - O timeout limita apenas a espera local do cliente.
 * ==============================================================================
 */

import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type AnyRequest,
  type MessageResult,
  type MessageType,
  type RequestData,
  type RequestMessage,
  type ResponseData,
} from './contracts';
import { failure, publicErrorMessage } from './errors';
import type { MessageTransport } from './transport';
import { isReplyFor, isRequestMessage } from './validation';

/**
 * Erro interno utilizado exclusivamente para sinalizar expiração do timeout local.
 */
export class RequestTimeoutError extends Error {
  constructor(message = 'A operação excedeu o tempo de espera local.') {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Cliente de mensageria tipado da plataforma ExtensionTools.
 */
export class MessagingClient {
  private readonly timeoutMs: number;
  private readonly newId: () => string;

  /**
   * Inicializa o cliente de mensageria com injeção de dependências.
   *
   * @param transport Implementação da porta MessageTransport.
   * @param timeoutMs Tempo limite de espera local em milissegundos (padrão: 5000).
   * @param newId Gerador de identificadores de correlação (padrão: crypto.randomUUID).
   */
  constructor(
    private readonly transport: MessageTransport,
    timeoutMs = 5000,
    newId: () => string = () => crypto.randomUUID()
  ) {
    if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new TypeError('timeoutMs deve ser um número finito positivo.');
    }

    if (typeof newId !== 'function') {
      throw new TypeError('newId deve ser uma função geradora de identificadores.');
    }

    this.timeoutMs = timeoutMs;
    this.newId = newId;
  }

  /**
   * Executa uma solicitação fortemente tipada ao Background Service Worker.
   *
   * @param type Identificador da operação registrada no catálogo.
   * @param payload Dados da solicitação conformes ao catálogo.
   * @returns Resultado padronizado MessageResult contendo o payload validado ou erro controlado.
   */
  async request<K extends MessageType>(
    type: K,
    payload: RequestData<K>
  ): Promise<MessageResult<ResponseData<K>>> {
    const id = this.newId();

    const message: RequestMessage<K> = {
      protocol: MESSAGE_PROTOCOL,
      version: MESSAGE_VERSION,
      id,
      type,
      payload,
    };

    if (!isRequestMessage(message)) {
      return failure('INVALID_REQUEST', publicErrorMessage('INVALID_REQUEST'));
    }

    let rawReply: unknown;

    try {
      rawReply = await this.sendWithTimeout(message);
    } catch (error: unknown) {
      if (error instanceof RequestTimeoutError) {
        return failure('TIMEOUT', publicErrorMessage('TIMEOUT'));
      }

      return failure('TRANSPORT_FAILURE', publicErrorMessage('TRANSPORT_FAILURE'));
    }

    if (!isReplyFor(rawReply, type, id)) {
      return failure('INVALID_RESPONSE', publicErrorMessage('INVALID_RESPONSE'));
    }

    if (!rawReply.ok) {
      return {
        ok: false,
        error: rawReply.error,
      };
    }

    return {
      ok: true,
      value: rawReply.payload,
    };
  }

  /**
   * Envia o envelope através do transporte aplicando a barreira de timeout local.
   *
   * @param message Envelope de solicitação a ser transmitido.
   * @returns Resposta bruta retornada pelo transporte.
   */
  private async sendWithTimeout(message: AnyRequest): Promise<unknown> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        this.transport.send(message),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new RequestTimeoutError());
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
}
