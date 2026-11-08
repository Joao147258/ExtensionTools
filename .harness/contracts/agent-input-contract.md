# Contrato Canônico de Entrada do Agente (`agent-input-contract.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador do Contrato:** `CONTRACT-AGENT-INPUT-V1`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICO E VIGENTE  
> **Papéis Relacionados:** `Orchestrator` e Agentes Especializados Executores  

---

## 1. Finalidade e Responsabilidade

O **Contrato de Entrada do Agente (`AgentInput`)** formaliza o envelope de contexto, permissões, arquivos de fundamentação e restrições normativas disponibilizados a um agente autônomo antes do início da sua atividade.

Ele implementa o princípio de **economia de contexto e menor privilégio**, assegurando que:
- O agente tenha clareza inequívoca do seu objetivo e escopo.
- Apenas os arquivos relevantes para a tarefa sejam lidos.
- As políticas aplicáveis e limites de autoridade estejam formalmente explícitos.
- Nenhum caminho privado ou externo seja acessado.

---

## 2. Especificação Estruturada do Contrato

### 2.1. Definição Tipada (TypeScript / Interface Canônica)

```typescript
import { TaskContract, CanonicalAgentId } from './task-contract';

export type ExecutionMode =
  | 'INVESTIGATION'
  | 'PLANNING'
  | 'IMPLEMENTATION'
  | 'VERIFICATION'
  | 'REVIEW';

export type CanonicalPolicyId =
  | 'repository-safety.md'
  | 'agent-execution-boundaries.md'
  | 'destructive-operations.md'
  | 'human-approvals.md'
  | 'architecture-governance.md'
  | 'code-quality.md'
  | 'testing-strategy.md'
  | 'script-standards.md'
  | 'documentation-governance.md'
  | 'external-distribution.md';

export interface AgentInput {
  /** Identificador do agente especialista convocado */
  agentId: CanonicalAgentId;
  /** Objeto de tarefa em conformidade estrita com o TaskContract */
  task: TaskContract;
  /** Lista de caminhos relativos ao projeto para fundamentação técnica */
  contextFiles: string[];
  /** Políticas regulatórias em .harness/policies/ aplicáveis à ação */
  applicablePolicies: CanonicalPolicyId[];
  /** Raiz de trabalho da operação (obrigatoriamente relativa, padrão ".") */
  workingDirectory: string;
  /** Modo operacional ativo da sessão */
  executionMode: ExecutionMode;
  /** Instruções e restrições específicas fornecidas pelo operador humano */
  userInstructions?: string;
  /** Ferramentas autorizadas para esta sessão de trabalho */
  allowedTools?: string[];
}
```

### 2.2. Dicionário de Campos e Restrições Normativas

| Campo | Tipo | Obrigatoriedade | Restrições e Formato |
| :--- | :--- | :---: | :--- |
| `agentId` | `string` | **Obrigatório** | Deve corresponder exatamente a um dos 9 agentes canônicos de `.harness/agents/`. |
| `task` | `TaskContract` | **Obrigatório** | Objeto válido em conformidade com [`task-contract.md`](task-contract.md). |
| `contextFiles` | `string[]` | **Obrigatório** | Lista não vazia de caminhos **estritamente relativos à raiz do projeto**. |
| `applicablePolicies` | `string[]` | **Obrigatório** | Lista de arquivos de política existentes sob `.harness/policies/`. |
| `workingDirectory` | `string` | **Obrigatório** | Caminho relativo ao projeto (ex: `"."`, `"scripts/"`, `"src/features/text-diff"`). |
| `executionMode` | `string` | **Obrigatório** | Valor enumerado: `INVESTIGATION`, `PLANNING`, `IMPLEMENTATION`, `VERIFICATION`, `REVIEW`. |
| `userInstructions` | `string` | Opcional | Texto em pt-BR contendo diretrizes específicas fornecidas pelo usuário. |
| `allowedTools` | `string[]` | Opcional | Lista de identificadores de ferramentas permitidas na invocação. |

---

## 3. Invariantes e Regras de Validade

