---
name: implementation
description: >-
  Use esta skill para orientar a implementação, refatoração e evolução modular de funcionalidades
  com TypeScript, React 19, WXT e Manifest V3 no ExtensionTools.
---

# Implementation — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `implementation`
- **Escopo**: Harness ExtensionTools (`.harness/skills/implementation/`)
- **Papel Arquitetural**: Engenharia e evolução de features em `src/` em conformidade modular.
- **Agentes Consumidores Primários**: `developer`, `script-engineer`
- **Nível de Criticidade de Governança**: Alta
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Implementações desestruturadas que violam limites entre features, introduzem dependências circulares, utilizam tipagem frouxa (`any`) ou omitem testes automatizados.
- **Objetivo da Operação**: Guiar a construção incremental de código de produção, garantindo separação Feature-First, robustez de tipos, testabilidade e respeito às restrições do Manifest V3.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Implementa componentes visuais, hooks, adaptadores de plataforma e entrypoints em `src/`.
  - Constrói testes unitários acompanhantes para validação de comportamento.
  - Executa verificações de compilação estrita de tipos e linting antes da entrega.
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - Não desenvolve scripts de automação do harness sob `scripts/` (competência de `script-development`).
  - Não emite aprovação formal de release para publicação externa (`release-validation`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Ao desenvolver novas funcionalidades mapeadas no roadmap sob `src/features/`.
- Ao refatorar componentes ou hooks existentes para simplificação e coesão.
- Ao integrar novos adaptadores de sistema em `src/platform/` (Storage, Mensageria, Filesystem).
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Em revisões críticas de pull requests sem edição de código ➔ Encaminhar para `code-review`.
- Em auditorias de segurança de manifesto ou CSP ➔ Encaminhar para `security-audit`.

## 5. Pré-requisitos Técnicos Mandatórios
- Requisitos funcionais e técnicos especificados na tarefa do milestone.
- Compilação TypeScript (`tsc`) e ambiente Vitest funcionais no repositório.

## 6. Fontes de Verdade e Referências Normativas
- `ARCHITECTURE.md`: Modelo Monólito Modular, Local-First e Feature-First.
- `DESIGN.md`: Diretrizes visuais, UX, tokens e componentes do Design System.
- `GEMINI.md`: Seção 4 (Princípios de Engenharia) e Seção 5 (Arquitetura Técnica do Produto).

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Especificação funcional, módulo alvo em `src/features/` ou `src/platform/`.
- **Contexto Opcional Permitido**: Tipos existentes em `src/shared/types/` ou mocks de referência.
- **Permissões Necessárias**: Write Local (para arquivos sob `src/` e `tests/unit/`) e Shell Execution.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Código TypeScript/React implementado em conformidade modular, suíte de testes unitários associada e logs limpos de compilação/lint.
- **Formato do Parecer**:
  - Resumo de componentes e funções criadas/modificadas com caminhos relativos.
  - Confirmação de execução de `compile`, `lint` e `test:unit` com exit code 0.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Bloqueado por Erro de Compilação/Teste.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Identificar o módulo alvo sob `src/features/<feature>/` ou `src/platform/`.
2. Verificar a ausência de acoplamento com outras features (cada módulo de feature é isolado).
### Fase 2: Execução Técnica Padronizada
3. *Design de Tipos:* Declarar interfaces e tipos estritos sem uso de `any` ou `@ts-ignore`.
4. *Desenvolvimento Orientado a Comportamento:*
   - Para regras de negócio, algoritmos e transformações de dados: aplicar desenvolvimento orientado a testes (TDD).
   - Para componentes de UI: desenvolver a interface e criar testes de renderização/comportamento associados.
5. *Tratamento Seguro de Erros:* Garantir que promises rejeitadas e erros de APIs externas sejam tratados de forma determinística.
### Fase 3: Quality Gate e Verificação Mecânica
6. Executar compilação estrita: `pnpm run compile` (`tsc --noEmit`).
7. Executar linting: `pnpm run lint` (`eslint .`).
8. Executar suíte de testes unitários: `pnpm run test:unit`.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `pnpm run compile` | Validar integridade de tipos TypeScript | Execução | Exit code 0, zero erros de tipo |
| `pnpm run lint` | Validar conformidade de código | Execução | Exit code 0, zero avisos |
| `pnpm run test:unit` | Executar testes unitários da aplicação | Execução | 100% dos testes aprovados no Vitest |

## 11. Limitações do Runtime e Princípios de Isolamento
- Nenhuma feature pode importar código diretamente de outra feature. Qualquer mecanismo genuinamente reutilizável deve ser promovido para `src/shared/` mediante justificativa arquitetural.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Erro de tipagem TypeScript | Falha em `tsc --noEmit` | Corrigir contratos e assinaturas de tipos | Sim (Bloqueia entrega) |
| Import proibido entre features | Inspeção estática de código | Desacoplar via eventos ou promover para `shared` | Sim (Bloqueia entrega) |
| Falha em teste unitário | Vitest reporta assertiva quebrada | Corrigir lógica do componente antes da entrega | Sim (Bloqueia entrega) |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Proibição absoluta de declarar conclusão sem apresentar os logs das verificações mecânicas aprovadas.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Renderização insegura de strings fornecidas pelo usuário resultando em vulnerabilidades XSS.
- **Controle Preventivo**: Uso de binding seguro do React (`{conteudo}`) e proibição de `dangerouslySetInnerHTML` sem sanitização.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Código implementado em estrito respeito aos limites modulares.
- [ ] Compilação de tipos TypeScript aprovada sem exceções.
- [ ] Linting e testes unitários aprovados com exit code 0.

## 16. Cenários de Validação Comportamental Vinculados
- SC-01: Criação de hook/componente com tipagem estrita e testes unitários aprovados.
- SC-02: Recusa de criação de scripts fora de `src/` (encaminhamento para `script-development`).
- SC-03: Bloqueio imediato diante de tentativa de import cruzado entre features paralelas.

## 17. Regras de Manutenção e Evolução
- Refatorações devem preservar a estabilidade dos testes de comportamento existentes.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T03`.
