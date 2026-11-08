---
name: architecture-review
description: >-
  Use esta skill para auditar a integridade estrutural, direção de dependências,
  fronteiras modulares Feature-First e conformidade com Manifest V3 do ExtensionTools.
---

# Architecture Review — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `architecture-review`
- **Escopo**: Harness ExtensionTools (`.harness/skills/architecture-review/`)
- **Papel Arquitetural**: Auditoria de fronteiras modulares, limites e decisões arquiteturais.
- **Agentes Consumidores Primários**: `architect`, `orchestrator`, `code-reviewer`
- **Nível de Criticidade de Governança**: Crítico
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Erosão arquitetural, dependências circulares entre features e quebra dos princípios Local-First e Manifest V3.
- **Objetivo da Operação**: Avaliar a conformidade estrutural de alterações propostas ou existentes em relação aos limites modulares e contratos canônicos.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Mapeia direções de dependências entre `src/features/`, `src/platform/` e `src/shared/`.
  - Verifica ausência de acoplamento direto cruzado entre módulos paralelos de features.
  - Avalia o ciclo de vida efêmero do Background Service Worker no Manifest V3.
  - Avalia a necessidade de minutas de Architecture Decision Records (ADR).
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - Não faz revisão de code style, formatação ou bugs lógicos locais (responsabilidade da skill `code-review`).
  - Não implementa o código das features (responsabilidade da skill `implementation`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Antes de iniciar refatorações estruturais amplas que afetem múltiplos módulos.
- Ao introduzir uma nova dependência de produção em `package.json`.
- Ao criar ou renomear um módulo em `src/features/`.
- Ao auditar pull requests com impacto na comunicação entre camadas.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Em ajustes pontuais de CSS ou texto visual ➔ Encaminhar para `implementation`.
- Em auditoria de segredos ou arquivos restritos do Git ➔ Encaminhar para `public-repository-safety`.

## 5. Pré-requisitos Técnicos Mandatórios
- Acesso de leitura a `ARCHITECTURE.md` e `docs/architecture/HARNESS-ARCHITECTURE.md`.
- Mapeamento das árvores de diretórios sob `src/`.

## 6. Fontes de Verdade e Referências Normativas
- `ARCHITECTURE.md`: Modelo canônico de Monólito Modular, Local-First e Feature-First.
- `GEMINI.md`: Seção 4 (Princípios de Engenharia) e Seção 5 (Arquitetura Técnica do Produto).

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Lista de arquivos alterados/propostos ou árvore de imports sob inspeção.
- **Contexto Opcional Permitido**: Descrição do requisito de negócio da feature.
- **Permissões Necessárias**: Read-Only.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Parecer técnico formal no chat ou minuta de ADR em `docs/architecture/adr/`.
- **Formato do Parecer**:
  - *Classificação de Impacto*: `CONFORME`, `ALERTA` ou `VIOLAÇÃO`.
  - *Apontamento de Fronteiras*: Lista de dependências verificadas e conformidade modular.
  - *Determinação de ADR*: Declaração se uma ADR formal é necessária ou dispensável.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Bloqueado.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Ler o diff ou os arquivos do módulo alvo sob `src/`.
2. Mapear todas as declarações `import` e `export`.
### Fase 2: Execução Técnica Padronizada
3. Verificar a regra fundamental de isolamento de features: nenhuma pasta em `src/features/<A>` pode importar diretamente de `src/features/<B>`.
4. Verificar regras de camada: `src/shared/` nunca importa de `src/features/` ou `src/platform/`.
5. Verificar aderência ao Manifest V3: garantir que o Background Service Worker não armazena estado vital em variáveis globais em memória.
### Fase 3: Quality Gate e Verificação Mecânica
6. Confirmar ausência de ciclos de dependência.
7. Emitir parecer estruturado fundamentado em evidências do código.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| Busca textual / Grep | Identificar declarações de import | Leitura | Mapeamento exato de caminhos |
| Inspeção de `ARCHITECTURE.md` | Confrontar regras normativas | Leitura | Citação de seção canônica |

## 11. Limitações do Runtime e Princípios de Isolamento
- A skill opera exclusivamente em modo leitura analítica. Não altera o código inspecionado.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Import cruzado entre features | `import ... from '../outra-feature'` | Apontar violação e exigir desacoplamento via `shared` ou eventos | Sim (Bloqueia PR/Merge) |
| Dependência circular | Ciclo detectado na árvore de imports | Barrar a alteração e exigir inversão de dependência | Sim (Bloqueia PR/Merge) |
| Nova lib pesada sem justificativa | Adição em `package.json` | Exigir confecção prévia de ADR aprovada | Sim (Bloqueia introdução) |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Toda violação apontada deve citar o arquivo e a linha exata da declaração de import.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Acoplamento que permita a uma feature vazar dados ou contexto privado para outra.
- **Controle Preventivo**: Isolamento modular rígido com APIs explícitas.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Mapeamento completo dos imports realizado.
- [ ] Grafo de dependências unidirecional e acíclico confirmado.
- [ ] Parecer formal emitido com status e fundamentação documental.

## 16. Cenários de Validação Comportamental Vinculados
- SC-04: Não ativação em tarefas puramente de formatação cosmética.
- SC-05: Exigência de minuta de ADR diante de dependência estrutural relevante.

## 17. Regras de Manutenção e Evolução
- Alterações em regras de fronteiras exigem aprovação do agente `architect` e atualização de `ARCHITECTURE.md`.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T04`.
