# ExtensionTools — Arquitetura do Harness de Desenvolvimento

**Documento:** `HARNESS-ARCHITECTURE.md`  
**Projeto:** ExtensionTools  
**Classificação:** Público  
**Status:** Arquitetura proposta  
**Escopo:** Governança, automação, agentes, skills, segurança e qualidade do desenvolvimento

---

# 1. Propósito

O harness do ExtensionTools será a infraestrutura responsável por orientar, executar, verificar e governar o desenvolvimento do projeto.

Ele não representa a arquitetura funcional da extensão, mas o ambiente de engenharia que sustenta sua implementação e evolução.

Seu objetivo é garantir que o desenvolvimento assistido por agentes de inteligência artificial seja:

- Organizado e reproduzível.
- Orientado por especificações e decisões documentadas.
- Seguro para um repositório público.
- Verificável por testes e validações automatizadas.
- Consistente com a arquitetura do produto.
- Independente de conhecimento implícito dos agentes.
- Auditável por desenvolvedores humanos.
- Capaz de detectar violações antes que sejam publicadas.
- Sustentável durante a evolução do projeto.

**Princípio central: nenhum agente, script ou alteração de código está acima das políticas de segurança, qualidade e arquitetura do projeto.**

A responsabilidade final pelas decisões, alterações e publicações permanece humana.

---

# 2. Natureza pública do projeto

## 2.1. Regra fundamental

O ExtensionTools será desenvolvido em um repositório público no GitHub.

Todo arquivo versionado deverá ser considerado potencialmente acessível por qualquer pessoa.

Isso inclui:

- Código-fonte.
- Documentação.
- Comentários de código.
- Testes automatizados.
- Fixtures.
- Exemplos.
- Prompts de agentes.
- Definições de skills.
- Scripts.
- Logs publicados.
- Relatórios de desenvolvimento.
- Artefatos de CI.
- Histórico de commits.
- Mensagens de commit.
- Pull requests e issues.
- Capturas de tela e outros arquivos de mídia.

A ausência de informações sensíveis na versão atual dos arquivos não garante que elas nunca tenham sido publicadas.

**O histórico Git também faz parte da superfície de exposição.**

## 2.2. Informações estritamente proibidas

É proibido publicar:

1. Nomes, identificadores e referências de organizações internas não autorizadas.
2. Nomes de sistemas corporativos, produtos internos ou soluções proprietárias não autorizadas.
3. Dados de clientes, fornecedores, funcionários ou usuários reais sem base legítima e autorização específica.
4. Chamados, históricos, registros de atendimento ou documentos internos.
5. XMLs, logs, backups, planilhas ou documentos provenientes de ambientes corporativos.
6. Certificados digitais, chaves privadas ou seus conteúdos.
7. Credenciais, senhas, tokens e segredos.
8. Chaves de API, tokens OAuth e credenciais de integração.
9. Strings de conexão que contenham informações sensíveis.
10. Endereços internos de rede, servidores privados e infraestrutura restrita.
11. Caminhos absolutos que revelem usuários, organizações, estações de trabalho ou diretórios privados.
12. Dados extraídos de sistemas internos utilizados como exemplos ou fixtures.
13. Informações confidenciais inseridas em comentários, mensagens de teste ou documentação.
14. Instruções privadas de agentes ou arquivos de configuração internos.
15. Qualquer conteúdo cuja publicação viole obrigações profissionais, contratuais ou de confidencialidade.

Essa política também se aplica a conteúdos gerados por IA.

### Proibição de identificadores corporativos

O projeto deverá possuir uma política privada de termos e padrões proibidos.

Os identificadores reais definidos nessa política não poderão aparecer:

- No código.
- Na documentação.
- Nos comentários.
- Nos testes.
- Nas fixtures.
- Nos prompts públicos.
- Nos relatórios.
- Nos nomes de arquivos.
- Nos caminhos.
- Nos commits.
- Nos exemplos.
- Nos artefatos de build.

A própria lista literal desses identificadores não deverá ser publicada no repositório.

Sua manutenção ocorrerá em configuração local privada, fora do controle de versão.

### Princípio de generalização

O ExtensionTools deverá permanecer um produto genérico de produtividade.

Suas funcionalidades poderão atender necessidades como:

- Organização de documentos.
- Visualização de Markdown.
- Análise estrutural de XML e JSON.
- Comparação de textos.
- Captura de páginas.
- Gerenciamento de referências.
- Organização de diretórios locais.
- Documentação de investigações.

Nenhuma dessas funcionalidades dependerá de um sistema corporativo específico.

Exemplos e testes deverão utilizar exclusivamente dados sintéticos.

---

# 3. Objetivos arquiteturais do harness

O harness terá sete objetivos principais.

## 3.1. Governança

Estabelecer regras explícitas sobre o que os agentes podem executar, modificar, criar e publicar.

## 3.2. Segurança preventiva

Identificar riscos de exposição antes que informações sejam adicionadas ao repositório ou enviadas a serviços externos.

## 3.3. Qualidade verificável

Garantir que alterações sejam avaliadas por testes, verificações estáticas e critérios de aceitação.

## 3.4. Integridade arquitetural

Detectar violações de responsabilidades, dependências e limites dos módulos.

