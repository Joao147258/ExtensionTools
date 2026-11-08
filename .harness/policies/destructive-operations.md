# Política Canônica de Prevenção a Operações Destrutivas (`destructive-operations.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-SEC-03`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `script-engineer` e `orchestrator`  

---

## 1. Identificação e Finalidade

O ecossistema do **ExtensionTools** opera sob o princípio de **integridade perpétua do repositório e rastreabilidade total do histórico**.

A finalidade desta política é **proibir terminantemente a execução autônoma de comandos Git e de sistema de arquivos destrutivos**, que possam ocasionar perda irrecuperável de código, corrupção da árvore de commits, descarte de arquivos não monitorados ou enfraquecimento das proteções de segurança.

---

## 2. Escopo de Aplicação

Esta política aplica-se a todos os agentes autônomos, scripts em `scripts/` e execuções no terminal do workspace do repositório ExtensionTools.

*Exceção Legítima:* Testes unitários herméticos do Vitest que operem em diretórios temporários isolados do sistema operacional (`os.tmpdir()`) criados especificamente para simulação de comandos Git (`git-integration.test.ts`).

---

## 3. Comandos e Operações Estritamente Proibidos

### 3.1. Proibições no Git (Veto Irrevogável)
É terminantemente proibido disparar no repositório do projeto:
1. `git reset --hard` (perda arbitrária de modificações locais).
2. `git clean -fd` ou `git clean -xdf` (deleção massiva de arquivos não versionados).
3. `git push --force` ou `git push -f` (reescrita de histórico remoto).
4. `git branch -D` sobre branches principais (`main`, `master`, `development`).
5. `git checkout -f` ou `git restore --staged --worktree .` sem autorização humana formal.
6. Bypass de hooks com flags de escape (`git commit --no-verify`, `git push --no-verify`).

### 3.2. Proibições no Sistema de Arquivos (Filesystem)
1. **Deleção em Massa:** Execução de `rm -rf` sobre a raiz do projeto ou diretórios canônicos estruturais (`.git/`, `.githooks/`, `.harness/`, `docs/`, `src/`).
2. **Uso de Privilégios Elevados:** Uso de comandos `sudo` ou operações que exijam elevação de privilégios de superusuário no sistema operacional.
3. **Sobrescrita Cega:** Sobrescrita de arquivos funcionais pré-existentes sem inspeção prévia de conteúdo (`read_file`) e fundamentação técnica.

---

## 4. Comportamentos Operacionais Autorizados

1. **Reversão Cirúrgica:** Caso uma modificação parcial falhe, o agente deve reverter pontualmente o arquivo afetado utilizando `git checkout -- <caminho-do-arquivo>` ou a ferramenta de edição (`edit_file`).
2. **Deleção Pontual Segura:** A exclusão de arquivos obsoletos ou temporários deve ser realizada especificando o caminho unívoco do arquivo (ex: `rm caminho/especifico/arquivo.ext`), com registro explícito em relatório de evidências.
3. **Ambientes Efêmeros de Teste:** Toda rotina que exija inicialização de repositórios Git, branches de teste ou simulação de commits deve ser encapsulada em `fs.mkdtempSync(path.join(os.tmpdir(), 'prefix-'))` e limpa no bloco `afterEach()` dos testes.

---

## 5. Salvaguarda Fail-Closed e Proteção de Diretórios Críticos

Os seguintes diretórios são considerados **zonas de infraestrutura invioláveis**:
- `.git/`: Gerenciado exclusivamente pelo Git CLI; proibida edição manual de arquivos internos.
- `.githooks/`: Protegido contra deleção ou modificação que desative os scanners de segurança.
- `.harness/config/`: Alterações em `repository-safety.config.json` exigem aprovação humana prévia.

---

## 6. Tratamento de Violações e Incidentes

Se uma tentativa de operação destrutiva for disparada ou detectada:
1. A execução do comando deve ser sumariamente bloqueada ou cancelada.
2. A sessão do agente é interrompida com status `ABORTED`.
3. É registrado um [`impediment-contract.md`](../contracts/impediment-contract.md) com categoria `SECURITY_RESTRICTION` e severidade `CRITICAL`.

---

## 7. Critérios Verificáveis de Conformidade

- [ ] Zero ocorrências de comandos destrutivos em scripts de automação sob `scripts/`.
- [ ] Hooks `.githooks/pre-commit` e `.githooks/pre-push` íntegros e ativos.
- [ ] 100% dos testes do Vitest operando em diretórios temporários isolados em `os.tmpdir()`.

---

## 8. Referências Cruzadas

- Política Geral: `SECURITY.md` (Governança de Integridade)
- Regras Globais: `GEMINI.md` (Seção 15 — Controle de Alterações)
- Procedimentos: `.harness/skills/script-development/SKILL.md`
- Contratos: [`impediment-contract.md`](../contracts/impediment-contract.md)
