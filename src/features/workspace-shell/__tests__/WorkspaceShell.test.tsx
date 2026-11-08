/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/__tests__/WorkspaceShell.test.tsx
 * Responsabilidade: Testes de comportamento observável do WorkspaceShell e WorkspaceContent.
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { WorkspaceContent } from '../components/WorkspaceContent';

describe('WorkspaceShell', () => {
  it('deve renderizar a estrutura completa com cabeçalho, navegação e conteúdo', () => {
    const html = renderToString(
      <WorkspaceShell
        navigation={
          <nav aria-label="Ferramentas">
            <span>Navegação de teste</span>
          </nav>
        }
      >
        <p>Conteúdo de teste da ferramenta</p>
      </WorkspaceShell>
    );

    // 1. Verifica apresentação da identidade do produto no cabeçalho
    expect(html).toContain('ExtensionTools');
    expect(html).toContain('Workspace de Ferramentas');
    expect(html).toContain('role="banner"');

    // 2. Verifica presença da região de navegação fornecida externamente
    expect(html).toContain('aria-label="Ferramentas"');
    expect(html).toContain('Navegação de teste');

    // 3. Verifica apresentação do conteúdo principal
    expect(html).toContain('id="workspace-content"');
    expect(html).toContain('Conteúdo de teste da ferramenta');
  });

  it('deve manter independência entre as regiões de navegação e conteúdo', () => {
    const html = renderToString(
      <WorkspaceShell navigation={<div data-testid="nav-region">Menu A</div>}>
        <div data-testid="content-region">Área de Trabalho B</div>
      </WorkspaceShell>
    );

    expect(html).toContain('Menu A');
    expect(html).toContain('Área de Trabalho B');
    expect(html).toContain('data-testid="workspace-shell"');
  });
});

describe('WorkspaceContent', () => {
  it('deve renderizar o elemento semântico main e acolher qualquer children React', () => {
    const html = renderToString(
      <WorkspaceContent>
        <article>
          <h2>Documento de Teste</h2>
          <p>Corpo do conteúdo injetado</p>
        </article>
      </WorkspaceContent>
    );

    expect(html).toContain('<main id="workspace-content"');
    expect(html).toContain('Documento de Teste');
    expect(html).toContain('Corpo do conteúdo injetado');
  });
});
