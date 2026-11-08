import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renderiza elemento span com children textual', () => {
    const html = renderToString(<Badge>Ativo</Badge>);
    expect(html).toContain('<span');
    expect(html).toContain('Ativo</span>');
  });

  it('aplica tonalidade neutral por padrão', () => {
    const html = renderToString(<Badge>Item</Badge>);
    expect(html).toContain('bg-surface-elevated');
    expect(html).toContain('text-text-secondary');
  });

  it('aplica tonalidade success corretamente', () => {
    const html = renderToString(<Badge tone="success">Concluído</Badge>);
    expect(html).toContain('text-feedback-success');
    expect(html).toContain('bg-feedback-success/15');
  });

  it('aplica tonalidade warning corretamente', () => {
    const html = renderToString(<Badge tone="warning">Pendente</Badge>);
    expect(html).toContain('text-feedback-warning');
    expect(html).toContain('bg-feedback-warning/15');
  });

  it('aplica tonalidade danger corretamente', () => {
    const html = renderToString(<Badge tone="danger">Falha</Badge>);
    expect(html).toContain('text-feedback-error');
    expect(html).toContain('bg-feedback-error/15');
  });

  it('preserva classes customizadas adicionadas via className', () => {
    const html = renderToString(<Badge className="extra-class">Custom</Badge>);
    expect(html).toContain('extra-class');
  });
});
