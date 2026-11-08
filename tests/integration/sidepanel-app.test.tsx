/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: tests/integration/sidepanel-app.test.tsx
 * Responsabilidade: Teste de integração da composição do Side Panel com ToolNavigation (App.tsx).
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from '../../src/entrypoints/sidepanel/App';

describe('Integração do Side Panel — App com ToolNavigation', () => {
  it('deve montar a árvore completa com WorkspaceShell, ToolNavigation integrada e placeholder ativo', () => {
    const html = renderToString(<App />);

    // 1. Identidade visual permanente do cabeçalho
    expect(html).toContain('ExtensionTools');
    expect(html).toContain('Workspace de Ferramentas');

    // 2. Barra de navegação com os destinos canônicos do catálogo
    expect(html).toContain('<nav aria-label="Ferramentas"');
    expect(html).toContain('Text Diff');
    expect(html).toContain('JSON Inspector');
    expect(html).toContain('XML Inspector');
    expect(html).toContain('Markdown');
    expect(html).toContain('Quick Files');

    // 3. Ferramenta ativa inicial identificada com aria-current="page"
    expect(html).toMatch(/aria-current="page"[^>]*>[\s\S]*?Text Diff/);

    // 4. Destino planejado com estado disabled
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Quick Files/);

    // 5. Área de conteúdo protegida por Error Boundary renderizando o placeholder da ferramenta ativa
    expect(html).toContain('id="workspace-content"');
    expect(html).toContain('Comparação visual e análise de diferenças entre textos.');
    expect(html).toContain('Funcionalidade piloto em desenvolvimento (M4).');
  });
});
