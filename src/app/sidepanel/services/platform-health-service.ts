/**
 * ==============================================================================
 * ExtensionTools — Platform Health Service (Side Panel Application Service)
 *
 * Serviço de aplicação do Side Panel responsável por operações de diagnóstico
 * e verificação de integridade da comunicação com o Background Service Worker.
 *
 * Responsabilidades:
 * - Expor operações de alto nível para os componentes de interface (ex: check()).
 * - Encapsular o MessagingClient e o adaptador de transporte BrowserRuntimeTransport.
 * - Isolar o React de detalhes de protocolo, geração de IDs, envelopes e timeouts.
 *
 * Limites e Não-Responsabilidades:
 * - Não importa nem executa diretamente chamadas de browser.* na UI.
 * - Não expõe exceções não tratadas à camada de apresentação.
 * ==============================================================================
 */

import { BrowserRuntimeTransport } from '../../../platform/messaging/browser-runtime-transport';
import { MessagingClient } from '../../../platform/messaging/messaging-client';
import type { MessageResult, ResponseData } from '../../../platform/messaging/contracts';

/**
 * Interface do serviço de diagnóstico e integridade de mensageria da plataforma.
 */
export interface PlatformHealthService {
  check(probe?: string): Promise<MessageResult<ResponseData<'platform.ping'>>>;
}

/**
 * Fábrica para criação do PlatformHealthService com injeção de dependência opcional.
 *
 * @param client Instância opcional de MessagingClient (útil para testes unitários com mocks).
 * @returns Instância configurada de PlatformHealthService.
 */
export function createPlatformHealthService(client?: MessagingClient): PlatformHealthService {
  const messaging = client ?? new MessagingClient(new BrowserRuntimeTransport());

  return {
    check(probe = 'sidepanel'): Promise<MessageResult<ResponseData<'platform.ping'>>> {
      return messaging.request('platform.ping', { probe });
    },
  };
}

/**
 * Instância padrão compartilhada do serviço de diagnóstico de plataforma no Side Panel.
 */
export const platformHealthService: PlatformHealthService = createPlatformHealthService();
