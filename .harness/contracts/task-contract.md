# Contrato Canônico de Tarefa de Engenharia (`task-contract.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador do Contrato:** `CONTRACT-TASK-V1`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICO E VIGENTE  
> **Papéis Relacionados:** `Orchestrator`, Operador Humano e Agentes Especializados  

---

## 1. Finalidade e Responsabilidade

O **Contrato de Tarefa (`TaskContract`)** formaliza a menor unidade atômica e auditável de trabalho de engenharia no projeto **ExtensionTools**.

Ele estabelece a fronteira contratual entre a intenção do operador humano (ou do orquestrador) e a ação técnica a ser desempenhada por um agente especialista. Toda alteração de código, documentação, infraestrutura ou configuração versionada deve estar vinculada a um `TaskContract` inequívoco.

---

## 2. Especificação Estruturada do Contrato

### 2.1. Definição Tipada (TypeScript / Interface Canônica)

```typescript
export type CanonicalAgentId =
  | 'orchestrator'
  | 'architect'
  | 'developer'
  | 'code-reviewer'
  | 'test-engineer'
  | 'security-auditor'
  | 'documentation-engineer'
  | 'script-engineer'
  | 'release-engineer';

export type CanonicalSkillId =
  | 'implementation'
  | 'architecture-review'
  | 'code-review'
  | 'testing'
  | 'security-audit'
  | 'public-repository-safety'
  | 'documentation'
  | 'script-development'
  | 'release-validation';

export type SafetyLevel = 'SAFE_DEFAULT' | 'SAFE_STRICT';

export interface TaskContract {
  /** Identificador único e imutável da tarefa (ex: "M2-P3-T01", "FEAT-DIFF-T02") */
  taskId: string;
  /** Milestone de referência no roadmap oficial (ex: "M2", "M3") */
  milestone: string;
  /** Fase específica do desenvolvimento (ex: "M2-PHASE-3") */
  phase: string;
  /** Título conciso e declarativo da atividade */
  title: string;
  /** Descrição clara, orientada a objetivos e acionável */
  description: string;
  /** Agente canônico designado para liderar a execução */
  assignedAgent: CanonicalAgentId;
  /** Conjunto de skills canônicas ativadas para o trabalho */
  requiredSkills: CanonicalSkillId[];
  /** Pré-requisitos mandatórios comprováveis antes do início */
  preConditions: string[];
  /** Critérios objetivos e verificáveis para declarar a conclusão */
  acceptanceCriteria: string[];
  /** Nível de rigor e restrição de segurança */
  safetyLevel: SafetyLevel;
  /** Metadados complementares opcionais */
  metadata?: {
    issueId?: string;
    targetMilestone?: string;
    estimatedBlocks?: number;
    tags?: string[];
  };
}
```

### 2.2. Dicionário de Campos e Restrições Normativas

| Campo | Tipo | Obrigatoriedade | Restrições e Formato |
| :--- | :--- | :---: | :--- |
| `taskId` | `string` | **Obrigatório** | Padrão regex: `^[A-Z0-9]+(-[A-Z0-9]+)+$`. Deve ser imutável ao longo do ciclo de vida. |
| `milestone` | `string` | **Obrigatório** | Padrão regex: `^M[0-8]$` (ex: `M0`, `M1`, `M2`, etc.). |
| `phase` | `string` | **Obrigatório** | Deve corresponder à nomenclatura oficial registrada em `status.md`. |
| `title` | `string` | **Obrigatório** | Texto puro entre 10 e 120 caracteres. |
| `description` | `string` | **Obrigatório** | Texto descritivo em português brasileiro (pt-BR) explicando o objetivo real. |
| `assignedAgent` | `string` | **Obrigatório** | Restrito estritamente a um dos 9 agentes canônicos de `.harness/agents/`. |
| `requiredSkills`| `string[]` | **Obrigatório** | Lista não vazia contendo exclusivamente identificadores de `.harness/skills/`. |
| `preConditions` | `string[]` | **Obrigatório** | Lista não vazia de condições verificáveis (ex: "Fase anterior concluída", "Testes verdes"). |
| `acceptanceCriteria` | `string[]` | **Obrigatório** | Lista não vazia de asserções mensuráveis e testáveis. |
| `safetyLevel` | `string` | **Obrigatório** | Valor enumerado: `SAFE_DEFAULT` (padrão) ou `SAFE_STRICT` (operações sensíveis de release/segurança). |
| `metadata` | `object` | Opcional | Chaves e valores adicionais contextuais. |

---

## 3. Invariantes e Regras de Validade

