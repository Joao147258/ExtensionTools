/**
 * ==============================================================================
 * ExtensionTools — Platform Messaging Transport Port
 *
 * Porta de saída (Output Port) para o mecanismo de transporte de mensagens
 * entre diferentes contextos de execução (Side Panel, Background, etc.).
 *
 * Responsabilidade:
 * - Definir a interface MessageTransport para desacoplar consumidores
 *   de implementações concretas ou APIs específicas do navegador (DIP).
 * - Receber solicitações tipadas conformes ao protocolo (AnyRequest).
 * - Retornar respostas assíncronas brutas tipadas como unknown, preservando
 *   a fronteira de confiança (Zero-Trust) para validação posterior.
 *
 * Limites e Não-Responsabilidades:
 * - Não implementa adaptadores concretos (e.g. Chromium runtime messaging).
 * - Não realiza validação de runtime ou interpretação de protocolo.
 * - Não classifica ou transforma exceções e erros.
 * - Não implementa timeout, retry ou observabilidade.
 * ==============================================================================
 */

import type { AnyRequest } from './contracts';

/**
 * Porta de saída para transporte de mensagens.
 *
 * Define a capacidade de enviar solicitações
 * sem depender de APIs específicas do navegador.
 *
 * Responsabilidades:
 * - Receber uma solicitação tipada.
 * - Disponibilizar uma operação assíncrona.
 * - Retornar o resultado bruto como unknown.
 *
 * Não é responsável por:
 * - Validar respostas.
 * - Classificar falhas.
 * - Implementar timeout ou retry.
 * - Interpretar resultados do protocolo.
 */
export interface MessageTransport {
  send(request: AnyRequest): Promise<unknown>;
}
