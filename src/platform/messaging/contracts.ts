/**
 * ExtensionTools — Platform Messaging Contracts
 *
 * Contratos compartilhados entre contextos da extensão.
 *
 * Este módulo não executa transporte, persistência,
 * validação em runtime ou operações de plataforma.
 */

// --------------------------------------------------
// 1. Identidade do protocolo
// --------------------------------------------------

export const MESSAGE_PROTOCOL = 'extensiontools.messaging' as const;

export const MESSAGE_VERSION = 1 as const;

// --------------------------------------------------
// 2. Catálogo de operações
// --------------------------------------------------

export interface MessagingOperations {
  'platform.ping': {
    request: {
      probe: string;
    };

    response: {
      alive: true;
      echo: string;
    };
  };
}

// --------------------------------------------------
// 3. Tipos derivados das operações
// --------------------------------------------------

export type MessageType = keyof MessagingOperations;

export type RequestData<K extends MessageType> = MessagingOperations[K]['request'];

export type ResponseData<K extends MessageType> = MessagingOperations[K]['response'];

// --------------------------------------------------
// 4. Envelope de solicitação
// --------------------------------------------------

export interface RequestMessage<K extends MessageType> {
  protocol: typeof MESSAGE_PROTOCOL;

  version: typeof MESSAGE_VERSION;

  id: string;

  type: K;

  payload: RequestData<K>;
}

// União de todas as solicitações registradas.

export type AnyRequest = {
  [K in MessageType]: RequestMessage<K>;
}[MessageType];

// --------------------------------------------------
// 5. Contratos de erro
// --------------------------------------------------

export type MessageErrorCode =
  | 'INVALID_REQUEST'
  | 'UNKNOWN_OPERATION'
  | 'UNAUTHORIZED'
  | 'HANDLER_FAILED'
  | 'TRANSPORT_FAILURE'
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE';

export interface MessageError {
  code: MessageErrorCode;
  message: string;
}

// --------------------------------------------------
// 6. Envelope de resposta
// --------------------------------------------------

export type MessageReply<K extends MessageType> =
  | {
      protocol: typeof MESSAGE_PROTOCOL;
      version: typeof MESSAGE_VERSION;
      id: string;
      ok: true;
      payload: ResponseData<K>;
    }
  | {
      protocol: typeof MESSAGE_PROTOCOL;
      version: typeof MESSAGE_VERSION;
      id: string;
      ok: false;
      error: MessageError;
    };

// --------------------------------------------------
// 7. Resultado consumido pela aplicação
// --------------------------------------------------

export type MessageResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: MessageError;
    };
