import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Select } from './Select';

describe('Select', () => {
  it('renderiza select nativo com children options', () => {
    const html = renderToString(
      <Select>
        <option value="1">Opção 1</option>
        <option value="2">Opção 2</option>
      </Select>
    );
    expect(html).toContain('<select');
    expect(html).toContain('<option value="1">Opção 1</option>');
    expect(html).toContain('<option value="2">Opção 2</option>');
  });

  it('associa label ao select via htmlFor e id gerado automaticamente', () => {
    const html = renderToString(
      <Select label="Selecione o formato">
        <option value="json">JSON</option>
      </Select>
    );
    expect(html).toContain('<label');
    expect(html).toContain('Selecione o formato</label>');
    expect(html).toContain('for="');
    expect(html).toContain('id="');
  });

  it('preserva id fornecido explicitamente via props', () => {
    const html = renderToString(
      <Select id="custom-select-id" label="Tipo de documento">
        <option value="xml">XML</option>
      </Select>
    );
    expect(html).toContain('for="custom-select-id"');
    expect(html).toContain('id="custom-select-id"');
  });

  it('renderiza mensagem de erro com role="alert" e aria-invalid="true"', () => {
    const html = renderToString(
      <Select id="formato" error="Seleção obrigatória.">
        <option value="">Selecione...</option>
      </Select>
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Seleção obrigatória.');
    expect(html).toContain('border-feedback-error');
  });

  it('associa aria-describedby ao erro quando presente', () => {
    const html = renderToString(
      <Select id="target-select" error="Opção inválida.">
        <option value="1">1</option>
      </Select>
    );
    expect(html).toContain('aria-describedby="target-select-error"');
    expect(html).toContain('id="target-select-error"');
  });

  it('associa aria-describedby ao hint na ausência de erro', () => {
    const html = renderToString(
      <Select id="hint-select" hint="Escolha o parser desejado">
        <option value="default">Padrão</option>
      </Select>
    );
    expect(html).toContain('aria-describedby="hint-select-hint"');
    expect(html).toContain('id="hint-select-hint"');
    expect(html).toContain('Escolha o parser desejado');
  });

  it('prioriza erro sobre hint quando ambos são passados', () => {
    const html = renderToString(
      <Select id="both-select" hint="Dica descritiva" error="Erro na seleção">
        <option value="1">1</option>
      </Select>
    );
    expect(html).toContain('Erro na seleção');
    expect(html).not.toContain('Dica descritiva');
    expect(html).toContain('aria-describedby="both-select-error"');
  });

  it('suporta ocultação visual do label (hideLabel)', () => {
    const html = renderToString(
      <Select label="Rótulo oculto" hideLabel>
        <option value="val">Val</option>
      </Select>
    );
    expect(html).toContain('sr-only');
    expect(html).toContain('Rótulo oculto</label>');
  });

  it('bloqueia interação e aplica estilos quando disabled', () => {
    const html = renderToString(
      <Select disabled>
        <option value="1">1</option>
      </Select>
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('disabled:opacity-50');
  });

  it('renderiza chevron decorativo com aria-hidden="true"', () => {
    const html = renderToString(
      <Select>
        <option value="1">1</option>
      </Select>
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events-none');
    expect(html).toContain('<svg');
  });

  it('aplica classes do tamanho visualSize sm corretamente', () => {
    const html = renderToString(
      <Select visualSize="sm">
        <option value="1">1</option>
      </Select>
    );
    expect(html).toContain('h-7');
    expect(html).toContain('pl-2.5');
    expect(html).toContain('pr-7');
  });

  it('suporta grupos de opções com optgroup', () => {
    const html = renderToString(
      <Select>
        <optgroup label="Texto">
          <option value="md">Markdown</option>
        </optgroup>
      </Select>
    );
    expect(html).toContain('<optgroup label="Texto">');
    expect(html).toContain('<option value="md">Markdown</option>');
  });
});
