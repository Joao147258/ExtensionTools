# ADR-002 — Arquitetura Modular Feature-First com Isolamento Estrito

> **Identificador:** `ADR-002`  
> **Título:** Arquitetura Modular Feature-First com Isolamento Estrito e Complexidade Proporcional  
> **Status:** HOMOLOGADO E APROVADO  
> **Data da Decisão:** 05/11/2026 (Marco M1)  
> **Autoridade:** `Architect`  
> **Escopo:** Organização estrutural de código-fonte e regras de fronteira  

---

## 1. Contexto e Problema de Engenharia

O ExtensionTools reúne 12 ferramentas de finalidades distintas (de inspetor XML/JSON a comparador textual, gerenciador de evidências e editor Markdown). Em arquiteturas tradicionais organizadas por camadas técnicas (`components/`, `services/`, `utils/`), a base de código rapidamente sofre de acoplamento espaguete:
- Modificações em uma ferramenta causam regressões silenciosas em outras.
- Os agentes de IA têm dificuldade de manter limites claros de contexto ao editar pastas compartilhadas.
- O código de apresentação visual mistura-se com cálculos algorítmicos complexos e chamadas às APIs do navegador.

---

## 2. Decisão Adotada

Adota-se a organização arquitetural **Feature-First modular** sob a raiz `src/`, estruturada em quatro camadas estritas:
1. **`src/entrypoints/`**: Pontos de entrada oficiais do Manifest V3 gerenciados pelo WXT (`background/`, `sidepanel/`, `content/`, `pages/`). Hospedam a composição da aplicação e o ciclo de vida da extensão, sem regras de negócio.
2. **`src/features/`**: Módulos funcionais autônomos para cada ferramenta do catálogo. Cada feature possui seu diretório isolado e expõe sua interface externa exclusivamente através de `src/features/<feature>/index.ts`.
3. **`src/platform/`**: Serviços transversais e adaptadores para o runtime do navegador (`messaging/`, `persistence/`, `file-system/`, `browser/`).
4. **`src/shared/`**: Primitivos universais de interface (`ui/`), tipos comuns (`types/`) e classes de erro (`errors/`), consumidos por duas ou mais features.

### Complexidade Proporcional
A estrutura interna de cada feature varia estritamente conforme a natureza de seu problema:
- **Simples (Utilitários de transformação/inspeção — ex: `text-diff`, `xml-inspector`):** Estrutura interna `core/` (funções puras) + `ui/` (componentes React) + `index.ts`.
- **Intermediária (Catálogo e gestão local — ex: `snippet-library`, `reference-hub`):** Estrutura `domain/` + `application/` + `ui/` + `index.ts`.
- **Complexa (Modelagem rica e persistência relacional — ex: `evidence-capture`, `investigation-board`):** Estrutura `domain/` + `application/` + `infrastructure/` + `ui/` + `index.ts`.

---

## 3. Justificativa Técnica e Regras Inegociáveis

1. **Isolamento Absoluto entre Features (ARC-R01):** Uma feature NUNCA importa arquivos de outra feature (`import ... from '../other-feature/core'`). Toda cooperação é mediada pela camada de composição (`entrypoints/`) ou promovida para `src/platform/` / `src/shared/`.
2. **Encapsulamento por API Pública (ARC-R02):** Módulos externos importam uma feature exclusivamente a partir de seu `index.ts`. O acesso a submódulos internos privados (`../features/foo/ui/Button`) é expressamente proibido.
3. **Pureza do Domínio/Core (ARC-R03 e ARC-R04):** Arquivos em `core/` e `domain/` contêm apenas funções e tipos puros, sendo terminantemente proibido o uso de React, hooks JSX ou APIs globais do navegador (`window`, `chrome.*`).

---

## 4. Consequências e Trade-offs

### Consequências Positivas
- Testabilidade isolada: Lógicas puras de parsers e algoritmos de diff são testadas em milissegundos no Vitest sem mocks de DOM ou browser.
- Manutenibilidade independente: Evoluções em uma feature não impactam o restante do catálogo.
- Redução de alucinações em agentes de IA: Escopo de contexto cirúrgico durante a geração de código.

### Trade-offs e Riscos Mitigados
- *Tentação de duplicar código utilitário:* Mitigado pela governança canônica da camada `src/shared/`, que autoriza promoção para shared quando houver reutilização comprovada em ao menos 2 features distintas.

---

## 5. Referências e Evidências

- Arquitetura Canônica: [`ARCHITECTURE.md`](../../../ARCHITECTURE.md) (Seções 3, 4 e 5)
- Fiscalização Mecânica: [`docs/quality-gates/02-architecture-boundaries.md`](../../quality-gates/02-architecture-boundaries.md) (QG-02)
- Relatório de Formalização: [`docs/Relatorios/m2/phase-4-boundary-linter/H4-BOUNDARY-LINTER-REPORT.md`](../../Relatorios/m2/phase-4-boundary-linter/H4-BOUNDARY-LINTER-REPORT.md)
