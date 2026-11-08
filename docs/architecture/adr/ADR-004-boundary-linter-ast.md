# ADR-004 — Verificação Mecânica de Fronteiras via Boundary Linter Baseado em AST

> **Identificador:** `ADR-004`  
> **Título:** Verificação Mecânica de Fronteiras Arquiteturais via Analisador AST (QG-02)  
> **Status:** HOMOLOGADO E APROVADO  
> **Data da Decisão:** 06/11/2026 (Marco M2 / Fase H4)  
> **Autoridade:** `Architect`  
> **Escopo:** Automação do harness, validação estática de código e Git Hooks  

---

## 1. Contexto e Problema de Engenharia

Em projetos desenvolvidos em regime de colaboração contínua com agentes de IA, regras arquiteturais puramente documentadas em arquivos Markdown (como "é proibido importar uma feature a partir de outra") são frequentemente violadas durante a escrita de código. 

Validadores baseados exclusivamente em expressões regulares ingênuas (regex) produzem falsos positivos (detectando imports em comentários ou strings) e falsos negativos (não capturando imports dinâmicos, multilinhas ou reexportações complexas). Era indispensável dispor de um mecanismo determinístico, ultra-rápido (< 500ms) e sem dependências pesadas de runtime para barrar violações no ambiente local antes do commit.

---

## 2. Decisão Adotada

Implementa-se o **Boundary Linter** como mecanismo oficial do Quality Gate **`QG-02 (Architecture Boundaries)`**:
1. **Engine em Node.js ESM Nativo:** Desenvolvido em `scripts/architecture/boundary-linter.mjs`, reutilizando a biblioteca compartilhada `scripts/lib/ast-analyzer.mjs` e `scripts/lib/dependency-graph.mjs`.
2. **Análise Baseada em AST Real:** O analisador utiliza a TypeScript Compiler API nativa (`ts.createSourceFile`) para inspecionar os nós de declaração de importação (`ts.isImportDeclaration`), garantindo que apenas dependências reais de código sejam auditadas.
3. **Resolução Completa de Mapeamentos:** O validador resolve tanto caminhos relativos quanto path aliases configurados no `tsconfig.json` (`@/*`).
4. **Enforcement em Três Níveis:**
   - **Local Manual / CI:** Comando `pnpm run lint:arch`.
   - **Pré-Commit Git Hook:** Executa sobre arquivos na staging area via `.githooks/pre-commit`.
   - **Pré-Push Git Hook:** Executa sobre commits outgoing via `.githooks/pre-push`.
5. **Tratamento Fail-Closed:**
   - Código `0`: Zero violações arquiteturais detectadas.
   - Código `1`: Violação de limite modular detectada (commit/push bloqueado com mensagem educativa).
   - Código `2`: Erro operacional ou arquivo de configuração corrompido (aborto seguro).

---

## 3. Matriz de Regras Fiscalizadas (ARC-R01 a ARC-R08)

O Boundary Linter valida mecanicamente as seguintes invariantes:
- `ARC-R01`: Proíbe importação cruzada direta entre features distintas.
- `ARC-R02`: Proíbe entrypoints de acessarem arquivos internos de features ignorando o `index.ts`.
- `ARC-R03`: Proíbe a camada `core/domain` de importar código de apresentação (`ui/`).
- `ARC-R04`: Proíbe a camada `core/domain` de importar APIs do navegador (`platform/` e globais).
- `ARC-R05`: Proíbe a camada `application` de importar detalhes de `infrastructure`.
- `ARC-R06`: Proíbe `platform` de depender de `features` ou `entrypoints`.
- `ARC-R07`: Proíbe `shared` de importar código de qualquer camada superior.
- `ARC-R08`: Proíbe aliases TypeScript órfãos ou não mapeados.

---

## 4. Consequências e Trade-offs

### Consequências Positivas
- Garantia mecânica inegociável de isolamento Feature-First.
- Zero atrito para o desenvolvedor: execução em ~200ms no pre-commit.
- Diagnósticos educativos: a saída do erro indica exatamente a linha, a violação e a ação corretiva sugerida.

### Trade-offs e Riscos Mitigados
- *Manutenção do validador:* Mitigado por uma suíte exaustiva de **36 testes automatizados no Vitest** cobrindo casos positivos, negativos e de robustez com fixtures sintéticas.

---

## 5. Referências e Evidências

- Especificação do Quality Gate: [`docs/quality-gates/02-architecture-boundaries.md`](../../quality-gates/02-architecture-boundaries.md)
- Implementação do Linter: [`scripts/architecture/boundary-linter.mjs`](../../../scripts/architecture/boundary-linter.mjs)
- Relatório Canônico de Homologação H4: [`docs/Relatorios/m2/phase-4-boundary-linter/H4-BOUNDARY-LINTER-REPORT.md`](../../Relatorios/m2/phase-4-boundary-linter/H4-BOUNDARY-LINTER-REPORT.md)
