# Contrato Canônico de Saída e Modelo de Evidências (`agent-output-contract.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador do Contrato:** `CONTRACT-AGENT-OUTPUT-V1`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICO E VIGENTE  
> **Papéis Relacionados:** Agentes Especializados Executores, `Orchestrator`, `Code Reviewer` e CI  

---

## 1. Finalidade e Responsabilidade

O **Contrato de Saída do Agente e Modelo de Evidências (`AgentOutput`)** formaliza o retorno estruturado obrigatório emitido por qualquer agente autônomo ao concluir, interromper ou reportar falha em uma tarefa.

Ele assegura o princípio fundamental da **engenharia orientada a evidências**:
- Nenhuma atividade é considerada concluída sem a comprovação reproduzível de comandos executados, seus códigos de saída e a publicação de um relatório técnico canônico sob `docs/Relatorios/`.
- Permite que o `Orchestrator` e o `Code Reviewer` auditem mecanicamente as alterações antes de validar a transição de estado da tarefa.
- Incorpora formalmente o **Modelo Canônico de Evidências (`EvidenceModel`)**, eliminando dispersão documental e garantindo integridade de rastreabilidade.

---

## 2. Especificação Estruturada do Contrato

### 2.1. Definição Tipada (TypeScript / Interface Canônica)

```typescript
import { CanonicalAgentId } from './task-contract';

export type TaskExecutionStatus = 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'ABORTED';

export type QualityGateStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'NOT_APPLICABLE';

export interface ExecutedCommandEvidence {
  /** Comando exato executado no terminal */
  command: string;
  /** Código de saída retornado pelo processo (0 = sucesso, 1/2 = falha) */
  exitCode: number;
  /** Duração aproximada em milissegundos */
  durationMs?: number;
  /** Resumo textual da saída sanitizada (sem dados sensíveis ou segredos) */
  outputSummary: string;
}

export interface QualityGateEvaluation {
  /** Identificador canônico do Quality Gate (ex: "QG-01", "QG-03") */
  gateId: string;
  /** Nome descritivo do gate */
  gateName: string;
  /** Estado de avaliação mecânica */
  status: QualityGateStatus;
  /** Evidência objetiva ou comando associado */
  evidence: string;
}

export interface EvidenceModel {
  /** Caminho do relatório técnico publicado em docs/Relatorios/ */
  reportPath: string;
  /** Resumo quantitativo de testes (se aplicável) */
  testMetrics?: {
    totalSuites: number;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  /** Registro de data e hora no padrão ISO 8601 */
  timestamp: string;
  /** Mapa opcional de integridade de hashes SHA-256 dos artefatos modificados */
  artifactHashes?: Record<string, string>;
}

export interface AgentOutput {
  /** Identificador da tarefa vinculada */
  taskId: string;
  /** Agente canônico que emitiu o resultado */
  agentId: CanonicalAgentId;
  /** Estado final da execução da tarefa */
  status: TaskExecutionStatus;
  /** Lista de caminhos relativos de arquivos criados, alterados ou removidos */
  modifiedFiles: string[];
  /** Histórico completo e auditável dos comandos disparados */
  executedCommands: ExecutedCommandEvidence[];
  /** Resultados individuais dos Quality Gates mecânicos acionados */
  qualityGateResults: QualityGateEvaluation[];
  /** Modelo de evidências canônicas (obrigatório se status === 'COMPLETED') */
  evidenceModel?: EvidenceModel;
  /** Riscos residuais ou débitos técnicos introduzidos ou identificados */
  remainingRisks: string[];
  /** Próxima ação recomendada para a esteira ou para o orquestrador */
  nextRecommendedAction: string;
  /** Justificativa formal em caso de FAILED, BLOCKED ou ABORTED */
  failureReason?: string;
}
```

### 2.2. Dicionário de Campos e Restrições Normativas

