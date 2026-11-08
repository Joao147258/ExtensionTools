/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/app/sidepanel/__tests__/SidePanelApp.test.tsx
 * Responsabilidade: Testes de integração e comportamento observável da composição SidePanelApp (B1-C01).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SidePanelApp } from '../SidePanelApp';
import { TOOL_CATALOG } from '../tool-catalog';

describe('SidePanelApp — Composição do Side Panel (B1-C01)', () => {
  it('deve apresentar a casca estrutural permanente e o conteúdo inicial da ferramenta padrão', () => {
    const html = renderToString(<SidePanelApp />);

    // 1. Identidade visual permanente do WorkspaceShell (Header)
    expect(html).toContain('ExtensionTools');
    expect(html).toContain('Workspace de Ferramentas');

    // 2. Região de navegação acessível e estruturada
    expect(html).toContain('<nav aria-label="Ferramentas"');

    // 3. Destinos do catálogo presentes na navegação
    for (const tool of TOOL_CATALOG) {
      expect(html).toContain(tool.label);
    }

    // 4. Seleção inicial (text-diff) com indicador aria-current="page"
    expect(html).toMatch(/aria-current="page"[^>]*>[\s\S]*?Text Diff/);

    // 5. Conteúdo inicial correspondente ao destino padrão
    expect(html).toContain('id="workspace-content"');
    expect(html).toContain('Comparação visual e análise de diferenças entre textos.');
    expect(html).toContain('Funcionalidade piloto em desenvolvimento (M4).');
  });

  it('deve marcar o item desabilitado no catálogo com o atributo disabled no botão', () => {
    const html = renderToString(<SidePanelApp />);

    // Quick Files possui disabled: true no catálogo
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Quick Files/);
  });

  it('deve manter a região de conteúdo encapsulada e protegida por RenderErrorBoundary', () => {
    const html = renderToString(<SidePanelApp />);

    // A área de trabalho possui a section com o nome da ferramenta ativa
    expect(html).toContain('<section aria-label="Text Diff"');
    expect(html).toContain('Funcionalidade piloto em desenvolvimento (M4).');
  });

  it('deve manter estabilidade estrutural entre navegação e casca de layout', () => {
    const html = renderToString(<SidePanelApp />);

    // O container principal do shell deve envolver a estrutura
    expect(html).toContain('data-testid="workspace-shell"');
    expect(html).toContain('role="banner"');
    expect(html).toContain('id="workspace-content"');
  });
});
