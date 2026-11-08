---
name: code-review
description: >-
  Use esta skill para executar revisão crítica, estática e imparcial de diffs e commits,
  identificando defeitos de lógica, regressões, complexidade e omissões de teste.
---

# Code Review — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `code-review`
- **Escopo**: Harness ExtensionTools (`.harness/skills/code-review/`)
- **Papel Arquitetural**: Auditoria estática independente de código e controle de qualidade pré-merge.
- **Agentes Consumidores Primários**: `code-reviewer`, `orchestrator`
- **Nível de Criticidade de Governança**: Alta
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Revisões subjetivas, superficiais ou lenientes que permitem a introdução de regressões lógicas, dead code, falta de tratamento de exceções ou ausência de testes.
- **Objetivo da Operação**: Avaliar criticamente diffs e alterações de código, classificando achados por severidade técnica e exigindo evidências objetivas para cada apontamento.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Inspeciona diffs Git (`git diff`) e arquivos sob proposta de commit.
  - Avalia corretude lógica, casos de borda, legibilidade e complexidade ciclomática.
  - Classifica achados em categorias estritas: `CRITICAL`, `MAJOR`, `MINOR` e `INFO`.
  - Verifica se o código alterado possui cobertura de testes unitários proporcionais.
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - **Proibição absoluta:** Não modifica arquivos de código durante a atividade de revisão (responsabilidade da skill `implementation`).
  - Não emite decisões de arquitetura de larga escala (responsabilidade da skill `architecture-review`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Ao término de uma implementação de funcionalidade ou refatoração, antes do commit.
- Na inspeção de pull requests ou branches de desenvolvimento.
- Ao auditar débitos técnicos em módulos específicos.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Em fases iniciais de experimentação ou rascunho onde o código ainda está sendo escrito.
- Em auditorias específicas de segurança contra segredos no Git ➔ Encaminhar para `public-repository-safety`.

## 5. Pré-requisitos Técnicos Mandatórios
- Diff Git disponível ou lista explícita de arquivos alterados.
- Compreensão do objetivo funcional da tarefa inspecionada.

## 6. Fontes de Verdade e Referências Normativas
- `GEMINI.md`: Seção 4 (Princípios de Engenharia) e Seção 11 (Testes e Qualidade).
- `ARCHITECTURE.md`: Padrões arquiteturais e convenções do projeto.

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Diff Git (`git diff`) ou arquivos alterados sob inspeção.
- **Contexto Opcional Permitido**: Descrição do requisito ou issue associada.
- **Permissões Necessárias**: Read-Only estrito.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Relatório estruturado de revisão de código em Markdown.
- **Formato do Parecer**:
  - Resumo da alteração inspecionada.
  - Lista de achados contendo: Arquivo, Linha, Severidade, Descrição do Problema, Consequência Técnica e Sugestão de Correção.
  - Decisão final de revisão: `APROVADO`, `APROVADO COM RESSALVAS` ou `REJEITADO (ALTERAÇÕES EXIGIDAS)`.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Bloqueado por Achado Crítico.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Obter a relação de arquivos modificados via `git status` ou `git diff --name-only`.
2. Delimitar o escopo da revisão exclusivamente aos trechos alterados.
### Fase 2: Execução Técnica Padronizada
3. *Inspeção de Corretude:* Verificar casos nulos, undefined, arrays vazios e tratamento de promises.
4. *Inspeção de Testabilidade:* Confirmar se cada novo caminho condicional possui teste correspondente.
5. *Inspeção de Limites:* Certificar-se de que não foram introduzidos imports proibidos entre features.
6. *Classificação de Severidade:*
   - `CRITICAL`: Bug evidente em produção, vulnerabilidade de segurança ou quebra de build (Bloqueia merge).
   - `MAJOR`: Desvio de padrão arquitetural, ausência de testes essenciais ou falha de tratamento de erro (Bloqueia merge).
   - `MINOR`: Oportunidade clara de simplificação ou refatoração sem quebra funcional.
   - `INFO`: Sugestão de estilo ou nota informativa não impeditiva.
### Fase 3: Quality Gate e Verificação Mecânica
7. Consolidar o parecer final baseado exclusivamente em evidências observáveis no código.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `git diff` | Inspecionar diferenças de código | Leitura | Diff textual analisado |
| Ferramentas de leitura de arquivo | Inspecionar contexto ao redor do diff | Leitura | Citação de linhas exatas |

## 11. Limitações do Runtime e Princípios de Isolamento
- O revisor deve se ater a critérios técnicos objetivos, sem impor preferências pessoais de estilo que não estejam documentadas em regras do ESLint ou Prettier.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Bug lógico impeditivo no diff | Análise de fluxo de controle | Classificar como `CRITICAL` e rejeitar aprovação | Sim (Bloqueia commit/PR) |
| Código novo sem teste unitário | Ausência de arquivo sob `tests/` | Classificar como `MAJOR` e exigir suíte | Sim (Bloqueia commit/PR) |
| Discussão puramente estilística | Preferência sem regra no ESLint | Tratar como `INFO` não bloqueante | Não (Não bloqueia) |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Todo apontamento crítico deve apresentar o trecho exato de código e explicar o cenário reproduzível de falha.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Modificação acidental de código durante o processo de revisão gerando regressões não testadas.
- **Controle Preventivo**: A skill opera com permissão estrita Read-Only.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Diff inspecionado integralmente.
- [ ] Achados classificados por severidade com linhas e consequências explicadas.
- [ ] Parecer conclusivo emitido sem qualquer modificação em arquivos de código.

## 16. Cenários de Validação Comportamental Vinculados
- SC-06: Emissão de parecer de revisão categorizado sem alterar código durante o processo.

## 17. Regras de Manutenção e Evolução
- Critérios de severidade devem ser alinhados periodicamente com os agentes `architect` e `code-reviewer`.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T05`.
