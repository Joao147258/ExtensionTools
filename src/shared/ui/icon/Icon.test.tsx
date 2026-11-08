import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renderiza elemento svg para ícone válido do catálogo', () => {
    const html = renderToString(<Icon name="search" />);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 24 24"');
  });

  it('aplica aria-hidden="true" quando label não é informado', () => {
    const html = renderToString(<Icon name="search" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });

  it('aplica role="img" e aria-label quando label é fornecido', () => {
    const html = renderToString(<Icon name="search" label="Buscar no documento" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Buscar no documento"');
    expect(html).not.toContain('aria-hidden="true"');
  });

  it('aplica dimensões corretas para tamanho sm', () => {
    const html = renderToString(<Icon name="check" visualSize="sm" />);
    expect(html).toContain('w-3 h-3');
  });

  it('aplica dimensões corretas para tamanho md por padrão', () => {
    const html = renderToString(<Icon name="check" />);
    expect(html).toContain('w-4 h-4');
  });

  it('aplica classe animate-spin quando o ícone for spinner', () => {
    const html = renderToString(<Icon name="spinner" />);
    expect(html).toContain('animate-spin');
  });

  it('renderiza classes adicionais informadas via className', () => {
    const html = renderToString(<Icon name="alert" className="text-danger my-custom-class" />);
    expect(html).toContain('text-danger my-custom-class');
  });

  it('renderiza todos os glifos disponíveis no catálogo sem falha', () => {
    const glyphs = [
      'search',
      'check',
      'chevron-right',
      'chevron-down',
      'alert',
      'close',
      'spinner',
    ] as const;
    for (const name of glyphs) {
      const html = renderToString(<Icon name={name} />);
      expect(html).toContain('<svg');
    }
  });
});