## 3.5. Automação reproduzível

Transformar tarefas repetitivas em operações determinísticas e verificáveis.

## 3.6. Documentação rastreável

Manter especificações, decisões, relatórios e estado real do projeto consistentes.

## 3.7. Evolução controlada

Permitir desenvolver novas funcionalidades sem comprometer os módulos existentes ou enfraquecer as verificações.

---

# 4. Modelo conceitual do harness

O harness será composto por cinco camadas.

```text
                   DESENVOLVEDOR HUMANO
                            |
                            v
                GOVERNANÇA E INSTRUÇÕES
                 AGENTS.md / Políticas
                            |
                            v
                    AGENTES DE IA
            Planejamento / Implementação
              Revisão / Testes / Segurança
                            |
                            v
                    SKILLS TÉCNICAS
           Procedimentos e conhecimentos
                            |
                            v
                 SCRIPTS E FERRAMENTAS
          Automação / Testes / Auditorias
                            |
                            v
                 QUALITY & SECURITY GATES
       Segurança / Arquitetura / Integridade
                            |
                            v
                   PUBLICAÇÃO CONTROLADA
                     Git / GitHub / CI
```

Os agentes utilizarão as skills para orientar suas atividades.

As skills poderão invocar scripts especializados.

Os scripts produzirão resultados verificáveis.

Os quality gates avaliarão esses resultados.

A publicação somente deverá ocorrer após as verificações obrigatórias e a revisão apropriada.

**Nenhum agente poderá ignorar um quality gate ou reduzir seu rigor apenas para concluir uma tarefa.**

---

# 5. Estrutura de diretórios

A organização inicial proposta é:

```text
extension-tools/
|
├── AGENTS.md
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
├── package.json
├── .gitignore
├── .gitattributes
|
├── .harness/
│   |
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── architect.md
│   │   ├── developer.md
│   │   ├── code-reviewer.md
│   │   ├── test-engineer.md
│   │   ├── security-auditor.md
│   │   ├── documentation-engineer.md
│   │   ├── script-engineer.md
│   │   └── release-engineer.md
│   │
│   ├── skills/
│   │   ├── implementation/
│   │   │   └── SKILL.md
│   │   ├── architecture-review/
│   │   │   └── SKILL.md
│   │   ├── code-review/
│   │   │   └── SKILL.md
│   │   ├── testing/
│   │   │   └── SKILL.md
│   │   ├── security-audit/
│   │   │   └── SKILL.md
│   │   ├── public-repository-safety/
│   │   │   └── SKILL.md
│   │   ├── documentation/
│   │   │   └── SKILL.md
│   │   ├── script-development/
│   │   │   └── SKILL.md
│   │   └── release-validation/
│   │       └── SKILL.md
│   │
│   ├── policies/
│   │   ├── security.md
│   │   ├── architecture.md
│   │   ├── testing.md
│   │   ├── documentation.md
│   │   ├── repository-safety.md
│   │   └── agent-execution.md
│   │
│   ├── contracts/
│   │   ├── agent-contract.md
│   │   ├── skill-contract.md
│   │   ├── script-contract.md
│   │   └── report-contract.md
│   │
│   └── templates/
│       ├── implementation-report.md
│       ├── review-report.md
│       ├── security-report.md
│       └── adr-template.md
|
├── scripts/
│   ├── automation/
│   ├── security/
│   ├── quality/
│   ├── architecture/
│   ├── documentation/
│   ├── release/
│   └── lib/
|
├── tests/
│   ├── harness/
│   │   ├── automation/
│   │   ├── security/
│   │   ├── quality/
│   │   ├── architecture/
│   │   └── fixtures/
│   │
│   ├── unit/
│   ├── integration/
│   └── e2e/
|
├── docs/
│   ├── architecture/
│   │   ├── HARNESS-ARCHITECTURE.md
│   │   ├── PRODUCT-ARCHITECTURE.md
│   │   └── adr/
│   │
│   ├── product/
│   ├── features/
│   ├── development/
│   └── reports/
|
├── .github/
│   ├── workflows/
│   │   ├── quality.yml
│   │   ├── security.yml
│   │   └── release.yml
│   │
│   └── pull_request_template.md
|
├── .local/
│   └── [conteúdo privado ignorado]
|
├── src/
└── public/
```

## 5.1. Responsabilidade dos diretórios

| Diretório | Responsabilidade |
|---|---|
| `.harness/agents` | Definições dos agentes |
| `.harness/skills` | Procedimentos especializados |
| `.harness/policies` | Políticas obrigatórias |
| `.harness/contracts` | Contratos de execução |
| `.harness/templates` | Estruturas de documentos |
| `scripts/automation` | Automação operacional |
| `scripts/security` | Prevenção de vazamentos e auditorias |
| `scripts/quality` | Verificações de qualidade |
| `scripts/architecture` | Verificações arquiteturais |
| `scripts/documentation` | Consistência documental |
| `scripts/release` | Preparação de publicação |
| `scripts/lib` | Utilitários compartilhados |
| `tests/harness` | Testes do próprio harness |
| `.github/workflows` | Verificações de integração contínua |
| `.local` | Arquivos privados e não versionados |

## 5.2. Separação entre público e privado

