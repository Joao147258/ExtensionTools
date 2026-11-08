# Política Canônica de Checkpoints e Aprovações Humanas (`human-approvals.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-GOV-02`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `orchestrator` (Aderência obrigatória para todos os agentes)  

---

## 1. Identificação e Finalidade

No projeto **ExtensionTools**, os agentes autônomos de IA operam sob o modelo de **engenharia assistida e governada**, onde a soberania final sobre alterações de infraestrutura, versionamento, dependências e publicação pertence indelevelmente ao operador humano.

A finalidade desta política é estabelecer a **matriz mandatória de checkpoints operacionais que exigem aprovação humana prévia, expressa e registrada**, delimitando com precisão a fronteira entre ação técnica autônoma autorizada e intervenção humana obrigatória.

---

## 2. Escopo de Aplicação

Esta política aplica-se a todas as tarefas, agentes autônomos e rotinas de automação no ciclo de vida do projeto.

---

## 3. Delimitação de Autonomia Operacional

### 3.1. O que os Agentes Autônomos PODEM Executar Autonomamente:
- Leitura e investigação de código, configurações e documentação do repositório.
- Edição incremental de arquivos de código (`src/`), automação (`scripts/`), testes (`tests/`) e relatórios (`docs/Relatorios/`) estritamente dentro do escopo da tarefa atribuída.
- Execução de comandos locais de diagnóstico e quality gates (testes Vitest, `tsc --noEmit`, ESLint, Prettier, scanners de segurança).
- Criação e atualização de relatórios técnicos sob `docs/Relatorios/` e atualização do painel de `status.md`.
- Emissão de propostas estruturadas de decisão técnica e minutas de ADR.

### 3.2. Checkpoints Mandatórios que EXIGEM Autorização Humana Prévia:
É expressamente vedado a qualquer agente executar sem instrução humana explícita:

| ID Checkpoint | Operação Crítica | Justificativa do Bloqueio | Agente Solicitante |
| :---: | :--- | :--- | :---: |
| **CHK-01** | **Efetivação de Commits Git** (`git commit`) | Garantir revisão humana de staged files antes de gravar no histórico. | `orchestrator` |
| **CHK-02** | **Envio Remoto Git** (`git push`) | Prevenção inegociável contra exposição prematura no GitHub público. | `release-engineer` |
| **CHK-03** | **Instalação de Novas Dependências** (`pnpm add`) | Análise humana de licenciamento, tamanho de bundle e risco de segurança. | `architect` |
| **CHK-04** | **Transição Formal de Milestones** (ex: M2 ➔ M3) | Validação humana do cumprimento integral dos critérios de transição. | `orchestrator` |
| **CHK-05** | **Alteração em Configurações de Segurança** | Impedir enfraquecimento autônomo de regras em `.harness/config/`. | `security-auditor` |
| **CHK-06** | **Alteração em Permissões Manifest V3** | Preservar o princípio do privilégio mínimo em `wxt.config.ts`. | `architect` |
| **CHK-07** | **Publicação Externa ou Release Distribuível** | Veto absoluto a publicação autônoma em Chrome Web Store ou GitHub Releases. | `release-engineer` |

---

## 4. Procedimento Operacional diante de um Checkpoint

Ao alcançar qualquer uma das operações críticas listadas na Seção 3.2:
1. **Interrupção Imediata da Execução:** O agente não deve tentar antecipar ou contornar o comando crítico.
2. **Emissão de Relatório de Evidências:** Consolidar todas as verificações prévias e comandos executados em relatório canônico sob `docs/Relatorios/`.
3. **Formalização do Bloqueio:** O agente transita o estado da tarefa para `BLOCKED` e emite o [`impediment-contract.md`](../contracts/impediment-contract.md) com a categoria `HUMAN_APPROVAL_REQUIRED`.
4. **Apresentação Clara ao Operador Humano:**
   - Resumo das alterações propostas.
   - Diff dos arquivos afetados.
   - Evidências mecânicas de testes e quality gates aprovados.
   - Solicitação explícita de autorização ou instrução de comando.

---

## 5. Proibição de Auto-Aprovação e Bypass

1. **Veto de Auto-Desbloqueio:** Nenhum agente pode simular a resposta do operador humano ou considerar um checkpoint como tacitamente aprovado por decurso de prazo.
2. **Proibição de Comandos em Cadeia:** É vedado encadear scripts que executem automaticamente `git commit && git push` sem pausa para aprovação intermediária.

---

## 6. Procedimento de Retomada pós-Aprovação

1. O operador humano analisa as evidências e fornece autorização expressa no diálogo (ex: *"Aprovado para commit"*).
2. O agente atualiza o impedimento para `status: "RESOLVED"`, preenchendo `resolutionDetails`.
3. A tarefa transita de `BLOCKED` para `EXECUTING`.
4. O agente executa a ação autorizada, documenta a evidência e conclui a atividade via [`agent-output-contract.md`](../contracts/agent-output-contract.md).

---

## 7. Critérios Verificáveis de Conformidade

- [ ] Zero comandos `git commit` ou `git push` executados sem registro documental prévio de aprovação humana.
- [ ] Todo acréscimo de dependência no `package.json` respaldado por ADR aprovado e instrução humana.
- [ ] 100% das transições de milestone aprovadas formalmente pelo operador humano em `status.md`.

---

## 8. Referências Cruzadas

- Regras Globais: `GEMINI.md` (Seção 16 — Git e GitHub)
- Governança de Agentes: `AGENTS.md`
- Contratos: [`impediment-contract.md`](../contracts/impediment-contract.md) e [`agent-output-contract.md`](../contracts/agent-output-contract.md)
