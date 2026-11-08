/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/__tests__/RenderErrorBoundary.test.tsx
 * Responsabilidade: Testes de comportamento e contenção de falhas do RenderErrorBoundary.
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { RenderErrorBoundary } from '../components/RenderErrorBoundary';
import { WorkspaceShell } from '../components/WorkspaceShell';

describe('RenderErrorBoundary', () => {
  it('deve renderizar os componentes filhos normalmente quando não há falha', () => {
    const html = renderToString(
      <RenderErrorBoundary>
        <p>Conteúdo funcional da ferramenta</p>
      </RenderErrorBoundary>
    );

    expect(html).toContain('Conteúdo funcional da ferramenta');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('Não foi possível apresentar este conteúdo.');
  });

  it('deve atualizar o estado hasError para true via getDerivedStateFromError', () => {
    const derivedState = RenderErrorBoundary.getDerivedStateFromError();

    expect(derivedState).toEqual({ hasError: true });
  });

  it('deve apresentar a interface padrão de fallback com role="alert" ao detectar erro', () => {
    const boundary = new RenderErrorBoundary({
      children: <p>Filho protegido</p>,
    });

    // Simula transição para o estado de erro
    boundary.state = { hasError: true };

    const fallbackHtml = renderToString(boundary.render() as React.ReactElement);

    expect(fallbackHtml).toContain('role="alert"');
    expect(fallbackHtml).toContain('aria-live="assertive"');
    expect(fallbackHtml).toContain('Não foi possível apresentar este conteúdo.');
    expect(fallbackHtml).toContain('Ocorreu uma falha ao renderizar a ferramenta.');
    // Garante que o filho com falha não é mais renderizado
    expect(fallbackHtml).not.toContain('Filho protegido');
  });

  it('deve renderizar fallback customizado quando fornecido nas propriedades', () => {
    const customFallback = (
      <div role="alert" data-testid="custom-fallback">
        Falha customizada específica
      </div>
    );

    const boundary = new RenderErrorBoundary({
      children: <p>Filho protegido</p>,
      fallback: customFallback,
    });

    boundary.state = { hasError: true };

    const html = renderToString(boundary.render() as React.ReactElement);

    expect(html).toContain('data-testid="custom-fallback"');
    expect(html).toContain('Falha customizada específica');
    expect(html).not.toContain('Não foi possível apresentar este conteúdo.');
  });

  it('deve preservar o cabeçalho e a navegação quando a falha é contida na área de conteúdo', () => {
    const boundary = new RenderErrorBoundary({
      children: <p>Ferramenta com falha</p>,
    });
    boundary.state = { hasError: true };

    const fullShellHtml = renderToString(
      <WorkspaceShell
        navigation={
          <nav aria-label="Navegação">
            <span>Aba Ativa: Text Diff</span>
          </nav>
        }
      >
        {boundary.render()}
      </WorkspaceShell>
    );

    // 1. Preservação externa confirmada: cabeçalho e navegação continuam montados
    expect(fullShellHtml).toContain('ExtensionTools');
    expect(fullShellHtml).toContain('Aba Ativa: Text Diff');

    // 2. Contenção interna confirmada: fallback apresentado na área de conteúdo
    expect(fullShellHtml).toContain('role="alert"');
    expect(fullShellHtml).toContain('Não foi possível apresentar este conteúdo.');
    expect(fullShellHtml).not.toContain('Ferramenta com falha');
  });
});
