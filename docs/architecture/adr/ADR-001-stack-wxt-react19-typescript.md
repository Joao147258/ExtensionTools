# ADR-001 — Adoção da Stack Tecnológica: WXT, React 19 e TypeScript Estrito

> **Identificador:** `ADR-001`  
> **Título:** Adoção da Stack Tecnológica Base (WXT, React 19, TypeScript e Tailwind CSS)  
> **Status:** HOMOLOGADO E APROVADO  
> **Data da Decisão:** 04/11/2026 (Marco M0 / M1)  
> **Autoridade:** `Architect`  
> **Escopo:** Framework base, runtime e ferramental de compilação  

---

## 1. Contexto e Problema de Engenharia

O desenvolvimento de extensões de navegador sob a especificação **Manifest V3** no ecossistema Chromium apresenta restrições técnicas severas:
1. O Service Worker de background não possui acesso ao DOM e pode ser suspenso pelo navegador quando inativo.
2. Os diferentes contextos de execução (Side Panel, Background Worker, Content Scripts, Páginas dedicadas) operam em espaços de memória totalmente isolados.
3. A experiência do desenvolvedor tradicional com ferramentas manuais de empacotamento (Webpack puro ou scripts Rollup ad-hoc) é propensa a erros de manifesto, recarregamento lento e dificuldade de tipagem de mensagens.
4. É necessária uma base tecnológica moderna, reativa, veloz e com tipagem estrita para sustentar o desenvolvimento de 12 ferramentas técnicas distintas operadas por desenvolvedores humanos e agentes de IA.

---

## 2. Decisão Adotada

Adota-se a seguinte stack tecnológica como fundação oficial do **ExtensionTools**:
- **Framework de Extensão:** **WXT (Web Extension Tools)** versão `0.21.5+`, operando sobre Vite como bundler subjacente.
- **Biblioteca de Interface:** **React 19** (`19.3.1`), acompanhado do módulo oficial `@wxt-dev/module-react`.
- **Linguagem e Tipagem:** **TypeScript** (`7.0.2`), configurado em modo estrito (`strict: true`, `noImplicitAny: true`, `isolatedModules: true`).
- **Estilização e Design Tokens:** **Tailwind CSS 4** (`@tailwindcss/vite`), integrado diretamente ao pipeline de compilação.
- **Harness e Testes:** **Vitest** para testes unitários em memória e **Playwright** para testes E2E no Chromium.

---

## 3. Justificativa Técnica

1. **WXT como Bundler Especializado:** O WXT elimina a necessidade de manter manifestos JSON manuais sujeitos a inconsistências. Ele gera automaticamente o `manifest.json` do Manifest V3 a partir dos arquivos contidos em `src/entrypoints/`, suporta Hot Module Replacement (HMR) real no Side Panel e automatiza a resolução de assets.
2. **React 19:** Permite a construção de componentes declarativos, modulares e performáticos, aproveitando as melhorias mais recentes de renderização sem sobrecarga de bibliotecas legadas de gerenciamento de estado.
3. **TypeScript Estrito:** A tipagem rigorosa atua como a primeira linha de defesa contra bugs lógicos e regressões silenciosas durante alterações geradas por modelos de linguagem (IA).
4. **Tailwind CSS 4:** Fornece um motor CSS de alta performance via Vite, viabilizando o consumo determinístico dos design tokens especificados em `DESIGN.md`.

---

## 4. Consequências e Trade-offs

### Consequências Positivas
- Compilação ultra-rápida (tempo de build Vite < 2s).
- Suporte nativo a ESM em todo o código-fonte e scripts de automação.
- Configuração centralizada e transparente do Manifest V3 via `wxt.config.ts`.
- Tipagem universal e compartilhada entre contextos através de path aliases (`@/*`).

### Trade-offs e Riscos Mitigados
- *Dependência do ecossistema WXT:* Mitigado pelo fato de o WXT ser uma camada fina sobre o Vite padronizado, sem aprisionamento proprietário.
- *Incompatibilidade pontual do React 19 com bibliotecas legadas:* Mitigado pela política de simplicidade proporcional e desenvolvimento de componentes nativos próprios em `src/shared/ui/`.

---

## 5. Referências e Evidências

- Arquivo de configuração: [`wxt.config.ts`](../../../wxt.config.ts)
- Configuração de tipagem: [`tsconfig.json`](../../../tsconfig.json)
- Relatório de fundação técnica: [`docs/Relatorios/m0/foundation/H0-FOUNDATION-REPORT.md`](../../Relatorios/m0/foundation/H0-FOUNDATION-REPORT.md)
- Validação de baseline de M3: [`docs/Relatorios/m3/bloco-0-baseline/RELATORIO-M3-BLOCO-0-BASELINE-E-PRONTIDAO.md`](../../Relatorios/m3/bloco-0-baseline/RELATORIO-M3-BLOCO-0-BASELINE-E-PRONTIDAO.md)
