# Política Canônica de Segurança em Repositório Público (`repository-safety.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-SEC-01`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `security-auditor` (Aderência obrigatória para todos os agentes)  

---

## 1. Identificação e Finalidade

O projeto **ExtensionTools** é desenvolvido e mantido em repositório público no GitHub. Consequentemente, qualquer artefato, código, commit, documentação, relatório ou histórico versionado está sujeito à inspeção, cópia, auditoria e distribuição por terceiros.

A finalidade desta política é estabelecer a **regra de vazamento zero e proteção Safe-by-Default**, impedindo peremptoriamente a inclusão de dados confidenciais, segredos, credenciais corporativas, identificadores privados ou caminhos de máquinas pessoais no repositório.

---

## 2. Escopo de Aplicação

Esta política aplica-se irrestritamente a:
- Arquivos de código-fonte (`src/`), automação (`scripts/`), testes (`tests/`) e configuração.
- Arquivos de documentação técnica, arquitetura e relatórios em `docs/`.
- Definições de agentes (`.harness/agents/`), skills (`.harness/skills/`), contratos e políticas.
- Mensagens de commit do Git, branches, pull requests e issues.
- Fixtures, mocks e dados sintéticos de teste.
- Artefatos de build gerados (`.output/`) e pacotes distribuíveis ZIP.

---

## 3. Responsabilidades e Papéis

- **`security-auditor`:** Responsável primário pela auditoria estática contínua, governança dos scanners em `scripts/security/` e verificação pré-release.
- **Todos os Agentes Autônomos:** Devem inspecionar preventivamente o diff das suas alterações antes de emitir o contrato de saída.
- **Operador Humano:** Soberano nas aprovações de exceções legítimas registradas no arquivo de configuração.

---

## 4. Regras Obrigatórias e Proibições Absolutas

### 4.1. Proibições Absolutas (Invioláveis)
É expressamente proibido introduzir no repositório:
1. **Credenciais e Segredos:** Tokens de API (GitHub, AWS, etc.), senhas, chaves privadas SSH/RSA/EC, certificados digitais (`.pem`, `.key`, `.pfx`), strings de conexão a bancos de dados.
2. **Identificadores Privados:** Nomes de empresas, clientes reais, sistemas restritos internos, identificadores corporativos proibidos constantes na configuração privada do projeto.
3. **Caminhos Absolutos de Máquinas Locais:** Caminhos específicos de estações de trabalho de usuários (ex: diretórios raiz de usuários locais no Linux/macOS ou perfis de usuários no Windows).
4. **Arquivos Sensíveis e Dumps:** Arquivos `.env` reais, cópias de backup (`.bak`, `.backup`), despejos de bases de dados (`.sql`, `.dump`), arquivos de notas pessoais ou relatórios não saneados.
5. **Dados Reais de Produção:** Qualquer dado de usuário real ou documento confidencial.

### 4.2. Regras Obrigatórias de Construção
1. **Dados Estritamente Sintéticos:** Todo exemplo, teste, fixture e documentação deve utilizar exclusivamente identificadores fictícios (ex: `SampleDocument`, `TestUser`, `example.com`, `SampleFeature`).
2. **Caminhos Estritamente Relativos:** Todos os caminhos de arquivos em código e documentação devem ser resolvidos dinamicamente a partir da raiz do projeto (`projectRoot`).
3. **Redação Ativa em Logs:** Todo diagnóstico, teste ou log que manipular segredos simulados deve aplicar máscara ativa de redação (`***REDACTED***`).

---

## 5. Condições de Ativação

Esta política está **permanentemente ativa** e é fiscalizada de modo mandatório em quatro instâncias:
- **Tempo de Desenvolvimento:** Durante a execução de qualquer tarefa via scanner prévio.
- **Pré-Commit Local:** Disparado pelo hook `.githooks/pre-commit` executando `scripts/security/publication-guard.mjs staged`.
- **Pré-Push Local:** Disparado pelo hook `.githooks/pre-push` executando `scripts/security/publication-guard.mjs outgoing`.
- **Pipeline de Integração Contínua (CI):** Executado em `.github/workflows/security-guard.yml` no modo `all`.

---

## 6. Procedimentos e Comportamentos Esperados

1. **Configuração Unificada:** Os scanners devem ler as regras públicas de `.harness/config/repository-safety.config.json` e incorporar a configuração privada opcional em `.local/repository-safety.private.json`.
2. **Inspeção Autêntica de Blobs:** As verificações do Git devem inspecionar diretamente o conteúdo dos blobs no index (`git cat-file -p`), impedindo que modificações parciais no disco mascarem arquivos staged com violações.
3. **Isolamento de Relatórios Internos:** Documentos detalhados de engenharia interna em `docs/Relatorios/` são classificados como `prohibitedDirectories` para publicação externa pública até a homologação final do release.

---

## 7. Tratamento de Violações e Impedimentos

Se qualquer scanner detectar uma violação de segurança:
1. A operação em curso é **abortada imediatamente com código de saída 1** (*fail-closed*).
2. O agente deve reverter as alterações que causaram a infração e saneá-las com dados sintéticos.
3. É expressamente vedado ao agente tentar desabilitar scanners, modificar regras regex ou alterar arquivos de configuração sem autorização humana formal.
4. Caso o bloqueio dependa de decisão externa, emitir [`impediment-contract.md`](../contracts/impediment-contract.md) com categoria `SECURITY_RESTRICTION` e severidade `CRITICAL`.

---

## 8. Critérios Verificáveis de Conformidade (QG-01)

- [ ] Execução de `pnpm run test:security` com 100% de aprovação (23 testes Vitest passando).
- [ ] Execução de `node scripts/security/publication-guard.mjs staged` retornando código de saída `0`.
- [ ] Zero caminhos absolutos privados detectados por `scan-private-paths.mjs`.
- [ ] Zero segredos ou tokens detectados por `scan-secrets.mjs`.
- [ ] Zero referências corporativas detectadas por `scan-forbidden-references.mjs`.

---

## 9. Referências Cruzadas

- Política Geral: `SECURITY.md` (Política Pública de Segurança)
- Diretrizes para Agentes: `GEMINI.md` (Seção 2 e Seção 10)
- Configuração do Scanner: `.harness/config/repository-safety.config.json`
- Quality Gate Associado: `docs/quality-gates/01-repository-safety.md` (`QG-01`)
- Contratos: [`agent-input-contract.md`](../contracts/agent-input-contract.md) e [`impediment-contract.md`](../contracts/impediment-contract.md)
