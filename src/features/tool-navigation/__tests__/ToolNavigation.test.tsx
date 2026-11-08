/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/tool-navigation/__tests__/ToolNavigation.test.tsx
 * Responsabilidade: Testes unitários e comportamentais da feature Tool Navigation (B1-F02).
 * ==============================================================================
 */

import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ToolNavigation } from '../components/ToolNavigation';
import { NavigationItem } from '../components/NavigationItem';
import type { NavigationDestination } from '../navigation.types';

const MOCK_TOOLS: readonly NavigationDestination[] = [
  {
    id: 'tool-a',
    label: 'Ferramenta A',
    description: 'Descrição detalhada da Ferramenta A',
  },
  {
    id: 'tool-b',
    label: 'Ferramenta B',
  },
  {
    id: 'tool-c',
    label: 'Ferramenta C',
    disabled: true,
  },
];

describe('ToolNavigation — Renderização e Acessibilidade', () => {
  it('deve renderizar os destinos recebidos com semântica nav e aria-label', () => {
    const html = renderToString(
      <ToolNavigation tools={MOCK_TOOLS} activeToolId={null} onSelectTool={vi.fn()} />
    );

    // 1. Semântica da região de navegação
    expect(html).toContain('<nav aria-label="Ferramentas"');

    // 2. Destinos renderizados
    expect(html).toContain('Ferramenta A');
    expect(html).toContain('Ferramenta B');
    expect(html).toContain('Ferramenta C');

    // 3. Destino inativo não deve ter aria-current="page"
    expect(html).not.toContain('aria-current="page"');
  });

  it('deve identificar semanticamente e visualmente o destino ativo com aria-current="page"', () => {
    const html = renderToString(
      <ToolNavigation tools={MOCK_TOOLS} activeToolId="tool-a" onSelectTool={vi.fn()} />
    );

    expect(html).toContain('aria-current="page"');
    // Indicador visual de acento de marca presente no item ativo
    expect(html).toContain('bg-[#DF2531]');
  });

  it('deve renderizar o estado de lista vazia com mensagem adequada', () => {
    const html = renderToString(
      <ToolNavigation tools={[]} activeToolId={null} onSelectTool={vi.fn()} />
    );

    expect(html).toContain('Nenhuma ferramenta disponível.');
    expect(html).not.toContain('<ul');
  });

  it('deve renderizar o atributo disabled no botão do destino desabilitado', () => {
    const html = renderToString(
      <ToolNavigation tools={MOCK_TOOLS} activeToolId="tool-a" onSelectTool={vi.fn()} />
    );

    // Ferramenta C possui disabled: true
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Ferramenta C/);
  });

  it('deve suportar orientação vertical e horizontal adequadamente', () => {
    const htmlVertical = renderToString(
      <ToolNavigation
        tools={MOCK_TOOLS}
        activeToolId="tool-a"
        onSelectTool={vi.fn()}
        orientation="vertical"
      />
    );
    expect(htmlVertical).toContain('flex-col');
    expect(htmlVertical).toContain('Descrição detalhada da Ferramenta A');

    const htmlHorizontal = renderToString(
      <ToolNavigation
        tools={MOCK_TOOLS}
        activeToolId="tool-a"
        onSelectTool={vi.fn()}
        orientation="horizontal"
      />
    );
    expect(htmlHorizontal).toContain('overflow-x-auto');
  });
});

describe('ToolNavigation — Comportamento Controlado e Seleção', () => {
  it('deve refletir imediatamente alterações externas da propriedade activeToolId', () => {
    // Render 1 com tool-a ativo
    const htmlState1 = renderToString(
      <ToolNavigation tools={MOCK_TOOLS} activeToolId="tool-a" onSelectTool={vi.fn()} />
    );
    expect(htmlState1).toMatch(/aria-current="page"[^>]*>[\s\S]*?Ferramenta A/);

    // Render 2 com tool-b ativo
    const htmlState2 = renderToString(
      <ToolNavigation tools={MOCK_TOOLS} activeToolId="tool-b" onSelectTool={vi.fn()} />
    );
    expect(htmlState2).toMatch(/aria-current="page"[^>]*>[\s\S]*?Ferramenta B/);
    expect(htmlState2).not.toMatch(/aria-current="page"[^>]*>[\s\S]*?Ferramenta A/);
  });

  it('deve renderizar ícone decorativo com aria-hidden="true" quando fornecido', () => {
    const toolsWithIcon: readonly NavigationDestination[] = [
      {
        id: 'icon-tool',
        label: 'Ferramenta com Ícone',
        icon: (
          <svg data-testid="tool-svg">
            <path d="M0 0h10v10H0z" />
          </svg>
        ),
      },
    ];

    const html = renderToString(
      <ToolNavigation tools={toolsWithIcon} activeToolId="icon-tool" onSelectTool={vi.fn()} />
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-testid="tool-svg"');
  });
});

describe('NavigationItem — Contratos e Ações', () => {
  it('deve disparar onSelect quando clicado estando habilitado e inativo', () => {
    const onSelect = vi.fn();
    const destination: NavigationDestination = {
      id: 'target-tool',
      label: 'Alvo',
    };

    // Teste comportamental da função do componente
    const item = NavigationItem({
      destination,
      active: false,
      onSelect,
    });

    // Simula disparo do evento onClick do botão
    item.props.onClick();

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('não deve emitir seleção quando o botão estiver desabilitado', () => {
    const onSelect = vi.fn();
    const destination: NavigationDestination = {
      id: 'disabled-tool',
      label: 'Desabilitada',
      disabled: true,
    };

    const item = NavigationItem({
      destination,
      active: false,
      onSelect,
    });

    expect(item.props.disabled).toBe(true);
  });
});