| Campo | Tipo | Obrigatoriedade | Restrições e Formato |
| :--- | :--- | :---: | :--- |
| `taskId` | `string` | **Obrigatório** | Deve coincidir com o `taskId` do [`task-contract.md`](task-contract.md). |
| `agentId` | `string` | **Obrigatório** | Agente canônico executor (pertencente aos 9 de `.harness/agents/`). |
| `status` | `string` | **Obrigatório** | Valor enumerado: `COMPLETED`, `FAILED`, `BLOCKED`, `ABORTED`. |
| `modifiedFiles` | `string[]` | **Obrigatório** | Lista de arquivos modificados (estritamente relativos à raiz do projeto). |
| `executedCommands` | `object[]` | **Obrigatório** | Histórico auditável com comando e respectivo `exitCode`. |
| `qualityGateResults` | `object[]` | **Obrigatório** | Lista com status dos quality gates invocados. |
| `evidenceModel` | `EvidenceModel` | **Condicional** | **Obrigatório se status for `COMPLETED`**. Deve apontar para relatório sob `docs/Relatorios/`. |
| `remainingRisks` | `string[]` | **Obrigatório** | Lista de riscos observados (pode ser vazia `[]` se nenhum risco persistir). |
| `nextRecommendedAction` | `string` | **Obrigatório** | Instrução clara de próximo passo para a esteira. |
| `failureReason` | `string` | Condicional | Obrigatório se status for `FAILED`, `BLOCKED` ou `ABORTED`. |

---

## 3. Modelo Canônico de Evidências (`EvidenceModel`)

A incorporação do `EvidenceModel` dentro deste contrato estabelece os critérios objetivos que comprovam a conformidade técnica da entrega:

1. **Centralização Canônica Obrigatória:** O campo `evidenceModel.reportPath` deve residir estritamente sob o diretório canônico `docs/Relatorios/` e seguir a estrutura hierárquica por milestone e fase (ex: `docs/Relatorios/m2/phase-3-contratos-e-politicas/H3-CONTRACTS-REPORT.md`).
2. **Auditoria de Comandos:** Todo comando crítico disparado durante a tarefa deve ter seu `exitCode` registrado com fidelidade. É proibido mascarar erros de saída (ex: `cmd || true` para forçar exit 0 no relatório).
3. **Métricas de Testes:** Se a tarefa envolver criação ou modificação de testes automatizados, o objeto `testMetrics` deve conter os números exatos extraídos da saída do Vitest/Playwright.

---

## 4. Invariantes e Regras de Validade

1. **Proibição de Sucesso Ilusório:** É estritamente vedado emitir `status: "COMPLETED"` se:
   - Qualquer comando de compilação (`tsc --noEmit`), lint (`eslint .`) ou testes aplicáveis tiver retornado `exitCode !== 0`.
   - O campo `evidenceModel` estiver ausente ou `evidenceModel.reportPath` apontar para arquivo inexistente ou fora de `docs/Relatorios/`.
   - O relatório de evidências contiver caminhos absolutos privados ou credenciais.
2. **Fidelidade do Conjunto de Arquivos Modificados:** Todo arquivo criado, alterado ou excluído durante a sessão deve ser registrado em `modifiedFiles`. É proibido ocultar modificações parciais.
3. **Semântica dos Estados de Saída:**
   - **`COMPLETED`**: Aprovado tecnicamente com 100% dos critérios de aceitação atendidos e evidências registradas.
   - **`FAILED`**: Falha técnica não recuperável dentro da sessão (ex: erro persistente em teste unitário após tentativas de correção).
   - **`BLOCKED`**: Parada por impedimento externo (ex: autorização humana obrigatória pendente, dependência de infraestrutura externa). Exige emissão simultânea de [`impediment-contract.md`](impediment-contract.md).
   - **`ABORTED`**: Interrupção forçada ou acionamento de salvaguarda *fail-closed* diante de violação de segurança crítica.

---

## 5. Exemplos Sintéticos

