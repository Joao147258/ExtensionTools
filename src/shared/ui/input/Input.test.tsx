import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Input } from './Input';

describe('Input', () => {
  it('renderiza input nativo com type="text" por padrão', () => {
    const html = renderToString(<Input placeholder="Digite seu nome" />);
    expect(html).toContain('<input');
    expect(html).toContain('type="text"');
    expect(html).toContain('placeholder="Digite seu nome"');
  });

  it('suporta outros tipos textuais válidos (ex: search, email, password)', () => {
    const html = renderToString(<Input type="search" />);
    expect(html).toContain('type="search"');
  });

  it('associa label ao input via htmlFor e id gerado automaticamente', () => {
    const html = renderToString(<Input label="Nome completo" />);
    expect(html).toContain('<label');
    expect(html).toContain('Nome completo</label>');
    expect(html).toContain('for="');
    expect(html).toContain('id="');
  });

  it('preserva id fornecido explicitamente via props', () => {
    const html = renderToString(<Input id="custom-user-id" label="ID do Usuário" />);
    expect(html).toContain('for="custom-user-id"');
    expect(html).toContain('id="custom-user-id"');
  });

  it('renderiza mensagem de erro com role="alert" e aria-invalid="true"', () => {
    const html = renderToString(<Input id="email-field" label="E-mail" error="E-mail inválido." />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('E-mail inválido.');
    expect(html).toContain('border-feedback-error');
  });

  it('associa aria-describedby ao id do erro quando error está presente', () => {
    const html = renderToString(<Input id="user-email" error="Campo obrigatório." />);
    expect(html).toContain('aria-describedby="user-email-error"');
    expect(html).toContain('id="user-email-error"');
  });

  it('renderiza dica (hint) associada ao aria-describedby na ausência de erro', () => {
    const html = renderToString(
      <Input id="user-doc" label="Documento" hint="Formato aceito: .json ou .xml" />
    );
    expect(html).toContain('aria-describedby="user-doc-hint"');
    expect(html).toContain('id="user-doc-hint"');
    expect(html).toContain('Formato aceito: .json ou .xml');
  });

  it('prioriza erro sobre hint quando ambos são passados', () => {
    const html = renderToString(
      <Input id="priority-field" hint="Dica descritiva" error="Erro crítico detectado" />
    );
    expect(html).toContain('Erro crítico detectado');
    expect(html).not.toContain('Dica descritiva');
    expect(html).toContain('aria-describedby="priority-field-error"');
  });

  it('suporta ocultação visual do label mantendo acessibilidade (hideLabel)', () => {
    const html = renderToString(<Input label="Buscar" hideLabel />);
    expect(html).toContain('sr-only');
    expect(html).toContain('Buscar</label>');
  });

  it('renderiza ícones iconLeft e iconRight nos slots correspondentes', () => {
    const html = renderToString(
      <Input
        iconLeft={<span data-testid="left-adornment">🔍</span>}
        iconRight={<span data-testid="right-adornment">✖</span>}
      />
    );
    expect(html).toContain('data-testid="left-adornment"');
    expect(html).toContain('data-testid="right-adornment"');
    expect(html).toContain('pl-9');
    expect(html).toContain('pr-9');
  });

  it('bloqueia digitação e aplica estilos quando disabled', () => {
    const html = renderToString(<Input disabled value="Bloqueado" />);
    expect(html).toContain('disabled=""');
    expect(html).toContain('disabled:opacity-50');
  });

  it('aplica classes do tamanho visualSize sm corretamente', () => {
    const html = renderToString(<Input visualSize="sm" />);
    expect(html).toContain('h-7');
    expect(html).toContain('text-xs');
  });
});