O repositório deverá conter exclusivamente configurações publicáveis.

Arquivos privados ficarão em `.local/`, ignorada integralmente pelo Git.

Essa pasta poderá conter:

- Configurações específicas da máquina.
- Diretórios absolutos.
- Parâmetros privados.
- Listas confidenciais de termos proibidos.
- Relatórios locais com informações restritas.
- Dados temporários de execução.
- Configurações de ferramentas não publicáveis.

A proteção por `.gitignore` não será considerada suficiente.

Os scripts de segurança também deverão verificar arquivos adicionados explicitamente, conteúdos versionados e artefatos de publicação.

**A pasta `.local/` não deverá conter informações profissionais reais a menos que isso seja autorizado e exista uma justificativa operacional.**

A política preferencial será não incorporar esses dados ao ambiente de desenvolvimento pessoal.

---

# 6. Arquitetura dos agentes

Os agentes serão componentes especializados de execução e análise.

Eles não serão considerados autoridades independentes nem terão permissão irrestrita para alterar o projeto.

## 6.1. Orchestrator

**Responsabilidade:** coordenar trabalhos que envolvam múltiplas competências.

Atribuições:

- Interpretar a solicitação.
- Identificar o escopo.
- Consultar a documentação canônica.
- Definir etapas.
- Selecionar agentes especializados.
- Acompanhar dependências.
- Consolidar os resultados.
- Solicitar verificações.
- Reportar bloqueios e incertezas.

Não deverá substituir os mecanismos automáticos de validação.

## 6.2. Architect

**Responsabilidade:** preservar e evoluir a arquitetura do ExtensionTools.

Atribuições:

- Avaliar limites dos módulos.
- Revisar responsabilidades.
- Identificar acoplamento indevido.
- Avaliar trade-offs técnicos.
- Propor decisões arquiteturais.
- Elaborar ADRs.
- Examinar impactos de mudanças estruturais.

Não deverá introduzir camadas ou abstrações sem necessidade demonstrável.

## 6.3. Developer

**Responsabilidade:** implementar funcionalidades conforme especificações aprovadas.

Atribuições:

- Desenvolver código.
- Respeitar contratos.
- Preservar responsabilidades.
- Implementar tratamento de erros.
- Executar testes pertinentes.
- Atualizar documentação relacionada.
- Reportar limitações.

Não poderá considerar uma implementação concluída apenas porque compila.

## 6.4. Code Reviewer

**Responsabilidade:** avaliar a qualidade das alterações.

Atribuições:

- Identificar defeitos.
- Revisar comportamento.
- Examinar legibilidade.
- Identificar duplicações.
- Verificar responsabilidades.
- Avaliar cobertura de cenários.
- Verificar riscos de regressão.

Deverá distinguir problemas reais de preferências estilísticas.

## 6.5. Test Engineer

**Responsabilidade:** projetar e avaliar testes automatizados.

Atribuições:

- Definir estratégias de teste.
- Implementar testes unitários.
- Implementar testes de integração.
- Desenvolver testes negativos.
- Avaliar testes de segurança.
- Verificar cobertura relevante.
- Identificar falsos positivos.
- Utilizar mutation testing quando justificável.

Não deverá perseguir percentuais de cobertura isoladamente, sem avaliar a capacidade dos testes de detectar defeitos.

## 6.6. Security Auditor

**Responsabilidade:** identificar vulnerabilidades e riscos de exposição.

Atribuições:

- Revisar permissões da extensão.
- Verificar dependências.
- Examinar tratamento de dados.
- Auditar a superfície de publicação.
- Verificar riscos de execução de conteúdo.
- Executar verificações de segurança.
- Avaliar o isolamento entre configurações públicas e privadas.

Deverá bloquear publicações que violem políticas obrigatórias.

## 6.7. Documentation Engineer

**Responsabilidade:** manter a documentação coerente com o projeto.

Atribuições:

- Atualizar documentos arquiteturais.
- Revisar documentação técnica.
- Detectar inconsistências.
- Verificar links internos.
- Identificar informações desatualizadas.
- Elaborar relatórios.
- Preservar a rastreabilidade das decisões.

Não deverá apresentar comportamentos planejados como funcionalidades implementadas.

## 6.8. Script Engineer

**Responsabilidade:** desenvolver e manter automações.

Atribuições:

- Implementar scripts.
- Definir interfaces de execução.
- Desenvolver testes dos scripts.
- Validar operações destrutivas.
- Garantir portabilidade.
- Implementar diagnósticos de falha.
- Documentar entradas e saídas.

Scripts deverão ser tratados como software de produção.

## 6.9. Release Engineer

**Responsabilidade:** preparar e verificar publicações.

Atribuições:

- Executar o pipeline completo.
- Conferir artefatos.
- Verificar versões.
- Inspecionar conteúdo distribuído.
- Revisar changelog.
- Examinar riscos de publicação.
- Produzir relatório de prontidão.

Não poderá ignorar resultados negativos de segurança ou qualidade.

---

# 7. Contrato obrigatório dos agentes

Todo agente deverá declarar:

