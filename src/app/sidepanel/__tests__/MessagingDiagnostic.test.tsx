import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MessagingDiagnostic } from '../components/MessagingDiagnostic';
import type { PlatformHealthService } from '../services/platform-health-service';

describe('B3-F10 — MessagingDiagnostic UI Component', () => {
  it('renderiza o estado inicial Não verificado com botão e badge semântico', () => {
    const html = renderToString(<MessagingDiagnostic />);

    expect(html).toContain('Diagnóstico de Comunicação');
    expect(html).toContain('Plataforma de Mensageria');
    expect(html).toContain('Não verificado');
    expect(html).toContain('Verificar comunicação');
    expect(html).toContain('role="status"');
  });

  it('renderiza com serviço simulado sem lançar exceções', () => {
    const mockHealthService: PlatformHealthService = {
      check: vi.fn().mockResolvedValue({
        ok: true,
        value: { alive: true, echo: 'test-echo' },
      }),
    };

    const html = renderToString(<MessagingDiagnostic healthService={mockHealthService} />);

    expect(html).toContain('Plataforma de Mensageria');
    expect(html).toContain('Verificar comunicação');
  });
});
