# Política Canônica de Limites de Execução e Fronteiras de Agentes (`agent-execution-boundaries.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-SEC-02`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `orchestrator` e `architect`  

---

## 1. Identificação e Finalidade

O desenvolvimento do **ExtensionTools** adota um modelo de engenharia assistida por IA baseado em **agentes especializados com fronteiras de autoridade bem delimitadas**.

A finalidade desta política é estabelecer os **limites intransponíveis de leitura, escrita, deleção, auditoria e aprovação** de cada agente autônomo, prevenindo abusos de autoridade, vazamento de responsabilidades e auto-aprovação de artefatos (*segregation of duties*).

---

## 2. Escopo de Aplicação

Esta política governa as operações de todos os 9 agentes canônicos definidos sob `.harness/agents/`:
`orchestrator`, `architect`, `developer`, `code-reviewer`, `test-engineer`, `security-auditor`, `documentation-engineer`, `script-engineer`, `release-engineer`.

---

## 3. Matriz de Autoridade e Permissões por Papel

| Agente Canônico | Permissão de Leitura | Permissão de Escrita / Edição | Proibição Estrita de Edição | Capacidade de Veto |
| :--- | :--- | :--- | :--- | :---: |
| **`orchestrator`** | Todo o repositório | `status.md`, envelopes de tarefa | Código de produto (`src/features/`) | **Não** |
| **`architect`** | Todo o repositório | `ARCHITECTURE.md`, `docs/architecture/adr/` | Código funcional sem caráter de prova de conceito | **Sim (Arquitetura)** |
| **`developer`** | Todo o repositório | `src/`, `tests/unit/`, `tests/integration/` | `.harness/policies/`, `docs/quality-gates/` | **Não** |
| **`code-reviewer`** | Todo o repositório | Relatórios de revisão em `docs/Relatorios/` | **Veto Absoluto a Código de Produto (`src/`)** | **Sim (Qualidade)** |
| **`test-engineer`** | Todo o repositório | `tests/`, fixtures sintéticas | Código de produção em `src/features/*/core` | **Sim (Testabilidade)** |
| **`security-auditor`**| Todo o repositório | `scripts/security/`, relatórios de segurança | **Veto Absoluto a Modificar Regras p/ Bypass** | **Sim (Segurança)** |
| **`documentation-engineer`**| Todo o repositório | `docs/`, `README.md`, índices de relatórios | Código de produção (`src/`), scripts de CI | **Não** |
| **`script-engineer`** | Todo o repositório | `scripts/`, `tests/harness/` | Regras de negócio de features (`src/features/`) | **Não** |
| **`release-engineer`** | Todo o repositório | `wxt.config.ts`, relatórios de release | Alteração arbitrária de dependências | **Sim (Release)** |

---

## 4. Regras Obrigatórias e Proibições Absolutas

### 4.1. Segregação de Funções e Veto de Auto-Aprovação (*Four-Eyes Principle*)
1. **Proibição de Auto-Revisão:** O agente responsável pela implementação de um código (`developer` ou `script-engineer`) jamais pode atuar como `code-reviewer` da sua própria entrega. A revisão deve ser formalizada por uma instância ou sessão independente.
2. **Imparcialidade do Revisor:** O `code-reviewer` possui permissão estritamente consultiva e analítica sobre o código sob inspeção. É terminantemente proibido ao revisor editar o arquivo analisado para corrigir pequenos desvios; ele deve apontar o defeito no relatório e reprovar o gate.

### 4.2. Inviolabilidade das Próprias Definições
- Nenhum agente pode editar sua própria persona ou ferramentas em `.harness/agents/<seu-nome>.md`.
- Alterações em agentes ou skills exigem autorização expressa do `Architect` e aprovação humana.

### 4.3. Proibição de Invenção de Competências
- Agentes devem recusar tarefas que exijam competências alheias ao seu contrato canônico.
- O `Orchestrator` deve particionar a demanda e acionar múltiplos especialistas sequencialmente.

---

## 5. Condições de Ativação

Os limites operacionais são ativados no momento em que o envelope [`agent-input-contract.md`](../contracts/agent-input-contract.md) é carregado na sessão do agente, validando o `executionMode` contra o papel:
- Modos `INVESTIGATION`, `PLANNING` e `REVIEW`: Operações de escrita em código de produto são bloqueadas.
- Modo `IMPLEMENTATION`: Restrito a `developer`, `script-engineer` e `documentation-engineer` em suas respectivas pastas.

---

## 6. Procedimentos e Comportamentos Esperados

1. **Checagem Prévia de Escopo:** Antes de iniciar qualquer alteração, o agente deve confirmar se os arquivos a serem editados pertencem à sua área de competência autorizada.
2. **Rejeição com Justificativa:** Caso receba instrução para editar arquivo protegido, o agente deve registrar o impedimento em vez de forçar a alteração.

---

## 7. Tratamento de Violações e Impedimentos

Se um agente violar seus limites operacionais:
1. As alterações irregulares devem ser sumariamente revertidas via Git.
2. A tarefa é marcada com o estado `BLOCKED`.
3. Emite-se [`impediment-contract.md`](../contracts/impediment-contract.md) com categoria `SECURITY_RESTRICTION` e severidade `BLOCKING`.

---

## 8. Critérios Verificáveis de Conformidade

- [ ] Zero commits ou relatórios contendo código de produção assinado pelo `code-reviewer`.
- [ ] Todo pull request ou fechamento de feature acompanhado de parecer formal de revisão independente.
- [ ] Validador `validate-skills.mjs` confirmando que nenhuma skill contém permissões concorrentes ou contraditórias.

---

## 9. Referências Cruzadas

- Instruções Gerais: `AGENTS.md` (Governança Universal de Agentes)
- Definições de Agentes: `.harness/agents/`
- Procedimentos: `.harness/skills/code-review/SKILL.md`
- Contratos: [`task-contract.md`](../contracts/task-contract.md) e [`agent-output-contract.md`](../contracts/agent-output-contract.md)
