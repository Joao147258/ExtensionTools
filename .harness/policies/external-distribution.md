# Política Canônica de Distribuição Externa e Prontidão de Release (`external-distribution.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-DIST-01`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `release-engineer` (Aderência obrigatória para `architect` e `security-auditor`)  

---

## 1. Identificação e Finalidade

O projeto **ExtensionTools** adota a salvaguarda operacional permanente de **Publicação Bloqueada (*Safe-by-Default*)** ao longo de todo o ciclo de desenvolvimento, reservando a distribuição externa para o encerramento do roadmap oficial.

A finalidade desta política é estabelecer a **governança de empacotamento, os requisitos de integridade do pacote ZIP distribuível, o princípio do privilégio mínimo para permissões no Manifest V3 e as regras de prontidão para a Chrome Web Store**, garantindo que nenhum artefato vulnerável, incompleto ou não autorizado seja distribuído.

---

## 2. Escopo de Aplicação

Esta política aplica-se a:
- Configuração do manifesto do Manifest V3 em `wxt.config.ts`.
- Saída do processo de compilação em `.output/`.
- Arquivos de distribuição empacotados (`.zip` gerados por `pnpm run zip` ou WXT).
- Publicação de tags, releases no GitHub e submissões à Chrome Web Store.

---

## 3. Bloqueio Contínuo Safe-by-Default até o Milestone M8

1. **Veto à Distribuição Prematura:**
   - Durante os Milestones M0 a M7, o repositório opera em regime de **PUBLICATION BLOCKED**.
   - É expressamente proibido publicar extensões em canais de distribuição de terceiros, publicar releases públicas no GitHub ou habilitar deploy contínuo de produção antes da conclusão formal do **Milestone M8 (Release Readiness & Distribution)**.
2. **Autorização Exclusiva de Release:**
   - A transição para o estado de distribuição autorizada exige a aprovação do Quality Gate `QG-11 (Release Artifact Integrity)` e homologação expressa do operador humano.

---

## 4. Governança de Permissões no Manifest V3 (Princípio do Menor Privilégio — QG-09)

1. **Baseline Seguro e Mínimo:**
   - A configuração inicial em `wxt.config.ts` mantém a allowlist estrita `permissions: []`.
   - Nenhuma permissão de navegador deve ser declarada preventivamente por conveniência.
2. **Justificativa Obrigatória por ADR:**
   - A adição de qualquer permissão no manifesto (ex: `storage`, `activeTab`, `scripting`, `contextMenus`) exige obrigatoriamente um Architecture Decision Record (ADR) aprovado demonstrando:
     - Por que a permissão é indispensável para o módulo.
     - Que alternativa local menos privilegiada não atende à necessidade.
     - Como a privacidade dos dados do usuário é preservada.
3. **Proibição de Permissões Irrestritas:**
   - É vedado solicitar permissões amplas de acesso a hosts (`<all_urls>`, `*://*/*`) quando o escopo puder ser restrito a eventos ativados pelo usuário (`activeTab`).

---

## 5. Requisitos de Integridade do Pacote Distribuível (QG-11)

Todo arquivo de extensão gerado para distribuição (`.zip`) deve ser auditado em memória pelo `release-engineer` antes da liberação, respeitando as seguintes invariantes:

### 5.1. Conteúdo Permitido no Pacote:
- Arquivos `.js` e `.css` transpilados, otimizados e minificados.
- Assets visuais declarados (`.png`, `.svg`).
- `manifest.json` válido em estrita conformidade com a especificação Manifest V3 do Chromium.
- Páginas HTML de entrypoint compiladas (`sidepanel.html`, etc.).

### 5.2. Proibições Absolutas no Pacote Distribuível:
É terminantemente proibida a presença dentro do arquivo `.zip` de:
1. Arquivos de código-fonte TypeScript originais (`.ts`, `.tsx`).
2. Arquivos de testes automatizados (`*.test.ts`, `tests/`, fixtures).
3. Arquivos de governança interna do Harness (`.harness/`, `.git/`, `.gemini/`, `.githooks/`).
4. Arquivos de documentação interna, rascunhos ou relatórios (`docs/`, `*.md`).
5. Mapas de fonte (*sourcemaps*) apontando para caminhos locais absolutos de desenvolvimento.
6. Arquivos `.env`, credenciais, chaves ou configurações de ambiente.

---

## 6. Procedimentos de Verificação Pré-Release (Preflight Checklist)

Antes de qualquer homologação de release:
1. Executar compilação limpa (`pnpm run build`).
2. Gerar o pacote (`pnpm run zip`).
3. Disparar o auditor estático de artefatos (`scripts/release/verify-release-artifact.mjs` / `QG-11`).
4. Executar varredura completa de segurança no modo `all` (`publication-guard.mjs all`).
5. Formalizar o checklist de prontidão em relatório canônico sob `docs/Relatorios/m8/`.

---

## 7. Tratamento de Violações e Bloqueios

Se o pacote de release contiver arquivos ilegais ou permissões não autorizadas:
1. O Quality Gate `QG-11` reprova com código `1`.
2. O pacote gerado é imediatamente descartado.
3. A esteira bloqueia a publicação e emite [`impediment-contract.md`](../contracts/impediment-contract.md) com categoria `SECURITY_RESTRICTION`.

---

## 8. Critérios Verificáveis de Conformidade (QG-08, QG-09, QG-11)

- [ ] `pnpm run build` gerando bundle íntegro sob `.output/` sem dependências ausentes.
- [ ] 100% das permissões em `manifest.json` justificadas por ADRs em `docs/architecture/adr/`.
- [ ] Pacote ZIP inspecionado com zero arquivos de teste, fontes `.ts` ou relatórios internos.
- [ ] Bloqueio contínuo Safe-by-Default mantido em `status.md` até o Milestone M8.

---

## 9. Referências Cruzadas

- Política Pública: `SECURITY.md`
- Quality Gates: `docs/quality-gates/08-build-integrity.md` (`QG-08`), `09-browser-permissions.md` (`QG-09`) e `11-release-artifact-integrity.md` (`QG-11`)
- Procedimentos: `.harness/skills/release-validation/SKILL.md`
- Contratos: [`impediment-contract.md`](../contracts/impediment-contract.md) e [`agent-output-contract.md`](../contracts/agent-output-contract.md)
