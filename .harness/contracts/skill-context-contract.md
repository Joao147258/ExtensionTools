# Contrato Canônico de Contexto de Invocação de Skill (`skill-context-contract.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador do Contrato:** `CONTRACT-SKILL-CONTEXT-V1`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICO E VIGENTE  
> **Papéis Relacionados:** Agentes Especializados Executores e Skills Canônicas  

---

## 1. Finalidade e Responsabilidade

O **Contrato de Contexto de Skill (`SkillContext`)** estabelece o protocolo formal de ativação e parametrização de capacidades operacionais especializadas documentadas sob `.harness/skills/`.

Ele assegura que:
- O agente executor invoque apenas skills canônicas homologadas.
- A skill receba parâmetros explícitos, alvos delimitados e restrições de segurança aplicáveis.
- O isolamento entre papéis seja preservado, impedindo que skills consultivas ou de auditoria realizem alterações não autorizadas em código ou configurações.

---

## 2. Especificação Estruturada do Contrato

### 2.1. Definição Tipada (TypeScript / Interface Canônica)

```typescript
import { CanonicalAgentId, CanonicalSkillId } from './task-contract';

export interface SkillContext<TParams = Record<string, unknown>> {
  /** Identificador da skill canônica acionada */
  skillName: CanonicalSkillId;
  /** Agente canônico responsável pela invocação */
  invokingAgent: CanonicalAgentId;
  /** Lista de caminhos relativos de arquivos ou pastas alvo da operação */
  targetPaths: string[];
  /** Parâmetros operacionais estruturados específicos da skill */
  parameters: TParams;
  /** Restrições mandatórias de segurança a serem respeitadas durante a execução */
  safetyConstraints: string[];
  /** Lista de artefatos ou relatórios que a skill deve inspecionar ou produzir */
  expectedArtifacts?: string[];
}
```

### 2.2. Dicionário de Campos e Restrições Normativas

| Campo | Tipo | Obrigatoriedade | Restrições e Formato |
| :--- | :--- | :---: | :--- |
| `skillName` | `string` | **Obrigatório** | Deve corresponder estritamente a uma das 9 skills homologadas em `.harness/skills/`. |
| `invokingAgent` | `string` | **Obrigatório** | Agente canônico solicitante (pertencente aos 9 de `.harness/agents/`). |
| `targetPaths` | `string[]` | **Obrigatório** | Lista não vazia de caminhos **estritamente relativos à raiz do projeto**. |
| `parameters` | `object` | **Obrigatório** | Objeto contendo os dados e flags operacionais exigidos pela skill. |
| `safetyConstraints`| `string[]` | **Obrigatório** | Restrições explícitas (ex: `"READ_ONLY"`, `"NO_EXTERNAL_NETWORK"`, `"SAFE_BY_DEFAULT"`). |
| `expectedArtifacts`| `string[]` | Opcional | Lista de caminhos de saída esperados após a execução da skill. |

---

## 3. Invariantes e Regras de Validade

1. **Homologação Prévia da Skill:** A skill identificada por `skillName` deve possuir arquivo `SKILL.md` válido e validado pelo script `scripts/quality/validate-skills.mjs`.
2. **Veto de Modificação para Skills de Auditoria:** Quando as skills `code-review`, `architecture-review`, `security-audit`, `documentation` ou `public-repository-safety` forem acionadas em modo de inspeção, o campo `safetyConstraints` deve incluir obrigatoriamente a restrição `"READ_ONLY"`. É proibida a alteração de arquivos de código de produto sob esta restrição.
3. **Escopo Delimitado:** O array `targetPaths` não pode conter curingas abertos irrestritos como `"**"` na raiz do projeto. O escopo deve apontar para subpastas ou arquivos específicos da tarefa em execução.
4. **Isolamento de Caminhos:** É expressamente proibida a presença de caminhos absolutos ou que referenciem diretórios externos ao projeto.

---

## 4. Exemplos Sintéticos

### 4.1. Exemplo Válido — Invocação de Auditoria de Código (`code-review`)

```json
{
  "skillName": "code-review",
  "invokingAgent": "code-reviewer",
  "targetPaths": [
    "src/features/text-diff/core/algorithm.ts",
    "src/features/text-diff/core/diff-models.ts"
  ],
  "parameters": {
    "reviewScope": "DIFF_AGAINST_MAIN",
    "strictTyping": true,
    "checkCleanCode": true
  },
  "safetyConstraints": [
    "READ_ONLY",
    "SAFE_BY_DEFAULT",
    "VETO_ON_CODE_MODIFICATION"
  ],
  "expectedArtifacts": [
    "docs/Relatorios/m4/RELATORIO-REVISAO-TEXT-DIFF.md"
  ]
}
```

### 4.2. Exemplo Válido — Invocação de Verificação de Segurança (`public-repository-safety`)

```json
{
  "skillName": "public-repository-safety",
  "invokingAgent": "security-auditor",
  "targetPaths": [
    ".harness/contracts/",
    ".harness/policies/"
  ],
  "parameters": {
    "scanModes": ["markdown", "secrets", "private-paths"]
  },
  "safetyConstraints": [
    "READ_ONLY",
    "SAFE_BY_DEFAULT"
  ]
}
```

### 4.3. Exemplos Inválidos e Motivos de Rejeição

#### Exemplo Inválido A — Skill Inexistente no Catálogo
```json
{
  "skillName": "automatic-bug-fixer",
  "invokingAgent": "developer",
  "targetPaths": ["src/"],
  "parameters": {},
  "safetyConstraints": ["SAFE_DEFAULT"]
}
```
*Motivo da Rejeição:*
- `skillName` ("automatic-bug-fixer") não existe no catálogo de 9 skills canônicas de `.harness/skills/`.

#### Exemplo Inválido B — Caminho Absoluto e Ausência de Restrição Read-Only em Auditoria
```json
{
  "skillName": "security-audit",
  "invokingAgent": "security-auditor",
  "targetPaths": ["/opt/local/projetos/src"],
  "parameters": {},
  "safetyConstraints": []
}
```
*Motivo da Rejeição:*
- Violação de segurança: presença de caminho absoluto (`/opt/local/...`).
- A skill `security-audit` exige obrigatoriamente a restrição `"READ_ONLY"` em `safetyConstraints`.

---

## 5. Tratamento de Erros

Se uma invocação de skill violar o contrato `SkillContext`:
1. A execução da skill é imediatamente bloqueada.
2. É retornado código de erro operacional com detalhamento do campo inválido.
3. Se a falha impedir o avanço da tarefa, o agente transmissor transita para o estado `BLOCKED` e formaliza um [`impediment-contract.md`](impediment-contract.md).
