---
name: template-skill-id
description: >-
  Descrição concisa em terceira pessoa definindo o propósito da capacidade,
  o que ela executa e sob quais gatilhos operacionais o agente deve ativá-la.
---

# Nome da Capacidade — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `template-skill-id`
- **Escopo**: Harness ExtensionTools (`.harness/skills/<identificador>/`)
- **Papel Arquitetural**: Descrição sucinta em uma linha.
- **Agentes Consumidores Primários**: `<agente-1>`, `<agente-2>`
- **Nível de Criticidade de Governança**: Baixo | Médio | Alto | Crítico
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Problema concreto solucionado por esta capacidade.
- **Objetivo da Operação**: Meta observável e verificável da skill.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**: Lista clara de procedimentos e responsabilidades.
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**: Limites explícitos e skills vizinhas de fronteira.

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Cenário explícito de ativação 1.
- Cenário explícito de ativação 2.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Cenário de desvio 1 ➔ Encaminhar para Skill X.
- Cenário de desvio 2 ➔ Encaminhar para Agente Y.

## 5. Pré-requisitos Técnicos Mandatórios
- Arquivos, ferramentas, compiladores ou scripts que devem existir previamente.

## 6. Fontes de Verdade e Referências Normativas
- `GEMINI.md`: Seções aplicáveis.
- `ARCHITECTURE.md`: Seções aplicáveis.

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Arquivos, especificações, parâmetros de linha de comando.
- **Contexto Opcional Permitido**: Dados não sensíveis aceitos.
- **Permissões Necessárias**: Read-Only | Write Local | Shell Execution.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Arquivos gerados/alterados e suas localizações relativas.
- **Formato do Parecer**: Estrutura da resposta textual ou relatório emitido.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Concluído com Ressalvas | Bloqueado | Falha.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Ação preparatória de inspeção e verificação de integridade.
### Fase 2: Execução Técnica Padronizada
2. Ações mecânicas com comandos, parâmetros e validações.
### Fase 3: Quality Gate e Verificação Mecânica
3. Comandos de checagem com critérios estritos de aceitação.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `<comando>` | Finalidade exata | Leitura / Execução | Exit code 0 |

## 11. Limitações do Runtime e Princípios de Isolamento
- Tratamento de efemeridade de contexto, limites de tokens e execução segura.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Erro detectado | Como identificar | Ação determinística | Sim / Não |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Proibição absoluta de asserções de sucesso sem logs comprováveis.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Prompt injection, corrupção de AST, vazamento de segredos.
- **Controle Preventivo**: Regra de contenção correspondente.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Critério verificável 1.
- [ ] Critério verificável 2.

## 16. Cenários de Validação Comportamental Vinculados
- Vinculação com cenários formais de teste (ex.: SC-01).

## 17. Regras de Manutenção e Evolução
- Critérios semânticos para alterações compatíveis (minor) e incompatíveis (major).

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente do milestone M2 (ex.: `M2-P2-T0X`).
