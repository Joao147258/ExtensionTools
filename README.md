# ExtensionTools

> **Extensão modular de produtividade local-first para navegadores**  
> **Classificação:** Repositório Público  
> **Status:** Milestone M3 — Product Shell & Platform Foundation (Blocos 0, 1, 2 e 3 Homologados; Bloco 4 Desbloqueado)  
> **Arquitetura Canônica:** [`ARCHITECTURE.md`](ARCHITECTURE.md) | [`DESIGN.md`](DESIGN.md)  
> **Acompanhamento e Roadmap:** [`status.md`](status.md)  
> **Arquitetura do Harness:** [`docs/architecture/HARNESS-ARCHITECTURE.md`](docs/architecture/HARNESS-ARCHITECTURE.md)  
> **Visão Geral do Produto:** [`docs/product/PRODUCT-OVERVIEW.md`](docs/product/PRODUCT-OVERVIEW.md)  
> **Governança:** [`AGENTS.md`](AGENTS.md) | [`GEMINI.md`](GEMINI.md)

---

## 1. Visão Geral

O **ExtensionTools** é uma extensão de navegador modular desenvolvida para otimizar fluxos de trabalho analíticos, manipulação de texto/dados, conferência de arquivos, exportação e organização de investigações técnicas.

O projeto é guiado por três pilares inegociáveis:
1. **Local-First & Privacidade**: Toda manipulação de dados ocorre na máquina do usuário sem dependência de serviços externos ocultos ou armazenamento em nuvem não autorizado.
2. **Modularidade e Limites Explícitos**: Arquitetura monolítica modular onde ferramentas funcionam de forma autônoma e combinável.
3. **Engenharia e Governança Rigorosa**: Operação assistida por um harness de engenharia com 9 agentes especializados, contratos explícitos e rígidos quality gates de segurança.

---

## 2. Módulos Previstos

O produto planeja disponibilizar os seguintes módulos de produtividade:

- **Markdown Workspace** (editor, visualizador e manipulação)
- **XML Inspector** (inspeção, formatação e validação)
- **JSON Inspector** (árvore interativa, validação e projeção)
- **Text Diff** (comparação semântica e visual de textos)
- **PDF Export** (geração estruturada local)
- **Quick Files** (gestão ágil de arquivos em memória de trabalho)
- **Reference Hub** (catálogo e índice de referências operacionais)
- **Investigation Board** (quadro de amarração de evidências)
- **Calendar** (marcação cronológica de contexto)
- **Snippet Library** (acervo rápido de blocos reutilizáveis)
- **Tab Workspaces** (organização e agrupamento de sessões)
- **Evidence Capture** (registro local e auditável de evidências)

> [!NOTE]  
> Estes módulos representam o catálogo planejado do produto. A implementação das features inicia-se a partir de M4 (piloto `text-diff`), operando sobre a casca e a plataforma desenvolvidas e validadas em M3.

---

## 3. Stack Tecnológica

- **Framework de Extensão**: [WXT](https://wxt.dev/) 0.21.5 (Web Extension Tools) com Manifest V3
- **Linguagem**: TypeScript (Configuração estrita e moderna)
- **Interface**: React 19 + React DOM
- **Estilização**: Tailwind CSS v4 (@tailwindcss/vite)
- **Testes**: Vitest 5 (Unitários/Integração) e Playwright (E2E)
- **Gerenciador de Pacotes**: pnpm (v12+)
- **Qualidade de Código**: ESLint 10 + Prettier 3
- **Governança Arquitetural**: Boundary Linter via AST TypeScript (`scripts/architecture/boundary-linter.mjs`)

---

## 4. Estado Atual do Desenvolvimento: M3 — Product Shell & Platform Foundation

O projeto concluiu integralmente os marcos **M0 (Foundation)**, **M1 (Architecture & Design)** e **M2 (Harness Engineering & Governance)**, encontrando-se atualmente no marco **M3 (Product Shell & Platform Foundation)** com **4 blocos homologados**:

- [x] **M0 — Foundation & Repository Safety:** Scaffolding inicial, isolamento de segredos e políticas git.
- [x] **M1 — Architecture & Design:** Especificações canônicas em `ARCHITECTURE.md` e `DESIGN.md`.
- [x] **M2 — Harness Engineering:** 9 skills canônicas, contratos formais, 10 políticas, scanners ESM e Boundary Linter AST (155 testes aprovados).
- [x] **M3 / Bloco 0 — Preparação & Baseline:** Diagnóstico de compilação WXT/React 19.
- [x] **M3 / Bloco 1 — WXT & Side Panel Shell:** Entrypoints Manifest V3, Composition Root `SidePanelApp`, `WorkspaceShell`, `ToolNavigation` acessível e `tokens.css`.
- [x] **M3 / Bloco 2 — Design System Primitivo:** Componentes atômicos acessíveis (`Button`, `Input`, `Select`, `Panel`, `Badge`, `Icon`) em `src/shared/ui/` com contraste WCAG 2.1 AA auditado.
- [x] **M3 / Bloco 3 — Platform Messaging:** Barramento fortemente tipado entre Side Panel e Background, Inversão de Dependências (`MessageTransport`), runtime validation, timeout local, roteador com autorização `SenderInfo` e operação `platform.ping` (homologado com reservas documentadas).
- [ ] **M3 / Bloco 4 — Platform Persistence & Storage:** *(Desbloqueado / Pronto para Início)* Contratos de armazenamento e adaptadores `chrome.storage.local`.
- [ ] **M3 / Bloco 5 — Integração & Homologação:** Validação integrada final e transição para M4.

### Métricas de Qualidade Atuais
- **499 testes automatizados aprovados no Vitest** (100% de sucesso em 50 arquivos).
- **0 violações de limites modulares** verificadas pelo Boundary Linter em 62 arquivos e 166 dependências (`QG-02`).
- **0 segredos ou caminhos privados** detectados pelo Guardião de Publicação (`QG-01`).
- **Build de produção limpo** gerando bundle Chrome MV3 em ~600 ms (`.output/chrome-mv3/`).

> [!WARNING]  
> **Publicação Bloqueada (Safe-by-Default):** A publicação externa no GitHub permanece bloqueada até a conclusão e homologação formal de todos os Quality Gates de release no Milestone M8. Todos os dados utilizados em testes são estritamente sintéticos.

---

## 5. Requisitos de Ambiente e Instalação

### Requisitos

- **Node.js**: `>= 20.0.0` (recomendado v22 ou v24)
- **pnpm**: `>= 9.0.0` (padrão do projeto: `12.16.1`)

### Preparação do Ambiente

```bash
# Clonar o repositório (após homologação de publicação)
git clone <repository-url>
cd ExtensionTools

# Instalar dependências
pnpm install

# Verificar compilação estática de tipos
pnpm run compile

# Verificar conformidade de formatação e lint
pnpm run lint
pnpm run format:check
```

---

## 6. Governança e Contribuição

Antes de qualquer contribuição ou execução assistida por IA, consulte:
- [`SECURITY.md`](SECURITY.md): Política de segurança e manuseio de dados sintéticos.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): Diretrizes de contribuição e governança de agentes.
- [`AGENTS.md`](AGENTS.md): Contrato universal dos agentes de engenharia.
- [`GEMINI.md`](GEMINI.md): Adaptações operacionais para o Gemini CLI.
- [`docs/Relatorios/m0/foundation/H0-FOUNDATION-REPORT.md`](docs/Relatorios/m0/foundation/H0-FOUNDATION-REPORT.md): Relatório de integridade da fase H0.
