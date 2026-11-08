---
name: public-repository-safety
description: >-
  Use esta skill para auditar e garantir a segurança do repositório público do ExtensionTools,
  impedindo vazamentos de segredos, tokens, caminhos privados e dados confidenciais via Git.
---

# Public Repository Safety — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `public-repository-safety`
- **Escopo**: Harness ExtensionTools (`.harness/skills/public-repository-safety/`)
- **Papel Arquitetural**: Salvaguarda contra vazamento de informações confidenciais em repositório público.
- **Agentes Consumidores Primários**: `security-auditor`, `developer`, `release-engineer`, `script-engineer`
- **Nível de Criticidade de Governança**: Crítico
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: O ExtensionTools é um repositório público. O versionamento inadvertido de credenciais, chaves privadas, caminhos locais ou termos corporativos causa danos graves de confidencialidade e segurança.
- **Objetivo da Operação**: Prevenir, detectar e bloquear a inclusão de segredos, arquivos sensíveis e identificadores restritos antes de operações de commit, push ou release.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Executa a suíte de scanners de segurança desenvolvida na fase H1 (`scripts/security/`).
  - Audita arquivos staged no Git index contra segredos, caminhos absolutos e padrões confidenciais.
  - Verifica a conformidade de commits destinados a push remoto.
  - Assegura a redação (mascaramento) de dados sensíveis em logs de erro para evitar vazamento em relatórios.
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - Não audita vulnerabilidades internas de React ou XSS no código da aplicação (`security-audit`).
  - Não substitui os hooks mecânicos executáveis instalados no Git (`.githooks/`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Antes de adicionar arquivos ao Git index (`git add`) e antes de realizar commits (`git commit`).
- Antes de enviar alterações para o repositório remoto (`git push`).
- Durante auditorias preventivas de segurança do workspace ou preparação de releases públicas.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Não há exclusões em operações que tocam arquivos versionados. Todas as alterações submetidas ao Git devem passar pelas verificações de segurança pública.

## 5. Pré-requisitos Técnicos Mandatórios
- Scanners da fase H1 operacionais em `scripts/security/`.
- Configuração pública em `.harness/config/repository-safety.config.json` e arquivo privado em `.local/` (quando existente).

## 6. Fontes de Verdade e Referências Normativas
- `GEMINI.md`: Seção 2 (Regra Máxima — Repositório Público) e Seção 10 (Segurança e Prevenção de Vazamentos).
- `docs/Relatorios/m2/phase-1-scanners/H1-REPOSITORY-SAFETY-REPORT.md`: Relatório canônico da esteira de scanners.

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**: Arquivos staged no Git index, lista de arquivos modificados ou diretório a auditar.
- **Contexto Opcional Permitido**: Parâmetros de modo de execução (`staged`, `outgoing` ou `all`).
- **Permissões Necessárias**: Shell Execution (para execução dos scripts ESM de segurança).

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**: Diagnóstico limpo de publicação do guardião ou relatório de bloqueio com valores sensíveis redigidos.
- **Formato do Parecer**:
  - Resumo de arquivos examinados por scanner.
  - Confirmação de exit code 0 ou lista de violações identificadas.
  - Parecer conclusivo: `APROVADO PARA COMMIT/PUSH` ou `BLOQUEADO (FAIL-CLOSED)`.
- **Estados Operacionais Possíveis**: Concluído com Sucesso | Bloqueado por Violação de Segurança.

## 9. Procedimento Operacional Passo a Passo
### Fase 1: Reconhecimento e Preflight
1. Inspecionar o estado do Git via `git status --porcelain`.
2. Verificar se arquivos novos possuem sufixos restritos (`*.private.md`, `.local/`) ou extensões proibidas (`.pem`, `.key`, `.env`).
### Fase 2: Execução Técnica Padronizada
3. Executar a suíte de scanners modulares ou o guardião unificado:
   - `node scripts/security/scan-markdown.mjs`
   - `node scripts/security/scan-sensitive-files.mjs`
   - `node scripts/security/scan-secrets.mjs`
   - `node scripts/security/scan-forbidden-references.mjs`
   - `node scripts/security/scan-private-paths.mjs`
   - `node scripts/security/publication-guard.mjs staged`
### Fase 3: Quality Gate e Verificação Mecânica
4. Certificar-se de que o exit code retornado é rigorosamente `0`.
5. Em caso de violação (exit code `1`), paralisar imediatamente a operação (Fail-Closed) e solicitar remediação do dado sensível.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `node scripts/security/publication-guard.mjs staged` | Orquestrar todos os scanners sobre arquivos staged | Execução | Exit code 0, log de aprovação |
| `pnpm run test:security` | Validar a integridade da suíte de scanners | Execução | 14+ testes aprovados no Vitest |
| `git status` / `git diff` | Inspecionar arquivos alterados | Leitura | Nenhum arquivo privado staged |

## 11. Limitações do Runtime e Princípios de Isolamento
- As instruções textuais orientam o desenvolvedor; a barreira real e inegociável de segurança é aplicada pelos hooks mecânicos (`pre-commit` e `pre-push`) e pelo workflow de CI no GitHub Actions.

## 12. Matriz de Tratamento de Erros e Exceções
| Condição Anômala | Detecção Prevista | Resposta Esperada | Condição de Bloqueio |
| :--- | :--- | :--- | :--- |
| Chave de API ou chave privada detectada | Scanner de secrets aciona regex | Bloqueio imediato; mascarar no log; exigir remoção | Sim (Fail-Closed Absoluto) |
| Caminho absoluto local detectado | Scanner de private paths aciona regex | Bloqueio; exigir substituição por caminho relativo | Sim (Fail-Closed) |
| Violação em hook pre-commit | Exit code 1 retornado | Impedir a criação do commit localmente | Sim (Bloqueio do Git) |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Proibição absoluta de utilizar flags de contorno (`--no-verify`, `git add -f`) para forçar a aprovação de arquivos rejeitados pelos scanners.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco**: Vazamento de credenciais nos commits ou logs de ferramentas de CI.
- **Controle Preventivo**: Redação ativa de valores detectados nos scripts de auditoria (`***REDACTED***`).

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Todos os scanners de segurança executados com exit code 0.
- [ ] Nenhum segredo, caminho absoluto ou arquivo privado no índice staged.
- [ ] Parecer de liberação emitido sem ressalvas impeditivas.

## 16. Cenários de Validação Comportamental Vinculados
- SC-10: Bloqueio determinístico diante de chave privada sintética no stage.
- SC-11: Bloqueio diante de caminho absoluto de estação local em documento.

## 17. Regras de Manutenção e Evolução
- Atualizações em padrões de segredos ou termos proibidos devem ser validadas por testes na suíte `tests/harness/security/`.

## 18. Rastreabilidade com Tarefas do Roadmap
- Tarefa correspondente: `M2-P2-T08`.
