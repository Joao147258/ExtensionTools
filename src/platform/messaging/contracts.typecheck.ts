/**
 * ExtensionTools — Platform Messaging Typecheck Tests
 *
 * Verificações estáticas e testes de tipos (positivos e negativos)
 * para os contratos de mensageria da plataforma.
 *
 * Este arquivo é verificado durante o typecheck (`tsc --noEmit`).
 * As diretivas `@ts-expect-error` atestam que infrações aos contratos
 * são rejeitadas em tempo de compilação.
 */

import {
  MESSAGE_PROTOCOL,
  MESSAGE_VERSION,
  type MessagingOperations,
  type MessageType,
  type RequestData,
  type ResponseData,
  type RequestMessage,
  type AnyRequest,
  type MessageErrorCode,
  type MessageError,
  type MessageReply,
  type MessageResult,
} from './contracts';

// =============================================================================
// 1. Verificações de Identidade do Protocolo
// =============================================================================

export function typecheckProtocolIdentity(): void {
  const protocol: typeof MESSAGE_PROTOCOL = MESSAGE_PROTOCOL;
  const version: typeof MESSAGE_VERSION = MESSAGE_VERSION;

  // @ts-expect-error Protocolo deve ser exatamente o literal "extensiontools.messaging"
  const _invalidProtocol: typeof MESSAGE_PROTOCOL = 'other.messaging';

  // @ts-expect-error Versão deve ser exatamente o número literal 1
  const _invalidVersion: typeof MESSAGE_VERSION = 2;

  void protocol;
  void version;
}

// =============================================================================
// 2. Verificações de MessageType e Catálogo de Operações
// =============================================================================

export function typecheckOperations(): void {
  // Operação válida registrada
  const validOp: MessageType = 'platform.ping';

  // @ts-expect-error Operação desconhecida não deve ser aceita
  const _unknownOp: MessageType = 'workspace.list';

  // @ts-expect-error Operação desconhecida arbitrária
  const _invalidOp: MessageType = 'file.write';

  void validOp;
}

// =============================================================================
// 3. Verificações de RequestData e ResponseData
// =============================================================================

export function typecheckPayloads(): void {
  // RequestData válido para platform.ping
  const validRequestData: RequestData<'platform.ping'> = {
    probe: 'sidepanel',
  };

  const _invalidRequestDataNumber: RequestData<'platform.ping'> = {
    // @ts-expect-error Payload de entrada inválido: probe deve ser string
    probe: 123,
  };

  // @ts-expect-error Payload de entrada inválido: propriedade ausente
  const _missingRequestData: RequestData<'platform.ping'> = {};

  // ResponseData válido para platform.ping
  const validResponseData: ResponseData<'platform.ping'> = {
    alive: true,
    echo: 'sidepanel',
  };

  const _invalidResponseAliveFalse: ResponseData<'platform.ping'> = {
    // @ts-expect-error ResponseData inválido: alive deve ser true literal, não false
    alive: false,
    echo: 'sidepanel',
  };

  const _invalidResponseEcho: ResponseData<'platform.ping'> = {
    alive: true,
    // @ts-expect-error ResponseData inválido: echo deve ser string
    echo: 123,
  };

  void validRequestData;
  void validResponseData;
  void _invalidRequestDataNumber;
  void _invalidResponseAliveFalse;
  void _invalidResponseEcho;
}

// =============================================================================
// 4. Verificações de RequestMessage e AnyRequest
// =============================================================================

export function typecheckRequestEnvelope(): void {
  // Envelope válido
  const validRequest: RequestMessage<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-001',
    type: 'platform.ping',
    payload: {
      probe: 'sidepanel',
    },
  };

  const _invalidReqProto: RequestMessage<'platform.ping'> = {
    // @ts-expect-error Envelope com protocolo incorreto
    protocol: 'invalid',
    version: MESSAGE_VERSION,
    id: 'req-002',
    type: 'platform.ping',
    payload: { probe: 'test' },
  };

  const _invalidReqVer: RequestMessage<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    // @ts-expect-error Envelope com versão incorreta
    version: 2,
    id: 'req-003',
    type: 'platform.ping',
    payload: { probe: 'test' },
  };

  const _invalidReqPayload: RequestMessage<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-004',
    type: 'platform.ping',
    payload: {
      // @ts-expect-error Envelope com payload incompatível
      probe: false,
    },
  };

  void validRequest;
  void _invalidReqProto;
  void _invalidReqVer;
  void _invalidReqPayload;
}