1. **Coerência de Atribuição:** O `agentId` do envelope de entrada deve coincidir obrigatoriamente com o `task.assignedAgent`. É vedado enviar um payload para um agente diferente do designado na tarefa.
2. **Proibição de Caminhos Absolutos:** É terminantemente proibido o uso de caminhos absolutos (ex: `/opt/app/project` ou `D:\project`) em `contextFiles` ou `workingDirectory`. Todos os caminhos devem ser resolvidos a partir da raiz do repositório.
3. **Imunidade de Escape de Diretório:** Nenhum caminho em `contextFiles` pode conter sequências que escapem da raiz do repositório (`../` que excedam o diretório do projeto).
4. **Compatibilidade de Modo Operacional com o Papel:**
   - Agentes de auditoria (`code-reviewer`, `security-auditor`) não podem ser ativados com `executionMode: "IMPLEMENTATION"`.
   - Agentes de implementação (`developer`, `script-engineer`) devem operar sob as políticas correspondentes (`code-quality.md`, `script-standards.md`).
5. **Existência Física dos Arquivos de Contexto:** Os arquivos listados em `contextFiles` devem existir no repositório antes do início da execução, salvo se a tarefa for explicitamente de criação inicial daquele artefato.

---

## 4. Exemplos Sintéticos

### 4.1. Exemplo Válido (JSON)

```json
{
  "agentId": "architect",
  "task": {
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
      "Arquivo .harness/contracts/README.md contendo mapa de relações e máquina de estados"
    ],
    "safetyLevel": "SAFE_DEFAULT"
  },
  "contextFiles": [
    "status.md",
    "ARCHITECTURE.md",
    "docs/architecture/HARNESS-ARCHITECTURE.md",
    "docs/Relatorios/m2/bloco-0-preparacao-reconciliacao/RELATORIO-BLOCO-0-BASELINE-E-RECONCILIACAO.md"
  ],
  "applicablePolicies": [
    "repository-safety.md",
    "agent-execution-boundaries.md",
    "architecture-governance.md",
    "documentation-governance.md"
  ],
  "workingDirectory": ".",
  "executionMode": "IMPLEMENTATION",
  "userInstructions": "Documentar em português do Brasil e assegurar compatibilidade absoluta com os diagramas Mermaid.",
  "allowedTools": ["read_file", "write_file", "edit_file", "run_command"]
}
```

### 4.2. Exemplos Inválidos e Motivos de Rejeição

#### Exemplo Inválido A — Divergência de Agente e Modo Ilegal para Auditor
```json
{
  "agentId": "code-reviewer",
  "task": {
    "taskId": "FEAT-DIFF-T01",
    "milestone": "M4",
    "phase": "M4-PHASE-1",
    "title": "Codificar algoritmo de diff",
    "description": "Implementar parser de diff",
    "assignedAgent": "developer",
    "requiredSkills": ["implementation"],
    "preConditions": ["Setup pronto"],
    "acceptanceCriteria": ["Código funcionando"],
    "safetyLevel": "SAFE_DEFAULT"
  },
  "contextFiles": ["src/features/text-diff/core/diff.ts"],
  "applicablePolicies": ["code-quality.md"],
  "workingDirectory": "src/features/text-diff",
  "executionMode": "IMPLEMENTATION"
}
```
*Motivo da Rejeição:*
- Conflito de identidade: `agentId` ("code-reviewer") não coincide com `task.assignedAgent` ("developer").
- O agente `code-reviewer` possui veto absoluto à edição de código e não pode operar em modo `IMPLEMENTATION`.

#### Exemplo Inválido B — Presença de Caminho Absoluto Privado
```json
{
  "agentId": "developer",
  "task": {
    "taskId": "M2-P3-T02",
    "milestone": "M2",
    "phase": "M2-PHASE-3",
    "title": "Criar contratos",
    "description": "Criar contratos",
    "assignedAgent": "developer",
    "requiredSkills": ["implementation"],
    "preConditions": ["Pré-condição atendida"],
    "acceptanceCriteria": ["Contrato criado"],
    "safetyLevel": "SAFE_DEFAULT"
  },
  "contextFiles": [
    "/var/data/workspace/ExtensionTools/status.md"
  ],
  "applicablePolicies": ["repository-safety.md"],
  "workingDirectory": ".",
  "executionMode": "IMPLEMENTATION"
}
```
*Motivo da Rejeição:*
- Violação grave de segurança: `contextFiles` contém caminho absoluto (`/var/data/workspace/...`), violando o princípio inegociável de caminhos relativos em repositório público.

---

## 5. Tratamento de Erros e Falhas de Entrada

Se o envelope `AgentInput` falhar na validação estática ou de integridade:
1. O agente executor não inicia a execução da tarefa.
2. É retornado um erro estruturado indicando o campo inconsistente.
3. Se a falha envolver violação de segurança (ex: presença de segredos ou caminhos privados), a esteira adota postura *fail-closed*, interrompendo o fluxo imediatamente com status `ABORTED`.
