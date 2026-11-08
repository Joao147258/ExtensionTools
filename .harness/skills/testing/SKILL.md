---
name: testing
description: >-
  Use esta skill para orientar a modelagem, implementação e validação de testes unitários,
  de integração e e2e determinísticos com Vitest e Playwright no ExtensionTools.
---

# Testing — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `testing`
- **Escopo**: Harness ExtensionTools (`.harness/skills/testing/`)
- **Papel Arquitetural**: Metodologia e padronização da engenharia de testes automatizados.
- **Agentes Consumidores Primários**: `test-engineer`, `developer`, `script-engineer`
- **Nível de Criticidade de Governança**: Alta
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Testes frágeis ("flaky"), dependentes de rede ou que utilizam timers reais lentos e asserções tautológicas superficiais.
- **Objetivo da Operação**: Assegurar a implementação e execução de testes determinísticos, isolados e orientados à detecção real de defeitos e regressões.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Modela pirâmides de testes balanceadas (unitários, integração e end-to-end).
  - Estabelece diretrizes de isolamento usando mocks de APIs do navegador (`browser.*`).
  - Orienta o uso de Fake Timers determinísticos para evitar delays reais.
  - Avalia a capacidade das asserções de capturar falhas verdadeiras.
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - Não implementa o código de produção das features (responsabilidade da skill `implementation`).
  - Não audita permissões de segurança de manifesto (responsabilidade da skill `security-audit`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Ao projetar ou implementar suítes de teste para módulos em `src/` ou `scripts/`.
- Ao diagnosticar quebras de testes ou intermitência em pipelines de integração contínua.
- Ao revisar a testabilidade de novas interfaces e adaptadores.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Em modificações exclusivas de documentação ou formatação estética.
- Em revisões estáticas puras sem elaboração de testes ➔ Encaminhar para `code-review`.

## 5. Pré-requisitos Técnicos Mandatórios
- Runtime Node.js v24+ e gerenciador `pnpm` operacionais.
- Suíte Vitest configurada e executável via `pnpm run test:unit`.

## 6. Fontes de Verdade e Referências Normativas
- `GEMINI.md`: Seção 11 (Testes e Qualidade).
- `docs/architecture/HARNESS-ARCHITECTURE.md`: Seção 11 (Estratégia de Testes do Harness).

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Componente, função, hook ou script a ser testado; especificação do comportamento esperado.
- **Contexto Opcional Permitido**: Casos de borda identificados na análise de requisitos.
- **Permissões Necessárias**: Write Local (para criar arquivos de teste em `tests/`) e Shell Execution.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Arquivos de teste determinísticos (`*.test.ts`), logs de execução limpos do executor.
- **Formato do Parecer**:
  - Resumo de cobertura comportamental (casos felizes, negativos e limites).
  - Saída do comando de teste indicando assertivas aprovadas e tempos de execução.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Falha de Teste Detectada | Bloqueado.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Identificar a unidade sob teste e mapear suas dependências externas (ex.: `browser.storage`, filesystem).
2. Definir a matriz de cenários: caso feliz, entradas inválidas/nulas e situações de erro/exceção.
### Fase 2: Execução Técnica Padronizada
3. Criar a suíte de teste isolada em `tests/unit/`, `tests/integration/` ou `tests/harness/`.
4. Configurar mocks determinísticos para chamadas de sistema ou navegador.
5. Em operações temporais, utilizar `vi.useFakeTimers()` em vez de delays reais (`sleep`).
6. Escrever asserções estritas que validem o estado observável e o retorno da função.
### Fase 3: Quality Gate e Verificação Mecânica
7. Disparar a execução via `pnpm run test:unit` ou comando específico do Vitest.
8. Certificar-se de que nenhum teste falhou e que o tempo de execução é enxuto.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `pnpm run test:unit` | Executar testes unitários da aplicação | Execução | Exit code 0, 0 falhas |
| `pnpm run test:security` | Executar testes do harness de segurança | Execução | Exit code 0, 14+ testes aprovados |
| Vitest API (`vi.fn()`, `vi.mock()`) | Isolar dependências e clock | Código | Mocks limpos por teste |

## 11. Limitações do Runtime e Princípios de Isolamento
- Testes devem ser idempotentes e independentes de ordem de execução.
- Nunca compartilhar estado mutável em memória entre blocos `it()` sem reset no `beforeEach()`.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Teste com delay real (`sleep`) | Inspeção de código | Rejeitar e exigir uso de Fake Timers | Sim (Bloqueia PR) |
| Asserção tautológica | `expect(true).toBe(true)` | Rejeitar e exigir verificação de estado real | Sim (Bloqueia PR) |
| Vazamento de estado entre testes | Teste passa isolado mas falha em lote | Adicionar limpeza de fixtures no `afterEach` | Sim (Bloqueia PR) |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Proibição absoluta de declarar "testes passaram" sem incluir o log do runner com contagem real.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Fixtures de teste contendo credenciais ou dados corporativos reais acidentalmente.
- **Controle Preventivo**: Uso exclusivo de dados sintéticos estruturados (`ExampleCompany`, `token_mock_test_123`).

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Casos positivos e negativos cobertos.
- [ ] Isolamento de dependências externas garantido.
- [ ] Execução determinística e rápida comprovada.

## 16. Cenários de Validação Comportamental Vinculados
- SC-07: Rejeição de testes com timers reais e exigência de Fake Timers.

## 17. Regras de Manutenção e Evolução
- Atualizações de versão do Vitest/Playwright devem preservar compatibilidade de mocks.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T06`.