1. **Unicidade e Imutabilidade:** Uma vez atribuído, o `taskId` jamais pode ser alterado ou reciclado para outra finalidade.
2. **Isolamento de Papéis:** O `assignedAgent` deve ser competente para a tarefa. É proibido atribuir atividades de implementação de produto a agentes de auditoria como `code-reviewer` ou `security-auditor`.
3. **Existência Física das Skills:** Todas as skills listadas em `requiredSkills` devem existir com seu respectivo `SKILL.md` homologado sob `.harness/skills/`.
4. **Ausência de Dados Sensíveis:** O corpo da tarefa não pode conter dados reais de usuários, credenciais, segredos ou caminhos absolutos de máquinas privadas.
5. **Critérios de Aceitação Testáveis:** Critérios como *"o código deve ser bom"* são inválidos. Devem ser formulados como *"100% dos testes da suíte vitest aprovados"* ou *"zero erros em tsc --noEmit"*.

---

## 4. Ciclo de Vida da Tarefa

A tarefa nasce no estado `PENDING` e é processada de acordo com o autômato canônico:

```text
[PENDING] ──(Triagem)──► [ROUTED] ──(Envio Contexto)──► [EXECUTING]
                                                             │
                  ┌──────────────────────────────────────────┴───────────────┐
                  ▼                                                          ▼
            [VERIFYING]                                                  [BLOCKED]
             │        │                                                      │
(Reprovação) │        │ (Aprovação Mecânica)                                 │ (Resolução)
             ▼        ▼                                                      ▼
        [EXECUTING] [REVIEWING] ──(Aprovação Code Review)──► [COMPLETED]   [ROUTED]
                          │
             (Reprovação) │
                          ▼
                     [EXECUTING]
```

- **Condição para `ROUTED`:** Validação estrutural do `TaskContract` e verificação positiva de todas as `preConditions`.
- **Condição para `COMPLETED`:** Emissão do `agent-output-contract.md` com status `COMPLETED`, cumprimento de 100% dos `acceptanceCriteria` e relatório canônico registrado.

---

## 5. Exemplos Sintéticos

### 5.1. Exemplo Válido (JSON)

```json
{
  "taskId": "M2-P3-T01",
  "milestone": "M2",
  "phase": "M2-PHASE-3",
  "title": "Estruturação dos Contratos-Base do Harness",
  "description": "Formalizar a especificação do contrato canônico de tarefas e do guia geral de governança em .harness/contracts/.",
  "assignedAgent": "architect",
  "requiredSkills": ["architecture-review", "documentation"],
  "preConditions": [
    "Milestone M2-PHASE-2 formalizado com relatório canônico aprovado",
    "Suíte de testes de qualidade verde com zero falhas no Vitest"
  ],
  "acceptanceCriteria": [
    "Arquivo .harness/contracts/task-contract.md implementado com invariantes",
    "Arquivo .harness/contracts/README.md contendo mapa de relações e máquina de estados",
    "Zero caminhos absolutos ou credenciais introduzidas"
  ],
  "safetyLevel": "SAFE_DEFAULT",
  "metadata": {
    "targetMilestone": "M2",
    "tags": ["harness", "contracts", "governance"]
  }
}
```

### 5.2. Exemplos Inválidos e Motivos de Rejeição

#### Exemplo Inválido A — Agente Não Autorizado e Skills Inexistentes
```json
{
  "taskId": "INVALID-01",
  "milestone": "M2",
  "phase": "M2-PHASE-3",
  "title": "Implementar código",
  "description": "Descrição incompleta",
  "assignedAgent": "general-ai-coder", 
  "requiredSkills": ["magic-coding"],
  "preConditions": [],
  "acceptanceCriteria": ["Fazer funcionar"],
  "safetyLevel": "SAFE_DEFAULT"
}
```
*Motivo da Rejeição:*
- `assignedAgent` ("general-ai-coder") não pertence aos 9 agentes canônicos autorizados.
- `requiredSkills` contém valor não registrado em `.harness/skills/`.
- `preConditions` e `acceptanceCriteria` estão vazios ou com critérios não mensuráveis.

#### Exemplo Inválido B — Caminhos Absolutos e Nível de Segurança Inválido
```json
{
  "taskId": "INVALID-02",
  "milestone": "M2",
  "phase": "M2-PHASE-3",
  "title": "Verificar arquivos de /opt/dados/exemplo",
  "description": "Tarefa contendo caminho absoluto de máquina local.",
  "assignedAgent": "developer",
  "requiredSkills": ["implementation"],
  "preConditions": ["Ambiente pronto"],
  "acceptanceCriteria": ["Arquivo verificado"],
  "safetyLevel": "UNRESTRICTED"
}
```
*Motivo da Rejeição:*
- Violação da política de segurança: presença de caminho absoluto (`/opt/dados/exemplo`).
- `safetyLevel` ("UNRESTRICTED") viola o enum estrito (`SAFE_DEFAULT` ou `SAFE_STRICT`).

---

## 6. Tratamento de Erros e Impedimentos

Caso uma tarefa não possa ser executada por inconsistência no `TaskContract`:
1. O agente triador (`Orchestrator`) deve rejeitar a entrada antes de instanciar o `agent-input-contract.md`.
2. Emite-se uma notificação de erro estruturada com o campo violado.
3. Se o erro for identificado durante a execução, o agente deve transitar o estado para `BLOCKED` e emitir um [`impediment-contract.md`](impediment-contract.md).
