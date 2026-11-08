/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging Browser Runtime Transport Adapter
 *
 * Adaptador concreto da porta MessageTransport para envio de mensagens
 * através da API runtime.sendMessage do navegador (via abstração WXT).
 *
 * Responsabilidade:
 * - Implementar a porta de saída MessageTransport (DIP).
 * - Encaminhar solicitações tipadas conformes ao protocolo (AnyRequest)
 *   utilizando browser.runtime.sendMessage().
 * - Retornar a Promise bruta como unknown, mantendo a fronteira de confiança
 *   (Zero-Trust) para validação posterior pela camada consumidora.
 * - Propagar rejeições originadas no mecanismo de transporte sem mascará-las.
 *
 * Limites e Não-Responsabilidades:
 * - Não valida conteúdo ou conformidade de envelopes (responsabilidade de validation.ts / client).
 * - Não interpreta códigos de erro de protocolo (MessageErrorCode).
 * - Não implementa retry, timeout, caching ou fallback de rede.
 * - Não gerencia estado de conexões de longa duração (runtime.connect).
 * ==============================================================================
 */

import { browser } from 'wxt/browser';
import type { AnyRequest } from './contracts';
import type { MessageTransport } from './transport';

/**
 * Adaptador concreto do MessageTransport.
 *
 * Encaminha solicitações utilizando o Runtime Messaging do navegador.
 *
 * Não interpreta operações nem valida as respostas recebidas.
 */
export class BrowserRuntimeTransport implements MessageTransport {
  send(request: AnyRequest): Promise<unknown> {
    return browser.runtime.sendMessage(request);
  }
}