export function typecheckAnyRequestDiscrimination(request: AnyRequest): string | undefined {
  // Discriminação por type conforme E05 da especificação
  if (request.type === 'platform.ping') {
    const probe: string = request.payload.probe;
    return probe;
  }
  return undefined;
}

// =============================================================================
// 5. Verificações de MessageError e MessageErrorCode
// =============================================================================

export function typecheckErrors(): void {
  const validErrorCodes: MessageErrorCode[] = [
    'INVALID_REQUEST',
    'UNKNOWN_OPERATION',
    'UNAUTHORIZED',
    'HANDLER_FAILED',
    'TRANSPORT_FAILURE',
    'UNAVAILABLE',
    'TIMEOUT',
    'INVALID_RESPONSE',
  ];

  const validError: MessageError = {
    code: 'UNAVAILABLE',
    message: 'Serviço temporariamente indisponível.',
  };

  // @ts-expect-error Código de erro desconhecido
  const _invalidErrorCode: MessageErrorCode = 'CUSTOM_ERROR';

  const _invalidError: MessageError = {
    // @ts-expect-error MessageError com código inválido
    code: 'NOT_FOUND',
    message: 'Não encontrado.',
  };

  void validErrorCodes;
  void validError;
  void _invalidError;
}

// =============================================================================
// 6. Verificações de MessageReply (Discriminated Union)
// =============================================================================

export function typecheckMessageReply(): void {
  // Sucesso válido
  const successReply: MessageReply<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-001',
    ok: true,
    payload: {
      alive: true,
      echo: 'test',
    },
  };

  // Falha válida
  const failureReply: MessageReply<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-001',
    ok: false,
    error: {
      code: 'HANDLER_FAILED',
      message: 'Falha interna.',
    },
  };

  const _invalidReplyAlive: MessageReply<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-001',
    ok: true,
    payload: {
      // @ts-expect-error Resposta de sucesso não aceita alive: false
      alive: false,
      echo: 'test',
    },
  };

  const _invalidFailureWithPayload: MessageReply<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-001',
    ok: false,
    error: {
      code: 'HANDLER_FAILED',
      message: 'Erro',
    },
    // @ts-expect-error Resposta ok: false não aceita payload
    payload: {
      alive: true,
      echo: 'test',
    },
  };

  // @ts-expect-error Resposta ok: true sem payload
  const _missingPayloadSuccess: MessageReply<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-001',
    ok: true,
  };

  // @ts-expect-error Resposta ok: false sem error
  const _missingErrorFailure: MessageReply<'platform.ping'> = {
    protocol: MESSAGE_PROTOCOL,
    version: MESSAGE_VERSION,
    id: 'req-001',
    ok: false,
  };

  void successReply;
  void failureReply;
  void _invalidReplyAlive;
  void _invalidFailureWithPayload;
}

export function typecheckReplyDiscrimination(reply: MessageReply<'platform.ping'>): string {
  if (reply.ok) {
    // TypeScript garante acesso a payload e propriedades específicas
    return reply.payload.echo;
  } else {
    // TypeScript garante acesso a error e suas propriedades
    return reply.error.code;
  }
}

// =============================================================================
// 7. Verificações de MessageResult
// =============================================================================

export function typecheckMessageResult(): void {
  const successResult: MessageResult<{ alive: true; echo: string }> = {
    ok: true,
    value: {
      alive: true,
      echo: 'test',
    },
  };

  const failureResult: MessageResult<{ alive: true; echo: string }> = {
    ok: false,
    error: {
      code: 'TIMEOUT',
      message: 'Tempo esgotado.',
    },
  };

  // @ts-expect-error ok: true sem value
  const _invalidMissingValue: MessageResult<string> = {
    ok: true,
  };

  // @ts-expect-error ok: false sem error
  const _invalidMissingError: MessageResult<string> = {
    ok: false,
  };

  void successResult;
  void failureResult;
}

export function typecheckResultDiscrimination<T>(result: MessageResult<T>): T | string {
  if (result.ok) {
    return result.value;
  }
  return result.error.message;
}

// =============================================================================
// 8. Garantia de Independência de Framework e Navegador
// =============================================================================

export function typecheckIndependence(): void {
  // Garante que MessagingOperations não carrega tipos de terceiros
  type PingOp = MessagingOperations['platform.ping'];
  type Req = PingOp['request'];
  type Res = PingOp['response'];

  const _req: Req = { probe: 'test' };
  const _res: Res = { alive: true, echo: 'test' };

  void _req;
  void _res;
}