1. Nome.
2. Missão.
3. Escopo.
4. Responsabilidades.
5. Entradas esperadas.
6. Saídas esperadas.
7. Ferramentas autorizadas.
8. Skills utilizadas.
9. Limites de execução.
10. Verificações obrigatórias.
11. Critérios de conclusão.
12. Política de segurança aplicável.

## 7.1. Regras universais

Todos os agentes deverão:

- Consultar as instruções canônicas.
- Respeitar as políticas de segurança.
- Trabalhar apenas no escopo autorizado.
- Evitar alterações não relacionadas.
- Preservar decisões arquiteturais existentes.
- Não inventar resultados de testes.
- Não ocultar falhas.
- Não enfraquecer verificações para obter aprovação.
- Não publicar dados privados.
- Não solicitar credenciais sem necessidade legítima.
- Não executar comandos destrutivos sem autorização adequada.
- Não enviar informações locais para serviços externos sem aprovação.
- Executar as verificações pertinentes antes de concluir.
- Documentar alterações relevantes.
- Informar o que foi verificado e o que permaneceu pendente.

## 7.2. Política de execução

As ações serão classificadas em:

**Leitura:** inspeção de arquivos e documentação autorizados.

**Modificação controlada:** alterações dentro do escopo solicitado.

**Operação sensível:** alterações de permissões, dependências críticas, configurações de segurança ou arquivos de governança.

**Operação externa:** publicação, envio de informações, execução remota ou alteração de serviços.

Operações sensíveis e externas exigirão autorização compatível com seu impacto.

---

# 8. Arquitetura das skills

Skills serão procedimentos reutilizáveis que descrevem como executar determinadas atividades.

Uma skill não será apenas um prompt genérico.

Ela deverá registrar um método de trabalho verificável.

## 8.1. Contrato de uma skill

Cada skill deverá conter:

- Identificação.
- Objetivo.
- Condições de ativação.
- Pré-requisitos.
- Entradas.
- Procedimento.
- Ferramentas permitidas.
- Validações.
- Condições de falha.
- Saídas esperadas.
- Critérios de conclusão.
- Restrições de segurança.

## 8.2. Skills essenciais

### Implementation

Orienta o desenvolvimento incremental de funcionalidades.

### Architecture Review

Analisa responsabilidades, dependências, limites e decisões.

### Code Review

Define critérios para inspeção técnica e avaliação de alterações.

### Testing

Orienta criação, execução e revisão de testes.

### Security Audit

Define procedimentos de auditoria de código e configuração.

### Public Repository Safety

Especializada em prevenção de exposição de informações sensíveis.

Deverá ser aplicada antes de commits, publicação e distribuição.

### Documentation

Orienta atualização de documentação e relatórios.

### Script Development

Define padrões obrigatórios para desenvolvimento e teste de scripts.

### Release Validation

Define o processo de verificação anterior a uma publicação.

## 8.3. Reutilização

Uma skill poderá ser utilizada por múltiplos agentes.

Não deverão ser criadas cópias desnecessárias de procedimentos.

As regras de governança deverão permanecer centralizadas, enquanto cada agente apenas as referencia.

---

# 9. Arquitetura dos scripts

Os scripts serão os mecanismos executáveis de automação e verificação.

Deverão ser preferencialmente implementados em Node.js com JavaScript ESM ou TypeScript, conforme as necessidades concretas.

A padronização deverá considerar compatibilidade entre Windows, Linux e macOS.

## 9.1. Script contract

Todo script deverá possuir:

- Objetivo definido.
- Interface de execução documentada.
- Entradas explícitas.
- Saídas previsíveis.
- Código de retorno padronizado.
- Tratamento de erros.
- Mensagens de diagnóstico.
- Ausência de dependências ocultas.
- Testes automatizados.
- Comportamento seguro para execução repetida.

### Códigos de saída

- `0`: sucesso.
- `1`: violação ou falha de validação.
- `2`: erro operacional ou configuração inválida.

Outros códigos deverão ser documentados.

## 9.2. Automação

Os scripts de automação poderão executar:

- Preparação do ambiente.
- Verificação de dependências.
- Organização de tarefas.
- Execução sequencial de validações.
- Geração de relatórios.
- Atualização de documentação derivada.
- Preparação de builds.
- Validação pré-commit.
- Validação pré-push.
- Preparação de release.

Não deverão executar publicação automaticamente apenas porque todas as verificações passaram.

## 9.3. Scripts de segurança

### Repository Leak Scanner

Detectar informações inadequadas em:

- Arquivos versionados.
- Alterações staged.
- Arquivos de configuração.
- Documentação.
- Comentários.
- Fixtures.
- Artefatos de build.
- Relatórios destinados à publicação.

### Secrets Scanner

Detectar possíveis:

- Tokens.
- Senhas.
- Chaves privadas.
- Credenciais.
- Strings de conexão sensíveis.
- Segredos incorporados ao código.

### Absolute Path Scanner

Identificar caminhos absolutos potencialmente privados.

Exemplos de categorias:

- Diretórios pessoais de sistemas Unix.
- Diretórios de perfis do Windows.
- Caminhos específicos de máquinas.
- Diretórios de sincronização privados.
- Caminhos de infraestrutura corporativa.

Não deverá confundir indiscriminadamente qualquer caminho técnico válido com um vazamento.

Exceções precisarão ser restritas, justificadas e verificáveis.

