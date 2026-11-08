import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Panel } from './Panel';

describe('Panel', () => {
  it('renderiza como elemento div por padrão', () => {
    const html = renderToString(<Panel>Conteúdo</Panel>);
    expect(html).toContain('<div');
    expect(html).toContain('Conteúdo</div>');
  });

  it('renderiza polimorficamente como section quando solicitado', () => {
    const html = renderToString(
      <Panel as="section" aria-label="Seção de teste">
        Conteúdo Section
      </Panel>
    );
    expect(html).toContain('<section');
    expect(html).toContain('aria-label="Seção de teste"');
    expect(html).toContain('Conteúdo Section</section>');
  });

  it('renderiza polimorficamente como aside quando solicitado', () => {
    const html = renderToString(
      <Panel as="aside" aria-label="Barra lateral">
        Conteúdo Aside
      </Panel>
    );
    expect(html).toContain('<aside');
    expect(html).toContain('aria-label="Barra lateral"');
  });

  it('aplica classes da superfície secondary por padrão', () => {
    const html = renderToString(<Panel>Secondary</Panel>);
    expect(html).toContain('bg-surface-dark');
    expect(html).toContain('border-border-default');
  });

  it('aplica classes de superfície primary e elevated', () => {
    const htmlPrimary = renderToString(<Panel surface="primary">Primary</Panel>);
    expect(htmlPrimary).toContain('bg-bg-dark');

    const htmlElevated = renderToString(<Panel surface="elevated">Elevated</Panel>);
    expect(htmlElevated).toContain('bg-surface-elevated');
  });

  it('aplica classes de padding de acordo com a prop', () => {
    expect(renderToString(<Panel padding="none">None</Panel>)).toContain('p-0');
    expect(renderToString(<Panel padding="sm">SM</Panel>)).toContain('p-2');
    expect(renderToString(<Panel padding="md">MD</Panel>)).toContain('p-3');
    expect(renderToString(<Panel padding="lg">LG</Panel>)).toContain('p-4');
  });

  it('concatena classes adicionais fornecidas via className', () => {
    const html = renderToString(<Panel className="custom-class mb-4">Teste</Panel>);
    expect(html).toContain('custom-class mb-4');
  });
});
