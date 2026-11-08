# Política Canônica de Governança Documental (`documentation-governance.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-GOV-01`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `documentation-engineer`  

---

## 1. Identificação e Finalidade

No projeto **ExtensionTools**, a documentação técnica é tratada com o mesmo rigor de engenharia do código-fonte executável. Um componente não é considerado concluído se sua documentação canônica e evidências estiverem desatualizadas ou dispersas.

A finalidade desta política é estabelecer a **regra inegociável de centralização documental anti-dispersão, a preservação da integridade histórica e os padrões de estruturação de links e relatórios de engenharia**, assegurando que todo conhecimento permaneça navegável, consistente e auditável.

---

## 2. Escopo de Aplicação

Esta política aplica-se a todos os arquivos Markdown (`.md`) do projeto, incluindo documentos de governança na raiz (`status.md`, `ARCHITECTURE.md`, `DESIGN.md`, `SECURITY.md`, `AGENTS.md`, `GEMINI.md`, `CONTRIBUTING.md`), documentos em `docs/` e artefatos de governança do Harness em `.harness/`.

---

## 3. Regra Inegociável Anti-Dispersão de Relatórios

1. **Exclusividade Canônica de `docs/Relatorios/`:**
   - Todo relatório de planejamento (`*PLANEJAMENTO*.md`), implementação (`*IMPLEMENTACAO*.md`), revisão técnica (`*REVISAO*.md`), testes/validação (`*VALIDACAO*.md`) ou homologação de fase/milestone (`*REPORT*.md`) **deve residir exclusivamente sob o diretório canônico `docs/Relatorios/`**.
2. **Organização Hierárquica por Milestone e Fase:**
   - A árvore de relatórios deve seguir rigorosamente a estrutura:
     ```text
     docs/Relatorios/
     ├── README.md                          # Índice consolidado navegável
     ├── m0/                                # Relatórios do Milestone M0
     ├── m2/                                # Relatórios do Milestone M2
     │   ├── phase-1-scanners/
     │   ├── phase-2-skills-canonicas/
     │   ├── phase-3-contratos-e-politicas/
     │   └── quality-gates/
     └── governanca-documental/
     ```
3. **Proibição de Relatórios Dispersos:**
   - É terminantemente proibido criar arquivos de relatório na raiz do projeto, dentro de diretórios de código funcional (`src/features/`), em pastas de testes ou soltos em subpastas de `.harness/`.
   - O validador mecânico `scripts/quality/validate-reports.mjs` barra qualquer relatório fora do local autorizado com código `1`.

---

## 4. Padrões de Links, Referências e Integridade Semântica

1. **Uso Estrito de Caminhos Relativos:**
   - Toda referência entre documentos deve utilizar caminhos relativos ao arquivo emissor (ex: `[task-contract](../contracts/task-contract.md)`).
   - É expressamente proibido o uso de caminhos absolutos do sistema operacional (`/home/...`, `C:\...`).
2. **Validade de Âncoras e Arquivos:**
   - Todo link Markdown deve apontar para um arquivo que efetivamente exista no repositório.
   - Âncoras de cabeçalhos (ex: `#secao-1`) devem coincidir fielmente com a slug gerada pelo título correspondente.
3. **Preservação Histórica e Imutabilidade:**
   - Relatórios canônicos validados e homologados de fases anteriores não podem ser deletados ou silenciosamente alterados. Novas iterações devem produzir relatórios sequenciais específicos mantendo a rastreabilidade.

---

## 5. Idioma e Padrão de Redação Técnica

- Toda documentação técnica, especificações, contratos, políticas e relatórios de engenharia devem ser redigidos em **português do Brasil (pt-BR)**.
- Adotar tom objetivo, impessoal e técnico, fundamentado em evidências e dados verificáveis.
- Diagramas visuais em blocos Mermaid devem utilizar exclusivamente sintaxe pura suportada pelo preview do ambiente (rótulos entre aspas, zero tags HTML).

---

## 6. Procedimentos de Atualização de Documentos Canônicos

1. **Atualização Concomitante de `status.md`:**
   - Ao concluir uma tarefa, etapa ou bloco, o agente responsável deve atualizar o checklist correspondente em `status.md`, registrar a evidência na tabela histórica e atualizar o índice geral em `docs/Relatorios/README.md`.
2. **Registro de Decisões Técnicas (ADR):**
   - Alterações de limites estruturais exigem novo ADR numerado sob `docs/architecture/adr/`.

---

## 7. Tratamento de Violações e Bloqueios

Se um relatório for criado fora de `docs/Relatorios/` ou forem identificados links quebrados:
1. O Quality Gate `QG-10 (Documentation Integrity)` falha na esteira com código `1`.
2. O agente deve mover o arquivo para a subpasta canônica apropriada em `docs/Relatorios/`, atualizar o `README.md` do diretório e corrigir os links correspondentes.

---

## 8. Critérios Verificáveis de Conformidade (QG-10)

- [ ] Execução de `node scripts/quality/validate-reports.mjs` com código de saída `0` e zero relatórios dispersos.
- [ ] Existência e integridade do índice consolidado em `docs/Relatorios/README.md`.
- [ ] 100% dos links cruzados apontando para caminhos relativos existentes.

---

## 9. Referências Cruzadas

- Quality Gate: `docs/quality-gates/10-documentation-integrity.md` (`QG-10`)
- Procedimentos: `.harness/skills/documentation/SKILL.md`
- Validador: `scripts/quality/validate-reports.mjs`
- Contratos: [`task-contract.md`](../contracts/task-contract.md) e [`agent-output-contract.md`](../contracts/agent-output-contract.md)