### Forbidden Reference Scanner

Detectar identificadores corporativos proibidos.

Deverá suportar:

- Termos exatos.
- Variações de maiúsculas e minúsculas.
- Normalização Unicode.
- Variações simples de separadores.
- Identificadores configurados privadamente.

A lista de termos reais permanecerá fora do repositório.

O scanner genérico poderá ser público, mas suas configurações confidenciais não.

### Sensitive File Scanner

Identificar arquivos que não devem ser publicados.

Exemplos:

- Arquivos de credenciais.
- Certificados com chave privada.
- Backups.
- Dumps.
- Arquivos de ambiente privados.
- Configurações locais.
- Arquivos binários de origem desconhecida.
- Documentos corporativos não autorizados.

A identificação deverá considerar extensão, nome, assinatura e localização quando aplicáveis.

### Artifact Scanner

Inspecionar os arquivos efetivamente produzidos pelo build.

A verificação não deverá se limitar ao diretório `src`.

---

# 10. Proteções do repositório público

A prevenção de vazamentos deverá utilizar múltiplas camadas.

## 10.1. Primeira camada — Configuração

- `.gitignore` rigoroso.
- Arquivos de exemplo sem credenciais reais.
- Configurações privadas fora do versionamento.
- Separação entre variáveis públicas e privadas.
- Exclusão de arquivos temporários.
- Ausência de dados reais em fixtures.

## 10.2. Segunda camada — Verificação local

Antes de um commit, deverão ser executadas verificações sobre o conteúdo staged.

Antes de um push, deverão ser executadas verificações sobre os commits a enviar e o conteúdo relevante do repositório.

Essas verificações deverão detectar violações sem publicar os valores detectados nos logs.

## 10.3. Terceira camada — CI

O GitHub Actions deverá executar verificações gerais de segurança e qualidade.

Incluindo:

- Secret scanning.
- Verificação de arquivos sensíveis.
- Análise de dependências.
- Testes dos scripts de segurança.
- Verificações de qualidade.
- Build.
- Inspeção dos artefatos produzidos.

A CI pública não deverá depender de segredos privados em workflows de pull requests não confiáveis.

Verificações que dependam de listas privadas deverão ocorrer somente em ambientes autorizados.

## 10.4. Quarta camada — Inspeção de publicação

Antes de publicar uma release:

- Inspecionar o conjunto de arquivos distribuídos.
- Verificar o conteúdo do pacote final.
- Conferir relatórios de segurança.
- Confirmar ausência de arquivos privados.
- Conferir permissões de extensão.
- Verificar integridade do build.
- Revisar mudanças relevantes.

## 10.5. Quinta camada — Histórico Git

Antes da primeira publicação pública, deverá ocorrer uma auditoria do histórico.

A auditoria deverá procurar:

- Segredos removidos posteriormente.
- Arquivos privados previamente versionados.
- Referências proibidas em commits antigos.
- Dados expostos em mensagens de commit.
- Conteúdos sensíveis em objetos históricos.

Remover informações da versão atual do arquivo não significa removê-las do histórico.

A reescrita do histórico será uma operação excepcional, revisada e executada de forma controlada.

Se um segredo real tiver sido exposto, sua revogação ou rotação será necessária conforme o caso, independentemente de tentativas de removê-lo do Git.

## 10.6. Limites da proteção

Nenhum scanner garante a identificação de todos os conteúdos confidenciais.

As verificações automáticas serão controles preventivos, não substitutos da revisão humana.

Uma configuração privada ausente não deverá ser silenciosamente interpretada como uma auditoria privada bem-sucedida.

Nesse caso, o resultado deverá informar explicitamente que a verificação específica não foi realizada.

Para publicações do mantenedor, a ausência dessa verificação obrigatória deverá bloquear o procedimento.

---

# 11. Scripts de qualidade

## 11.1. Quality Verify

Orquestrar as verificações obrigatórias de código.

Deverá executar, quando aplicável:

- Typecheck.
- Lint.
- Testes.
- Build.
- Verificações arquiteturais.
- Auditoria de segurança.
- Integridade documental.

## 11.2. Architecture Boundaries

Verificar dependências entre módulos.

Exemplos:

- Módulos de domínio não dependerem diretamente das APIs do navegador.
- Adaptadores respeitarem interfaces estabelecidas.
- Módulos não acessarem detalhes internos de outros módulos sem contrato.
- Componentes compartilhados não criarem dependências circulares.
- Infraestrutura não se tornar dependência indevida das regras de negócio.

As regras deverão ser derivadas da arquitetura efetivamente aprovada.

## 11.3. Dependency Integrity

Verificar:

- Integridade de dependências.
- Coerência do lockfile.
- Dependências não utilizadas, quando detectáveis.
- Vulnerabilidades conhecidas.
- Licenças incompatíveis com a distribuição pretendida.
- Dependências inesperadas.

## 11.4. Documentation Integrity

Verificar:

- Links internos quebrados.
- Documentos obrigatórios ausentes.
- Referências a caminhos inexistentes.
- Nomes de módulos desatualizados.
- Inconsistências entre instruções públicas.
- Duplicação indevida de documentos canônicos.

## 11.5. Harness Integrity

