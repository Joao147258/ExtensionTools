---
name: script-development
description: >-
  Use esta skill para desenvolver, testar e manter scripts de automação, segurança e qualidade
  em Node.js ESM nativo sob o diretório scripts/ do ExtensionTools.
---

# Script Development — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `script-development`
- **Escopo**: Harness ExtensionTools (`.harness/skills/script-development/`)
- **Papel Arquitetural**: Engenharia, padronização e automação de scripts internos do harness.
- **Agentes Consumidores Primários**: `script-engineer`, `test-engineer`
- **Nível de Criticidade de Governança**: Alta
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Scripts de automação frágeis, sem tratamento de exceções, que geram falsos positivos/negativos ou não possuem suítes de teste automatizadas.
- **Objetivo da Operação**: Padronizar a criação e manutenção de scripts em Node.js ESM nativo sob `scripts/`, garantindo portabilidade, robustez de IO, exit codes determinísticos e cobertura de testes.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Desenvolve utilitários, scanners e ferramentas sob `scripts/` (arquivos `.mjs`).
  - Cria suítes de testes unitários e de integração em `tests/harness/`.
  - Exige documentação inline rica em português brasileiro (pt-BR) explicando contratos e decisões.
  - Padroniza códigos de saída (`0` sucesso, `1` violação de governança, `2` erro operacional).
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - Não desenvolve código de produto da extensão sob `src/` (competência de `implementation`).
  - Não altera configurações de build do WXT (`wxt.config.ts`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Ao implementar ou evoluir scanners de segurança em `scripts/security/`.
- Ao criar scripts de validação de qualidade em `scripts/quality/` ou automações em `scripts/automation/`.
- Ao refatorar utilitários compartilhados em `scripts/lib/`.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Ao desenvolver componentes de UI ou hooks da extensão ➔ Encaminhar para `implementation`.
- Em auditorias de segurança de código do navegador ➔ Encaminhar para `security-audit`.

## 5. Pré-requisitos Técnicos Mandatórios
- Runtime Node.js v24+ e ambiente de testes Vitest disponível.
- Compreensão do contrato de linha de comando e dos parâmetros de entrada da automação.

## 6. Fontes de Verdade e Referências Normativas
- `GEMINI.md`: Seção 9 (Scripts de Automação e Verificação).
- `docs/architecture/HARNESS-ARCHITECTURE.md`: Seção 9 (Engenharia de Scripts do Harness).

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Especificação do script (propósito, flags de CLI, arquivos alvo, exit codes).
- **Contexto Opcional Permitido**: Configurações em `.harness/config/` a serem consumidas.
- **Permissões Necessárias**: Write Local (para arquivos em `scripts/` e `tests/harness/`) e Shell Execution.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Script Node.js ESM (`.mjs`) com documentação inline em pt-BR, suíte de teste Vitest em `tests/harness/`, e registro no `package.json` quando aplicável.
- **Formato do Parecer**:
  - Resumo de contratos de linha de comando suportados.
  - Saída dos testes unitários em `tests/harness/` comprovando casos positivos e negativos.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Bloqueado por Erro de Teste.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Definir o contrato de CLI: argumentos posicionais, flags e variáveis de ambiente aceitas.
2. Mapear os códigos de saída esperados:
   - `0`: Execução bem-sucedida / Governança aprovada.
   - `1`: Violação de regra de governança detectada (comportamento seguro).
   - `2`: Erro operacional interno (arquivo não encontrado, erro de sintaxe, etc.).
### Fase 2: Execução Técnica Padronizada
3. *Estrutura Modular ESM:* Criar o script em `.mjs` utilizando APIs nativas do Node.js (`node:fs`, `node:path`, `node:child_process`).
4. *Documentação Inline em pt-BR:* Inserir cabeçalho JSDoc e comentários explicativos detalhando responsabilidade, parâmetros e decisões de implementação.
5. *Tratamento Seguro de IO:* Tratar exceções de filesystem de forma determinística; utilizar caminhos normalizados relativos à raiz do projeto.
6. *Prevenção de Vazamentos:* Garantir que nenhum dado sensível (token, senha) seja exposto em logs de stdout/stderr.
### Fase 3: Quality Gate e Verificação Mecânica
7. Criar suíte de teste em `tests/harness/` cobrindo casos felizes, violações detectadas e erros de arquivo ausente.
8. Executar os testes via Vitest e certificar aprovação sem dependências externas voláteis.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `node <script.mjs>` | Executar a automação localmente | Execução | Exit code determinístico e log limpo |
| `pnpm exec vitest run <suíte>` | Executar testes do script | Execução | 100% dos testes aprovados |

## 11. Limitações do Runtime e Princípios de Isolamento
- Scripts do harness devem evitar dependências pesadas de terceiros; priorizar recursos nativos do Node.js v24+.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Arquivo de entrada ausente | `fs.existsSync` retorna false | Emitir mensagem de erro clara e sair com exit code 2 | Sim (Erro operacional) |
| Falha não capturada (crash) | Unhandled promise rejection | Implementar bloco de captura central e sair com exit code 2 | Sim (Bloqueia entrega) |
| Script sem suíte de teste | Inspeção de arquivos em `tests/` | Bloquear entrega até criação de teste em `tests/harness/` | Sim (Bloqueia entrega) |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Um script nunca deve ser considerado operacional sem ter sua suíte de testes executada com sucesso.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Script executando comandos de shell arbitrários via injeção de parâmetros não sanitizados.
- **Controle Preventivo**: Uso de `execFileSync` ou validação estrita de strings de entrada sem interpolação direta insegura.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Script ESM nativo com documentação inline completa em pt-BR.
- [ ] Códigos de saída padronizados e documentados.
- [ ] Suíte de testes unitários aprovada cobrindo casos positivos e negativos.

## 16. Cenários de Validação Comportamental Vinculados
- SC-13: Tratamento robusto de falha de IO com código de saída determinístico (2).

## 17. Regras de Manutenção e Evolução
- Modificações em scripts existentes devem preservar os testes de regressão associados.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T10`.
