# Política Canônica de Padrões para Scripts de Automação (`script-standards.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-ENG-04`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `script-engineer`  

---

## 1. Identificação e Finalidade

O harness do **ExtensionTools** baseia grande parte de sua governança mecânica, segurança e qualidade em scripts de automação executados localmente e no pipeline de CI.

A finalidade desta política é estabelecer os **requisitos arquiteturais, de portabilidade, tratamento de erros e códigos de saída padronizados** para todo script desenvolvido sob o diretório `scripts/`, assegurando previsibilidade operacional e imunidade contra falhas silenciosas.

---

## 2. Escopo de Aplicação

Esta política aplica-se a todos os scripts executáveis e bibliotecas utilitárias sob:
- `scripts/security/` (Scanners de segurança e publication guard)
- `scripts/quality/` (Validadores de conformidade do harness e relatórios)
- `scripts/architecture/` (Linters e verificadores de limites modulares)
- `scripts/automation/` (Rotinas de scaffold e tarefas de suporte)
- `scripts/lib/` (Biblioteca compartilhada e utilitários de sistema)
- `scripts/release/` (Auditoria de artefatos de distribuição)

---

## 3. Padrões Técnicos e Arquitetura de Módulos ESM

1. **Node.js ESM Nativo Puro:**
   - Todo script deve ser escrito utilizando módulos ECMAScript nativos (`.mjs` ou `.js` compatível com `"type": "module"` do `package.json`).
   - Importações de módulos do Node.js devem utilizar o prefixo explícito `node:` (ex: `import fs from 'node:fs';`, `import path from 'node:path';`).
2. **Reutilização da Biblioteca Compartilhada (`scripts/lib/`):**
   - É expressamente proibido duplicar funções utilitárias básicas de manipulação de caminhos, execução de comandos Git ou formatação de saída.
   - Utilize as abstrações canônicas: [`fs-utils.mjs`](../../scripts/lib/fs-utils.mjs), [`git-utils.mjs`](../../scripts/lib/git-utils.mjs) e [`logger.mjs`](../../scripts/lib/logger.mjs).
3. **Estrutura Bipartida (Modularidade + CLI Entrypoint):**
   - **Camada de Biblioteca:** A lógica central deve ser exportada como funções puras ou assíncronas testáveis (ex: `export function scan(...)`).
   - **Ponto de Entrada CLI:** A invocação via terminal deve ser isolada e executada apenas quando o arquivo for disparado diretamente:
     ```javascript
     const isDirectExecution = process.argv[1] && process.argv[1].endsWith('meu-script.mjs');
     if (isDirectExecution) {
       // parsing de flags, chamada e process.exit(code)
     }
     ```

---

## 4. Contrato Universal de Códigos de Saída (Exit Codes)

Todo script executável do projeto deve aderir estritamente ao contrato triplo de códigos de status de processo:

| Código de Saída | Significado Canônico | Comportamento Esperado |
| :---: | :--- | :--- |
| **`0`** | **SUCESSO** | A operação foi concluída com êxito, a verificação passou sem advertências ou zero violações foram detectadas. |
| **`1`** | **VIOLAÇÃO DE REGRA** | O script operou corretamente, mas identificou uma violação de regra de segurança, arquitetura ou qualidade (Quality Gate Reprovado). |
| **`2`** | **ERRO OPERACIONAL** | Falha de infraestrutura, arquivo de configuração corrompido ou ausente, erro de IO ou exceção não recuperável (*Fail-Closed*). |

---

## 5. Princípios de Resiliência e Tratamento de Erros

1. **Falha Segura (*Fail-Closed*):**
   - Se um arquivo essencial ou configuração não puder ser lido, o script não deve presumir que o estado é seguro: ele deve emitir mensagem descritiva de erro no `stderr` e encerrar imediatamente com código `2`.
2. **Sanitização de Saída:**
   - Mensagens de log emitidas no console devem passar por sanitização via `logger.mjs`, proibindo a exposição acidental de segredos ou caminhos absolutos privados.
3. **Suporte a Timeouts e Interrupções:**
   - Comandos externos disparados via `child_process` devem especificar timeouts máximos razoáveis para prevenir travamento infinito de processos em hooks ou na CI.

---

## 6. Obrigatoriedade de Testes Automatizados

1. **100% de Cobertura de Scripts:** Todo script sob `scripts/` deve possuir uma suíte de testes automatizados correspondente sob `tests/harness/`.
2. **Testabilidade dos Códigos de Saída:** Os testes devem validar explicitamente que o script retorna `0` em cenários válidos, `1` diante de infrações simuladas e `2` em erros operacionais.

---

## 7. Critérios Verificáveis de Conformidade (QG-06)

- [ ] Todos os scripts em `scripts/` utilizando ESM nativo e prefixo `node:`.
- [ ] Todo script executável implementando estritamente os códigos de saída `0`, `1` e `2`.
- [ ] Zero dependências npm pesadas adicionadas exclusivamente para automação de scripts.
- [ ] 100% dos scripts cobertos por testes unitários passando no Vitest (`pnpm exec vitest run tests/harness/`).

---

## 8. Referências Cruzadas

- Quality Gate: `docs/quality-gates/06-validator-reliability.md` (`QG-06`)
- Procedimentos: `.harness/skills/script-development/SKILL.md`
- Contratos: [`task-contract.md`](../contracts/task-contract.md) e [`agent-output-contract.md`](../contracts/agent-output-contract.md)
