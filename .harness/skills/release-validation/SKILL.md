---
name: release-validation
description: >-
  Use esta skill para auditar a integridade de bundles gerados, validar manifestos,
  impedir arquivos de teste em builds e certificar a prontidão de release do ExtensionTools.
---

# Release Validation — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `release-validation`
- **Escopo**: Harness ExtensionTools (`.harness/skills/release-validation/`)
- **Papel Arquitetural**: Auditoria de prontidão de publicação e integridade de artefatos de distribuição.
- **Agentes Consumidores Primários**: `release-engineer`, `orchestrator`
- **Nível de Criticidade de Governança**: Crítico
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Empacotamento inadvertido de arquivos de teste (`*.test.*`), pastas de desenvolvimento (`.local/`, `tests/`), sourcemaps com caminhos sensíveis ou manifestos com permissões experimentais em artefatos distribuídos para as lojas de extensões.
- **Objetivo da Operação**: Realizar a auditoria prévia completa do pacote de release gerado pelo WXT, validando sua conformidade antes de qualquer aprovação humana para publicação.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Executa builds determinísticos em ambiente limpo (`pnpm run build`).
  - Inspeciona o diretório de saída `.output/` e os pacotes `.zip` gerados.
  - Valida o manifesto `manifest.json` empacotado contra permissões não autorizadas.
  - Emite o Certificado de Elegibilidade de Release (`ELEGÍVEL` ou `NÃO ELEGÍVEL`).
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - **Proibição absoluta:** Não realiza o envio (upload), push para branches de release ou publicação externa de forma autônoma. Essa ação requer aprovação e execução do usuário humano.
  - Não desenvolve os componentes do aplicativo (responsabilidade de `implementation`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Ao término de um milestone com previsão de entrega de pacote distribuível (ex.: M8).
- Na geração de pacotes zip para testes manuais no navegador via `pnpm run zip`.
- Antes de submeter uma nova versão para homologação em lojas de extensões.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Em builds locais corriqueiros de desenvolvimento iterativo (`pnpm run dev`).
- Em auditorias pontuais de diff de código em PRs ➔ Encaminhar para `code-review`.

## 5. Pré-requisitos Técnicos Mandatórios
- Framework WXT e TypeScript operacionais (`pnpm run build` e `pnpm run zip`).
- Todas as suítes de testes unitários e scanners de segurança previamente aprovados com exit code 0.

## 6. Fontes de Verdade e Referências Normativas
- `GEMINI.md`: Seção 16.4 (Publicação) e Seção 18 (Critérios de Conclusão).
- `docs/architecture/HARNESS-ARCHITECTURE.md`: Seção 13 (Release e Publicação Controlada).

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Diretório de saída gerado pelo WXT (`.output/`) e checklist de release do marco.
- **Contexto Opcional Permitido**: Changelog atualizado e número de versão semântica em `package.json`.
- **Permissões Necessárias**: Shell Execution (para `pnpm run build` e `pnpm run zip`) e Read-Only para inspeção de arquivos.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Certificado de Elegibilidade de Release detalhado em relatório ou parecer.
- **Formato do Parecer**:
  - Resumo de integridade do build (tamanho do pacote, arquivos empacotados).
  - Confirmação de ausência de testes, notas privadas ou caminhos de host no pacote.
  - Status formal: `ELEGÍVEL PARA PUBLICAÇÃO` ou `NÃO ELEGÍVEL (BLOQUEADO)`.
- **Estados Operacionais Possíveis**: Concluído com Sucesso (Elegível) | Bloqueado por Violação de Integridade.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Confirmar se `package.json`, `wxt.config.ts` e changelog estão consistentes.
2. Certificar-se de que não existem alterações pendentes não testadas.
### Fase 2: Execução Técnica Padronizada
3. Executar o build de produção: `pnpm run build`.
4. Executar o empacotamento: `pnpm run zip`.
5. *Inspeção do Diretório `.output/`:*
   - Verificar se o `manifest.json` reflete as permissões mínimas aprovadas.
   - Realizar varredura garantindo que nenhum arquivo de teste (`*.test.*`), diretório `.local/` ou documentação interna foi incorporado.
6. Executar varredura do guardião de segurança sobre os artefatos de saída.
### Fase 3: Quality Gate e Verificação Mecânica
7. Consolidar os resultados de compilação, lint e segurança.
8. Emitir o parecer de elegibilidade submetendo-o à decisão soberana do engenheiro humano.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `pnpm run build` | Compilar a extensão em modo de produção | Execução | Exit code 0, pasta `.output/` limpa |
| `pnpm run zip` | Gerar o arquivo zip distribuível | Execução | Arquivo `.zip` gerado sem erros |
| `node scripts/security/publication-guard.mjs all` | Auditar conformidade de segurança global | Execução | Guardião aprovado sem violações |

## 11. Limitações do Runtime e Princípios de Isolamento
- O sucesso de todas as validações técnicas atesta a qualidade do pacote, mas **nunca autoriza o upload ou deploy automático**. O ato de publicação permanece uma prerrogativa exclusivamente humana.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Arquivo de teste dentro de `.output/` | Varredura de arquivos no bundle | Bloqueio imediato; status `NÃO ELEGÍVEL` | Sim (Bloqueia Release) |
| Permissão experimental no manifesto | Inspeção de `manifest.json` | Bloquear e exigir remoção da permissão | Sim (Bloqueia Release) |
| Falha no comando `pnpm run build` | Exit code !== 0 no compilador WXT | Paralisar e registrar log de erro | Sim (Bloqueia Release) |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Proibição absoluta de declarar um pacote como elegível sem demonstrar a saída limpa dos comandos de build e zip.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Inclusão de chaves privadas ou dados de ambiente de desenvolvimento no pacote `.zip` distribuído para o público.
- **Controle Preventivo**: Regras rigorosas de exclusão no WXT e varredura automatizada pré-zip.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Compilação de build e geração de zip concluídas com sucesso.
- [ ] Ausência comprovada de artefatos de desenvolvimento no bundle final.
- [ ] Certificado formal de elegibilidade emitido aguardando aprovação humana.

## 16. Cenários de Validação Comportamental Vinculados
- SC-14: Bloqueio imediato de prontidão de release se `.output/` contiver arquivos de teste ou pastas privadas.

## 17. Regras de Manutenção e Evolução
- Atualizações nos parâmetros de build do WXT devem ser refletidas nos passos de verificação desta skill.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T11`.