Verificar a própria infraestrutura do harness.

Incluindo:

- Agentes sem contrato.
- Skills inválidas.
- Scripts sem testes.
- Comandos documentados inexistentes.
- Scripts referenciados que foram removidos.
- Políticas obrigatórias não referenciadas.
- Duplicação ou divergência de instruções.
- Configurações locais incluídas indevidamente no Git.

---

# 12. Testes dos próprios scripts

Os scripts de segurança e qualidade deverão possuir testes automatizados.

Essa exigência é obrigatória porque um verificador defeituoso pode produzir uma falsa sensação de segurança.

## 12.1. Testes positivos

Verificar que conteúdos permitidos não sejam bloqueados incorretamente.

Exemplos:

- Documentação pública.
- Caminhos relativos válidos.
- Fixtures sintéticas.
- Código sem credenciais.
- Configurações públicas autorizadas.

## 12.2. Testes negativos

Verificar que violações sejam detectadas.

Exemplos:

- Credenciais fictícias com formatos reconhecíveis.
- Caminhos absolutos sintéticos.
- Arquivos privados simulados.
- Identificadores fictícios classificados como proibidos.
- Documentação contendo referências inválidas.
- Violações artificiais de dependência arquitetural.

Nenhum teste deverá conter segredos reais ou informações corporativas.

## 12.3. Testes de regressão

Todo defeito identificado no harness deverá, quando possível, produzir um teste que impeça sua recorrência.

## 12.4. Testes de falha operacional

Verificar:

- Configurações ausentes.
- Arquivos inacessíveis.
- Permissões insuficientes.
- Entradas inválidas.
- Processos interrompidos.
- Dependências ausentes.
- Falhas em ferramentas externas.

Uma falha operacional não poderá ser tratada como uma verificação bem-sucedida.

## 12.5. Mutation testing

Quando adequado, mutation testing poderá avaliar se os testes detectam alterações incorretas no comportamento dos verificadores.

Os verificadores críticos de segurança deverão receber prioridade.

## 12.6. Critério de qualidade

Cobertura de linhas, branches e funções será acompanhada como indicador auxiliar.

A aprovação dependerá principalmente da capacidade dos testes de identificar violações reais e preservar comportamentos esperados.

---

# 13. Quality Gates

O projeto deverá possuir verificações em diferentes estágios.

## 13.1. Desenvolvimento

Durante a implementação:

- Testes direcionados.
- Typecheck.
- Lint.
- Verificações do módulo alterado.

## 13.2. Pre-commit

Antes de confirmar alterações:

- Verificação dos arquivos staged.
- Detecção de segredos.
- Detecção de caminhos privados.
- Detecção de referências proibidas.
- Verificação de arquivos sensíveis.
- Checagens rápidas de qualidade.

## 13.3. Pre-push

Antes de enviar alterações:

- Testes relevantes.
- Verificações arquiteturais.
- Auditoria dos commits envolvidos.
- Verificações de segurança obrigatórias.
- Build quando aplicável.

## 13.4. Continuous Integration

A CI executará verificações reproduzíveis em ambiente limpo.

O resultado deverá ser independente de arquivos privados existentes na máquina do desenvolvedor, exceto verificações privadas explicitamente separadas do pipeline público.

## 13.5. Release

Antes da publicação:

- Pipeline completo.
- Testes de integração.
- Testes end-to-end pertinentes.
- Auditoria de artefatos.
- Inspeção de permissões.
- Revisão de dependências.
- Revisão documental.
- Relatório de prontidão.

## 13.6. Política de bloqueio

Falhas obrigatórias deverão impedir a continuação do processo correspondente.

Exceções somente poderão existir quando:

- Forem explicitamente autorizadas.
- Possuírem justificativa.
- Estiverem documentadas.
- Não violarem restrições absolutas de publicação.
- Tiverem critérios de correção definidos.

**Não serão admitidas exceções para exposição conhecida de credenciais ou conteúdo corporativo proibido.**

---

# 14. Integração com Git e GitHub

## 14.1. Hooks locais

Os hooks serão instalados por procedimento documentado.

Sua presença não deverá ser presumida.

O processo de preparação do ambiente deverá verificar se estão corretamente instalados.

## 14.2. GitHub Actions

As workflows deverão possuir:

- Permissões mínimas.
- Dependências controladas.
- Etapas claramente identificadas.
- Logs sem informações sensíveis.
- Execução em pull requests.
- Verificações de segurança.
- Testes.
- Build.
- Critérios explícitos de aprovação.

Workflows de pull requests externos não deverão receber segredos de publicação.

As ações de terceiros deverão ser avaliadas e, quando justificável, fixadas por identificadores imutáveis.

## 14.3. Proteção de branch

A branch principal deverá utilizar:

- Pull requests.
- Verificações obrigatórias.
- Restrições de publicação.
- Revisão apropriada.
- Proteção contra alterações não verificadas.

A disponibilidade de recursos específicos dependerá das configurações e permissões do repositório.

## 14.4. Scripts de commit e push

Poderão existir scripts para auxiliar o processo local.

Entretanto:

