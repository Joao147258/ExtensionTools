/**
 * ==============================================================================
 * ExtensionTools — Messaging Diagnostic Component
 *
 * Componente apresentacional de diagnóstico para verificação interativa
 * da comunicação tipada entre o Side Panel e o Background Service Worker.
 *
 * Responsabilidades:
 * - Acionar a verificação de saúde através do PlatformHealthService.
 * - Gerenciar os estados de execução: Não verificado, Verificando, Sucesso e Falha.
 * - Impedir disparos concorrentes ou repetidos durante a execução.
 * - Apresentar feedback visual acessível e semântico reutilizando componentes do Bloco 2.
 *
 * Limites e Não-Responsabilidades:
 * - Não importa nem chama browser.* ou Chromium APIs.
 * - Não monta envelopes nem gera IDs de correlação.
 * - Não realiza validação de transporte ou parsing de protocolo diretamente.
 * ==============================================================================
 */

import { useState } from 'react';
import { Badge, Button, Panel, type BadgeTone } from '../../../shared/ui';
import {
  platformHealthService,
  type PlatformHealthService,
} from '../services/platform-health-service';

export interface MessagingDiagnosticProps {
  /**
   * Serviço de diagnóstico opcional (para injeção de dependência em testes).
   */
  healthService?: PlatformHealthService;
}

/**
 * Painel de diagnóstico de comunicação para o Side Panel.
 */
export function MessagingDiagnostic({
  healthService = platformHealthService,
}: MessagingDiagnosticProps) {
  const [statusText, setStatusText] = useState('Não verificado');
  const [tone, setTone] = useState<BadgeTone>('neutral');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheck() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setStatusText('Verificando...');
    setTone('warning');

    try {
      const result = await healthService.check('sidepanel-probe');

      if (!result.ok) {
        setTone('danger');
        setStatusText(`Falha: ${result.error.code}`);
        return;
      }

      setTone('success');
      setStatusText(`Comunicação confirmada: ${result.value.echo}`);
    } catch {
      setTone('danger');
      setStatusText('Falha: Erro inesperado na comunicação.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Panel
      as="section"
      aria-label="Diagnóstico de Comunicação"
      surface="secondary"
      padding="sm"
      className="mt-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border-default text-left shadow-xs"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Plataforma de Mensageria
        </h3>
        <Badge tone={tone}>{statusText}</Badge>
      </div>

      <p role="status" aria-live="polite" className="text-xs text-text-secondary">
        Status: <span className="font-medium text-text-primary">{statusText}</span>
      </p>

      <div>
        <Button
          variant="secondary"
          visualSize="sm"
          loading={isLoading}
          disabled={isLoading}
          onClick={handleCheck}
        >
          {isLoading ? 'Verificando...' : 'Verificar comunicação'}
        </Button>
      </div>
    </Panel>
  );
}
