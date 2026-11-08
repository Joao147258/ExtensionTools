/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/__tests__/ToolPlaceholder.test.tsx
 * Responsabilidade: Testes de comportamento observável do ToolPlaceholder.
 * ==============================================================================
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ToolPlaceholder } from '../components/ToolPlaceholder';

describe('ToolPlaceholder', () => {
  it('deve apresentar o nome da ferramenta e a mensagem padrão na utilização mínima', () => {
    const html = renderToString(<ToolPlaceholder name="Inspetor JSON" />);

    // Verifica acessibilidade da seção
    expect(html).toContain('aria-label="Inspetor JSON"');
    // Verifica título da ferramenta
    expect(html).toContain('Inspetor JSON</h2>');
    // Verifica mensagem padrão
    expect(html).toContain('Funcionalidade em desenvolvimento.');
  });

  it('deve apresentar descrição opcional quando fornecida', () => {
    const html = renderToString(
      <ToolPlaceholder
        name="Comparador de Textos"
        description="Compara diferenças entre dois textos com algoritmo diff."
      />
    );

    expect(html).toContain('Comparador de Textos');
    expect(html).toContain('Compara diferenças entre dois textos com algoritmo diff.');
    expect(html).toContain('Funcionalidade em desenvolvimento.');
  });

  it('deve aceitar mensagem personalizada de estado', () => {
    const html = renderToString(
      <ToolPlaceholder
        name="Inspetor XML"
        description="Validador e visualizador de árvores XML."
        message="Esta ferramenta será disponibilizada na Fase M5."
      />
    );

    expect(html).toContain('Inspetor XML');
    expect(html).toContain('Esta ferramenta será disponibilizada na Fase M5.');
  });

  it('deve renderizar ícone decorativo com aria-hidden quando fornecido', () => {
    const iconElement = (
      <svg data-testid="test-icon">
        <path d="M0 0h24v24H0z" />
      </svg>
    );

    const htmlWithIcon = renderToString(
      <ToolPlaceholder name="Editor Markdown" icon={iconElement} />
    );
    expect(htmlWithIcon).toContain('aria-hidden="true"');
    expect(htmlWithIcon).toContain('data-testid="test-icon"');

    const htmlWithoutIcon = renderToString(<ToolPlaceholder name="Editor Markdown" />);
    expect(htmlWithoutIcon).not.toContain('data-testid="test-icon"');
  });
});