- Não deverão pular verificações.
- Não deverão inserir credenciais.
- Não deverão adicionar indiscriminadamente todos os arquivos.
- Não deverão executar force push automaticamente.
- Não deverão publicar sem uma ação explícita.
- Deverão informar quais verificações foram executadas.

---

# 15. Documentação como fonte de verdade

A documentação deverá orientar decisões e implementação, sem substituir a verificação do código.

## 15.1. Documentos canônicos

### AGENTS.md

Documento público de instruções universais para agentes.

Deverá referenciar:

- Arquitetura.
- Segurança.
- Qualidade.
- Procedimentos de execução.
- Critérios de conclusão.

### HARNESS-ARCHITECTURE.md

Documento canônico sobre a infraestrutura de desenvolvimento e governança.

### PRODUCT-ARCHITECTURE.md

Documento responsável pela arquitetura da extensão.

### SECURITY.md

Políticas de segurança e tratamento de vulnerabilidades.

### CONTRIBUTING.md

Regras para contribuições públicas.

### ADRs

Registros de decisões arquiteturais relevantes.

## 15.2. Hierarquia documental

Em caso de divergência, nenhuma instrução poderá contrariar requisitos de segurança ou restrições absolutas de publicação.

A documentação deverá definir uma hierarquia explícita de autoridades e responsabilidades.

Alterações em políticas críticas exigirão revisão apropriada.

## 15.3. Relatórios

Relatórios deverão distinguir:

- O que foi solicitado.
- O que foi implementado.
- O que foi testado.
- Quais comandos foram executados.
- Quais resultados foram observados.
- Quais riscos permanecem.
- Quais verificações não foram executadas.

Resultados não observados não poderão ser apresentados como confirmados.

---

# 16. Compatibilidade entre ferramentas de IA

O harness deverá priorizar instruções e contratos independentes de fornecedores.

## 16.1. Fonte canônica

As definições principais deverão permanecer em:

- `AGENTS.md`.
- `.harness/agents/`.
- `.harness/skills/`.
- `.harness/policies/`.

## 16.2. Adaptadores específicos

Ferramentas de IA poderão exigir estruturas próprias.

Nesses casos, deverão ser utilizados adaptadores ou arquivos derivados.

Esses arquivos não deverão se tornar fontes independentes de regras conflitantes.

## 16.3. Sincronização de instruções

Quando houver geração ou sincronização de arquivos específicos de fornecedores, o harness deverá validar:

- Integridade das referências.
- Consistência das regras.
- Ausência de duplicações conflitantes.
- Correspondência com a fonte canônica.
- Ausência de conteúdo privado.

## 16.4. Execução de ferramentas

Agentes não deverão assumir automaticamente acesso a:

- Rede.
- Credenciais.
- Sistema de arquivos completo.
- Serviços de publicação.
- Dados privados.
- Comandos administrativos.

As capacidades disponíveis deverão ser verificadas no ambiente atual.

---

# 17. Fluxo oficial de desenvolvimento

Toda alteração relevante deverá seguir um processo controlado.

## Etapa 1 — Compreensão

- Identificar objetivo.
- Consultar documentação.
- Determinar escopo.
- Verificar restrições.
- Identificar riscos.

## Etapa 2 — Planejamento

- Definir abordagem.
- Avaliar dependências.
- Identificar critérios de aceitação.
- Determinar testes necessários.
- Identificar impacto arquitetural.

## Etapa 3 — Implementação

- Alterar somente o necessário.
- Respeitar os contratos.
- Preservar comportamentos existentes.
- Evitar abstrações prematuras.
- Criar ou atualizar testes.

## Etapa 4 — Verificação

- Executar testes relevantes.
- Validar tipos.
- Executar lint.
- Verificar limites arquiteturais.
- Executar verificações de segurança.
- Avaliar resultados.

## Etapa 5 — Revisão

- Inspecionar diferenças.
- Verificar documentação.
- Confirmar ausência de exposição.
- Avaliar riscos residuais.
- Confirmar critérios de aceitação.

## Etapa 6 — Documentação

- Atualizar documentos afetados.
- Elaborar relatório quando aplicável.
- Registrar decisões relevantes.
- Informar limitações.

## Etapa 7 — Publicação

- Executar gates obrigatórios.
- Inspecionar arquivos selecionados.
- Confirmar autorização.
- Criar commit.
- Executar verificações pré-push.
- Publicar somente após aprovação.

---

# 18. Desenvolvimento incremental do harness

A infraestrutura não deverá ser construída integralmente antes de qualquer funcionalidade do produto.

A implementação será incremental, priorizando mecanismos essenciais.

## H0 — Fundação

**Objetivo:** estabelecer regras e estrutura básica.

Entregáveis:

- `AGENTS.md`.
- Arquitetura do harness.
- Políticas de segurança.
- Estrutura inicial de agentes.
- Estrutura inicial de skills.
- Contratos.
- `.gitignore`.
- Scripts básicos de verificação.

## H1 — Segurança do repositório

**Objetivo:** impedir publicações indevidas.

Entregáveis:

- Repository Leak Scanner.
- Secrets Scanner.
- Absolute Path Scanner.
- Forbidden Reference Scanner.
- Sensitive File Scanner.
- Testes dos scanners.
- Validação de staged files.
- Verificação pré-push.

## H2 — Qualidade

