# ExtensionTools

> **Extensão modular de produtividade local-first para navegadores**  
> **Classificação:** Repositório Público  
> **Status:** Fase H0 — Foundation & Repository Safety  
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
> Estes módulos representam o roadmap planejado do produto. Na fase atual (**H0**), nenhuma funcionalidade ou interface gráfica está implementada.

---

## 3. Stack Tecnológica Inicial

- **Framework de Extensão**: [WXT](https://wxt.dev/) (Web Extension Tools) com Manifest V3
- **Linguagem**: TypeScript (Configuração estrita e moderna)
- **Interface**: React 19 + React DOM
- **Estilização**: Tailwind CSS v4
- **Testes**: Vitest (Unitários/Integração) e Playwright (E2E)
- **Gerenciador de Pacotes**: pnpm (v12+)
- **Qualidade de Código**: ESLint 10 + Prettier 3

---

## 4. Estado Atual: Fase H0 — Foundation & Repository Safety

O projeto encerrou a etapa de fundação estrutural:

- [x] Estrutura hierárquica de diretórios (aplicação, harness, testes, documentação) estabelecida.
- [x] Ferramentas e dependências fundamentais instaladas via `pnpm`.
- [x] Definições canônicas dos 9 agentes de engenharia extraídas e organizadas em `.harness/agents/`.
- [x] Controles de Git e `.gitignore` restritivos configurados contra vazamento de credenciais e arquivos privados.
- [x] Isolamento de diretórios privados (`.local/`).
- [ ] *(Próximas Fases)* Implementação dos entrypoints da extensão, scripts do harness e módulos funcionais.

> [!WARNING]  
> **Publicação Bloqueada**: A publicação no GitHub permanece bloqueada até a conclusão e homologação dos scanners de segurança (secrets, referências proibidas e integridade de repositório) nas fases posteriores do harness.

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
