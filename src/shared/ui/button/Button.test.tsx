import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza com children e type="button" padrão', () => {
    const html = renderToString(<Button>Clique aqui</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain('Clique aqui');
    expect(html).toContain('<button');
  });

  it('aplica classes da variante primary', () => {
    const html = renderToString(<Button variant="primary">Ação Primária</Button>);
    expect(html).toContain('bg-brand-primary');
    expect(html).toContain('text-base-white');
  });

  it('aplica classes da variante secondary por padrão', () => {
    const html = renderToString(<Button>Secundário</Button>);
    expect(html).toContain('bg-surface-elevated');
    expect(html).toContain('border-border-default');
  });

  it('aplica classes da variante danger', () => {
    const html = renderToString(<Button variant="danger">Excluir</Button>);
    expect(html).toContain('bg-feedback-error');
    expect(html).toContain('text-base-white');
  });

  it('aplica classes do tamanho visualSize sm', () => {
    const html = renderToString(<Button visualSize="sm">Pequeno</Button>);
    expect(html).toContain('h-7');
    expect(html).toContain('px-2.5');
    expect(html).toContain('text-xs');
  });

  it('aplica classes do tamanho visualSize md por padrão', () => {
    const html = renderToString(<Button>Médio</Button>);
    expect(html).toContain('h-8');
    expect(html).toContain('px-3.5');
  });

  it('bloqueia interação e aplica atributo disabled', () => {
    const html = renderToString(<Button disabled>Desabilitado</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('disabled:opacity-50');
  });

  it('comportamento acessível em estado loading', () => {
    const html = renderToString(
      <Button loading loadingText="Carregando dados...">
        Salvar
      </Button>
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('animate-spin');
    expect(html).toContain('Carregando dados...');
    expect(html).not.toContain('Salvar</span>');
  });

  it('renderiza iconLeft e iconRight nos slots apropriados', () => {
    const html = renderToString(
      <Button
        iconLeft={<span data-testid="left-icon">←</span>}
        iconRight={<span data-testid="right-icon">→</span>}
      >
        Navegar
      </Button>
    );
    expect(html).toContain('data-testid="left-icon"');
    expect(html).toContain('data-testid="right-icon"');
    expect(html).toContain('Navegar');
  });

  it('permite sobrescrever o atributo type para submit', () => {
    const html = renderToString(<Button type="submit">Enviar Formulário</Button>);
    expect(html).toContain('type="submit"');
  });
});