**Objetivo:** estabelecer validações reproduzíveis.

Entregáveis:

- Quality Verify.
- Typecheck.
- Lint.
- Testes automatizados.
- Build.
- Architecture Boundaries.
- Testes dos scripts de qualidade.

## H3 — Agentes e skills

**Objetivo:** especializar o desenvolvimento assistido.

Entregáveis:

- Agentes essenciais.
- Skills correspondentes.
- Contratos de execução.
- Validação de integridade.
- Procedimentos de documentação.

## H4 — Integração contínua

**Objetivo:** reproduzir verificações em ambiente limpo.

Entregáveis:

- GitHub Actions.
- Quality gates.
- Verificação de dependências.
- Proteção da publicação.
- Relatórios automatizados.

## H5 — Governança avançada

**Objetivo:** aumentar a confiabilidade do processo.

Entregáveis:

- Auditoria do próprio harness.
- Mutation testing de verificadores críticos.
- Inspeção de artefatos.
- Detecção de inconsistências documentais.
- Validação de instruções de agentes.
- Preparação controlada de releases.

---

# 19. Critérios de aceitação da arquitetura

O harness somente poderá ser considerado operacional quando:

- [ ] Existir documentação canônica.
- [ ] Os agentes possuírem responsabilidades definidas.
- [ ] As skills possuírem contratos verificáveis.
- [ ] Os scripts possuírem interfaces documentadas.
- [ ] Scripts críticos possuírem testes positivos e negativos.
- [ ] A verificação de segurança estiver integrada ao fluxo Git.
- [ ] Configurações privadas estiverem fora do versionamento.
- [ ] Caminhos privados forem detectados pelos verificadores relevantes.
- [ ] Identificadores corporativos proibidos forem bloqueados nas verificações privadas obrigatórias.
- [ ] O repositório não contiver segredos conhecidos.
- [ ] O build não incorporar arquivos privados.
- [ ] As verificações arquiteturais estiverem funcionando.
- [ ] A CI executar os gates públicos obrigatórios.
- [ ] Os comandos de validação estiverem documentados.
- [ ] Os resultados dos testes forem reproduzíveis.
- [ ] Os relatórios diferenciarem fatos, hipóteses e pendências.
- [ ] O processo de publicação exigir autorização adequada.
- [ ] O histórico Git tiver sido auditado antes da primeira publicação pública.

Os itens representam requisitos de implementação, não funcionalidades já concluídas.

---

# 20. Riscos arquiteturais

| Risco | Consequência | Mitigação |
|---|---|---|
| Vazamento de informações | Exposição pública | Múltiplas camadas de verificação |
| Agentes com permissões excessivas | Alterações indevidas | Contratos e autorizações explícitas |
| Scripts sem testes | Falsos resultados | Testes positivos, negativos e de regressão |
| Políticas duplicadas | Instruções conflitantes | Fonte canônica |
| Quality gates frágeis | Regressões não detectadas | Auditoria e testes dos verificadores |
| Dependências desnecessárias | Complexidade e superfície de ataque | Revisão de dependências |
| Automação excessiva | Perda de controle | Execução incremental e confirmações |
| Documentação desatualizada | Decisões baseadas em premissas falsas | Verificação de integridade documental |
| Dependência de ferramenta de IA | Dificuldade de evolução | Contratos independentes de fornecedor |
| Falha de configuração privada | Verificação incompleta | Falha explícita e bloqueio de publicação aplicável |

---

# 21. Princípios inegociáveis

1. **Segurança antes da conveniência.**
2. **Nenhum segredo ou dado corporativo não autorizado no repositório público.**
3. **Nenhuma publicação baseada apenas na confiança em um agente.**
4. **Nenhum script crítico sem testes.**
5. **Nenhuma falha de verificação ocultada.**
6. **Nenhuma remoção de controles para facilitar implementações.**
7. **Nenhuma modificação destrutiva sem autorização adequada.**
8. **Nenhuma arquitetura desnecessariamente complexa.**
9. **Nenhuma documentação que afirme resultados não verificados.**
10. **Nenhuma dependência exclusiva de conhecimentos implícitos de uma IA.**
11. **Nenhum envio de informações privadas a ferramentas externas sem autorização específica.**
12. **Nenhuma exceção para conteúdos expressamente proibidos de publicação.**

---

# 22. Direção arquitetural

O harness do ExtensionTools deverá ser uma infraestrutura de desenvolvimento confiável, modular e evolutiva.

Seu propósito não será maximizar a quantidade de agentes, skills ou scripts.

O objetivo será construir um sistema de engenharia no qual:

- As regras sejam explícitas.
- As responsabilidades sejam claras.
- As automações sejam testáveis.
- Os agentes sejam governados.
- As decisões sejam documentadas.
- As alterações sejam verificadas.
- Os riscos sejam identificados.
- As publicações sejam controladas.

O projeto deverá conseguir evoluir mesmo que uma ferramenta de inteligência artificial seja substituída ou removida.

A arquitetura, os testes, as verificações e a documentação continuarão disponíveis e compreensíveis por desenvolvedores humanos.

**Princípio final: o harness deverá tornar o desenvolvimento mais seguro, verificável e sustentável — nunca apenas mais automatizado.**
