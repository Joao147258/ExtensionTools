---
name: documentation
description: >-
  Use esta skill para gerenciar, sincronizar e auditar a documentação técnica,
  registros de decisões arquiteturais (ADRs), relatórios e o status oficial do ExtensionTools.
---

# Documentation — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `documentation`
- **Escopo**: Harness ExtensionTools (`.harness/skills/documentation/`)
- **Papel Arquitetural**: Manutenção, consistência e auditoria da verdade documental do projeto.
- **Agentes Consumidores Primários**: `documentation-engineer`, `orchestrator`, `architect`
- **Nível de Criticidade de Governança**: Média
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Documentação desatualizada, discrepâncias entre código real e especificações, links quebrados e relatórios circunstanciais que contradizem decisões canônicas.
- **Objetivo da Operação**: Assegurar a sincronia estrita, rastreabilidade e integridade de todos os documentos canônicos, ADRs e relatórios de engenharia.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Atualiza documentos normativos canônicos (`ARCHITECTURE.md`, `status.md`).
  - Elabora relatórios de marcos e encerramento de fases exclusivamente em `docs/Relatorios/`.
  - Verifica integridade de links relativos e referências cruzadas.
  - Assegura classificação documental pública vs privada (bloqueando dados restritos).
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - Não toma decisões de arquitetura de forma autônoma sem chancela do `architect`.
  - Não implementa funcionalidades de código ou testes (`implementation`/`testing`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Ao concluir marcos, fases ou tarefas com necessidade de emissão de relatório formal.
- Ao atualizar o acompanhamento operacional no `status.md`.
- Ao documentar novas decisões arquiteturais estruturadas em `docs/architecture/adr/`.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Em modificações pontuais de código sem alteração de contratos ou status.
- Em revisões de código de pull requests ➔ Encaminhar para `code-review`.

## 5. Pré-requisitos Técnicos Mandatórios
- Acesso à hierarquia documental canônica do repositório.
- Evidências verificáveis coletadas das fases ou tarefas a documentar.

## 6. Fontes de Verdade e Referências Normativas
- `GEMINI.md`: Seção 3 (Hierarquia de Instruções) e Seção 13 (Documentação).
- `status.md`: Estado oficial de progresso do projeto.

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Descrição do evento documental, evidências comprovadas de testes/comandos e decisões aprovadas.
- **Contexto Opcional Permitido**: Rascunhos de propostas estruturadas.
- **Permissões Necessárias**: Write Local (para arquivos em `docs/` e raiz).

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Documento Markdown consistente, relatório de fase estruturado ou `status.md` atualizado.
- **Formato do Parecer**:
  - Resumo de alterações documentais com caminhos relativos.
  - Confirmação de ausência de links quebrados e conformidade de segurança.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Bloqueado por Falta de Evidência.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Identificar o nível do documento a ser alterado:
   - *Normativo:* `ARCHITECTURE.md`, `GEMINI.md`, `SECURITY.md`.
   - *Decisão:* `docs/architecture/adr/ADR-XXX.md`.
   - *Acompanhamento:* `status.md`.
   - *Evidência de Execução:* `docs/Relatorios/<milestone>/<fase>/<FASE>-REPORT.md`.
### Fase 2: Execução Técnica Padronizada
2. Redigir ou atualizar o documento mantendo clareza, concisão e estilo GitHub-flavored Markdown.
3. Utilizar estritamente caminhos relativos normalizados à raiz do repositório para links internos.
4. Aplicar a taxonomia de certeza epistêmica (`[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`).
### Fase 3: Quality Gate e Verificação Mecânica
5. Inspecionar todos os links relativos recém-adicionados para garantir que os arquivos alvo existem fisicamente.
6. Garantir ausência total de caminhos absolutos locais do host (`/home/...` ou `C:\...`).

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| Inspeção de links e arquivos | Verificar existência de arquivos referenciados | Leitura | Arquivos confirmados no filesystem |
| `git status` | Verificar escopo de arquivos modificados | Leitura | Escopo limpo e estrito |

## 11. Limitações do Runtime e Princípios de Isolamento
- Relatórios circunstanciais nunca devem contradizer ou sobrescrever decisões canônicas permanentes.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Link relativo quebrado | Arquivo alvo inexistente | Corrigir apontamento antes de finalizar o documento | Sim (Bloqueia publicação) |
| Afirmação de sucesso sem evidência | Falta de log comprobatório | Reclassificar para `[PENDENTE]` ou remover assertiva | Sim (Bloqueia status) |
| Caminho absoluto privado em texto | Padrão regex de host | Substituir por caminho relativo ao repositório | Sim (Bloqueia commit) |

## 13. Política de Evidências e Anti-Alucinação
- Toda atualização em `status.md` que marque uma tarefa como concluída deve apontar diretamente para um relatório em `docs/Relatorios/` que comprove a evidência mecânica.
- É terminantemente proibido criar arquivos de relatório fora de `docs/Relatorios/`. Documentos canônicos de arquitetura, contratos e políticas residem em seus diretórios próprios.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Vazamento de termos internos, credenciais ou identificadores restritos em relatórios públicos.
- **Controle Preventivo**: Uso de dados sintéticos e passagem obrigatória pelo scanner `scan-markdown.mjs`.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Links relativos válidos e funcionais.
- [ ] Ausência de caminhos absolutos privados.
- [ ] Fidelidade estrita entre o texto do documento e o estado real do projeto.

## 16. Cenários de Validação Comportamental Vinculados
- SC-12: Recusa de finalização documental diante de links relativos quebrados.

## 17. Regras de Manutenção e Evolução
- Alterações em documentos normativos requerem aprovação formal da governança do projeto.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T09`.
