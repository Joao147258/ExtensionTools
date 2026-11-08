# Política de Segurança — ExtensionTools

> **Classificação:** Repositório Público  
> **Status:** Regras Mandatórias de Segurança e Prevenção contra Vazamentos (Fase H1)

---

## 1. Princípio Fundamental: Repositório Público

O **ExtensionTools** é um projeto de código aberto mantido publicamente. Todos os commits, branches, issues, pull requests e arquivos versionados estão sujeitos à visibilidade irrestrita.

Portanto, **é estritamente proibido** versionar ou introduzir no projeto:

1. **Segredos e Credenciais**: Chaves de API, senhas, tokens de acesso, tokens JWT, certificados (`.pem`, `.key`, `.pfx`), credenciais de nuvem ou chaves privadas.
2. **Dados Corporativos e Confidenciais**: Nomes de organizações restritas, clientes, contratos, atas, números de atendimento ou transações comerciais.
3. **Identificadores Corporativos Restritos**: Nomes e códigos de sistemas internos ou ambientes privados protegidos por cláusulas de confidencialidade.
4. **Caminhos de Sistema Absolutos e Privados**: Diretórios contendo usernames de máquinas pessoais ou infraestruturas corporativas locais (`/home/<user>/`, `C:\Users\<user>\`).
5. **Backups e Dumps de Bancos de Dados**: Arquivos `.sql`, `.sqlite`, `.dump`, `.bak`, `.backup` ou bases de dados locais.
6. **Dados de Terceiros e PII**: Informações pessoais identificáveis de pessoas reais.
7. **Arquivos Markdown Privados**: Anotações confidenciais com marcadores protegidos (como marcadores de confidencialidade restrita) ou sufixos privados (`.private.md`, `.local.md`).

---

## 2. Política de Classificação de Documentos (Markdown)

Adotamos três níveis de classificação formal:

- **PUBLIC**: Documentos canônicos destinados ao repositório público (e.g. documentação arquitetural, guias públicos, ADRs públicos, definições em `.harness/agents/`).
- **PRIVATE**: Documentos de anotações pessoais ou políticas restritas. Devem permanecer estritamente em `.local/` ou com extensões protegidas como `*.private.md`.
- **RESTRICTED**: Materiais cuja autorização pública ainda não foi deliberada. Bloqueados por padrão pelo Publication Guard.

---

## 3. Scanners Automatizados e Controles de Segurança (Fase H1)

O harness disponibiliza um conjunto determinístico de scanners de segurança em `scripts/security/`:

| Scanner | Script | Responsabilidade |
|---|---|---|
| **Markdown Publication Scanner** | `scan-markdown.mjs` | Bloqueia arquivos `.md` privados, localizados em diretórios proibidos ou com marcadores confidenciais. |
| **Sensitive File Scanner** | `scan-sensitive-files.mjs` | Impede inclusão de extensões sensíveis (`.env`, `.key`, `.pem`, `.bak`, `.sql`, etc.). |
| **Secrets Scanner** | `scan-secrets.mjs` | Detecta chaves de API, tokens e chaves privadas sem expor o conteúdo sensível nas mensagens de erro. |
| **Forbidden Reference Scanner** | `scan-forbidden-references.mjs` | Audita termos confidenciais contra `.local/repository-safety.private.json` sem vazar tokens. |
| **Private Path Scanner** | `scan-private-paths.mjs` | Bloqueia caminhos absolutos do sistema operacional da estação de trabalho. |
| **Publication Guard** | `publication-guard.mjs` | Orquestra todos os scanners contra arquivos staged ou outgoing. |

---

## 4. Proteções no Fluxo Git (Pre-commit e Pre-push)

- **Pre-commit**: Localizado em `.githooks/pre-commit`, inspeciona o conteúdo efetivamente staged no índice antes da criação do commit. Bloqueia tentativas mesmo quando forçadas com `git add -f`.
- **Pre-push**: Localizado em `.githooks/pre-push`, avalia o conjunto de arquivos presentes nos commits destinados ao envio remoto.
- **Configuração dos Hooks**:
  ```bash
  git config core.hooksPath .githooks
  ```

---

## 5. CI / GitHub Actions

O workflow `.github/workflows/security-guard.yml` executa todos os scanners de segurança e a suíte de testes unitários a cada push e pull request.

> [!WARNING]  
> A CI atua como verificação de defesa em profundidade. Ela não impede que um commit enviado seja visto no GitHub. A responsabilidade primária reside nos hooks locais e na disciplina de não expor dados privados.

---

## 6. Procedimento de Divulgação de Vulnerabilidades

Se você identificar qualquer vulnerabilidade de segurança, exposição acidental ou falha de isolamento no ExtensionTools:

1. **Não abra uma Issue pública** descrevendo a vulnerabilidade ou exibindo dados expostos.
2. Comunique privadamente o mantenedor do repositório através do canal privado de segurança designado no perfil do proprietário no GitHub.
3. Se a exposição envolver um segredo ou credencial acidentalmente commitada, informe imediatamente para revogação do segredo e expurgo definitivo do histórico Git utilizando ferramentas especializadas de reescrita.