### 5.1. Exemplo Válido de Sucesso (`COMPLETED`)

```json
{
  "taskId": "M2-P3-T01",
  "agentId": "architect",
  "status": "COMPLETED",
  "modifiedFiles": [
    ".harness/contracts/README.md",
    ".harness/contracts/task-contract.md"
  ],
  "executedCommands": [
    {
      "command": "pnpm run format:check",
      "exitCode": 0,
      "durationMs": 420,
      "outputSummary": "All matched files use Prettier code style!"
    },
    {
      "command": "node scripts/quality/validate-reports.mjs",
      "exitCode": 0,
      "durationMs": 150,
      "outputSummary": "Sucesso: Todos os relatórios estão centralizados e em conformidade."
    }
  ],
  "qualityGateResults": [
    {
      "gateId": "QG-03",
      "gateName": "Static Code Quality",
      "status": "PASSED",
      "evidence": "prettier --check . aprovado sem divergências"
    },
    {
      "gateId": "QG-10",
      "gateName": "Documentation Integrity",
      "status": "PASSED",
      "evidence": "validate-reports.mjs aprovou centralização de documentos"
    }
  ],
  "evidenceModel": {
    "reportPath": "docs/Relatorios/m2/phase-3-contratos-e-politicas/RELATORIO-IMPLEMENTACAO-BLOCO-1-CONTRATOS.md",
    "timestamp": "2026-11-07T17:30:00.000Z"
  },
  "remainingRisks": [],
  "nextRecommendedAction": "Submeter os contratos à revisão do Code Reviewer e prosseguir para a tarefa M2-P3-T02."
}
```

### 5.2. Exemplo Válido de Bloqueio Operacional (`BLOCKED`)

```json
{
  "taskId": "M2-P3-T07",
  "agentId": "developer",
  "status": "BLOCKED",
  "modifiedFiles": [],
  "executedCommands": [],
  "qualityGateResults": [],
  "remainingRisks": [
    "Operação de publicação remota bloqueada pela política Safe-by-Default"
  ],
  "failureReason": "Ação de git push requer aprovação humana explícita conforme a política human-approvals.md.",
  "nextRecommendedAction": "Emitir impediment-contract.md e aguardar autorização humana formal."
}
```

### 5.3. Exemplos Inválidos e Motivos de Rejeição

#### Exemplo Inválido A — Sucesso Declarado com Falha em Comando Mecânico
```json
{
  "taskId": "M2-P3-T01",
  "agentId": "developer",
  "status": "COMPLETED",
  "modifiedFiles": ["src/index.ts"],
  "executedCommands": [
    {
      "command": "pnpm run compile",
      "exitCode": 1,
      "outputSummary": "Found 3 errors in src/index.ts"
    }
  ],
  "qualityGateResults": [],
  "remainingRisks": [],
  "nextRecommendedAction": "Prosseguir para próxima etapa"
}
```
*Motivo da Rejeição:*
- Violação de invariante crítica: status declarado como `COMPLETED`, mas comando de compilação retornou `exitCode: 1` (falha).
- `evidenceModel` obrigatório ausente.

#### Exemplo Inválido B — Relatório de Evidência Fora do Local Canônico
```json
{
  "taskId": "FEAT-DIFF-T01",
  "agentId": "developer",
  "status": "COMPLETED",
  "modifiedFiles": ["src/features/text-diff/core/diff.ts"],
  "executedCommands": [{"command": "pnpm test", "exitCode": 0, "outputSummary": "OK"}],
  "qualityGateResults": [],
  "evidenceModel": {
    "reportPath": "src/features/text-diff/relatorio-meu-teste.md",
    "timestamp": "2026-11-07T12:00:00Z"
  },
  "remainingRisks": [],
  "nextRecommendedAction": "Concluído"
}
```
*Motivo da Rejeição:*
- Violação grave de governança documental anti-dispersão: `reportPath` aponta para arquivo fora de `docs/Relatorios/`.
