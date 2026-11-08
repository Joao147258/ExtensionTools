# ExtensionTools — Inicialização do Harness e Fundação do Projeto

## Instrução para o Gemini CLI

**Projeto:** ExtensionTools  
**Fase:** H0 — Foundation & Repository Safety  
**Objetivo:** Inicializar a estrutura de desenvolvimento, configurar as proteções iniciais do repositório público, instalar dependências e preparar o esqueleto do harness e da extensão.

**IMPORTANTE: ESTA FASE NÃO AUTORIZA O DESENVOLVIMENTO DE FUNCIONALIDADES OU A IMPLEMENTAÇÃO DE SCRIPTS.**

---

# 1. Missão

Prepare a fundação técnica e organizacional do ExtensionTools.

O trabalho deverá contemplar:

1. Inspeção do estado atual do projeto.
2. Preparação do ambiente Node.js.
3. Definição do gerenciador de pacotes.
4. Inicialização do projeto WXT com React e TypeScript.
5. Instalação das dependências fundamentais.
6. Configuração inicial de segurança do repositório.
7. Criação das regras de exclusão de arquivos privados.
8. Criação do esqueleto de diretórios da aplicação.
9. Criação do esqueleto do harness.
10. Preparação da integração com Gemini CLI.
11. Preservação da documentação já existente.
12. Validação da estrutura e das dependências instaladas.
13. Elaboração de um relatório de inicialização.

O objetivo é entregar um projeto estruturalmente preparado para receber implementações futuras.

---

# 2. Restrições obrigatórias

## 2.1. Não implementar funcionalidades

Nesta fase, é proibido desenvolver:

- Calendar.
- Markdown Workspace.
- XML Inspector.
- JSON Inspector.
- Text Diff.
- PDF Export.
- Quick Files.
- Reference Hub.
- Investigation Board.
- Snippet Library.
- Tab Workspaces.
- Evidence Capture.

Não criar interfaces React, componentes, hooks, casos de uso, classes de domínio, serviços ou adaptadores funcionais.

## 2.2. Não implementar scripts

Não desenvolver ainda:

- Scripts de automação.
- Scripts de segurança.
- Scanners.
- Scripts de qualidade.
- Verificadores arquiteturais.
- Scripts de testes.
- Scripts de publicação.
- Scripts de sincronização de agentes.

Criar somente os diretórios destinados a esses componentes.

A implementação ocorrerá em fases posteriores.

## 2.3. Arquivos permitidos

É permitido criar:

- Diretórios.
- Arquivos Markdown de documentação.
- Arquivos `.gitkeep`.
- `.gitignore`.
- `.gitattributes`.
- `.npmrc`, caso necessário.
- `package.json`.
- Lockfile do gerenciador escolhido.
- Configurações mínimas indispensáveis ao ambiente.
- Arquivos de configuração exigidos pelas ferramentas instaladas.

Não criar código de aplicação.

Se uma ferramenta de inicialização gerar código demonstrativo, exemplos ou componentes automaticamente, remova somente esses arquivos gerados, desde que sua origem seja inequívoca e sua exclusão não afete arquivos preexistentes.

Preserve as configurações necessárias ao funcionamento do ambiente.

Não crie implementações artificiais apenas para fazer o build passar.

Um build indisponível pela ausência intencional dos entrypoints deverá ser registrado como pendente, não como falha funcional do produto.

## 2.4. Preservação do projeto

Antes de qualquer alteração:

- Inspecione os diretórios existentes.
- Identifique arquivos já criados.
- Verifique o estado do Git.
- Preserve alterações locais.
- Não sobrescreva documentos existentes.
- Não apague arquivos de origem desconhecida.
- Não reinicialize configurações válidas sem necessidade.

Se o projeto já estiver parcialmente inicializado, adapte o processo.

---

# 3. Documentação canônica

Consulte, quando disponíveis:

- `AGENTS.md`
- `GEMINI.md`
- `docs/architecture/HARNESS-ARCHITECTURE.md`
- `docs/architecture/PRODUCT-ARCHITECTURE.md`
- `SECURITY.md`
- `.harness/policies/`
- `.harness/contracts/`

Esses documentos deverão orientar a inicialização.

Não reescreva regras arquiteturais previamente definidas.

Caso um documento não exista, registre sua ausência.

Crie apenas o esqueleto documental necessário, sem inventar decisões não aprovadas.

---

# 4. Segurança máxima — Repositório público

O ExtensionTools será publicado no GitHub.

A segurança do repositório deverá ser considerada desde a inicialização.

## 4.1. Informações proibidas

É estritamente proibido adicionar ao projeto:

- Nomes de organizações privadas restritas.
- Referências a sistemas corporativos internos.
- Informações reais de clientes.
- Documentos profissionais.
- Arquivos de atendimentos.
- Backups.
- Certificados digitais privados.
- Chaves privadas.
- Senhas.
- Tokens.
- Credenciais.
- Strings de conexão privadas.
- Arquivos de ambiente com segredos.
- Logs confidenciais.
- Caminhos absolutos específicos do computador.
- Diretórios privados de sincronização.
- Documentos internos.
- Dados reais utilizados como fixtures.

Essas restrições também abrangem documentação, comentários, nomes de arquivos, configurações, testes e mensagens de commit.

## 4.2. Referências corporativas proibidas

Existe uma política privada de identificadores que jamais poderão ser mencionados no repositório.

Não reproduza seus valores.

Não introduza esses identificadores em exemplos.

Não crie arquivos públicos contendo a lista.

A estrutura para configuração privada deverá ser preparada, mas seu conteúdo permanecerá exclusivamente no ambiente local autorizado.

## 4.3. Conduta durante a inicialização

Não leia conteúdos de diretórios profissionais que não sejam necessários à inicialização.

Não procure documentos privados para criar exemplos.

Não utilize arquivos reais como fixtures.

Não publique informações encontradas incidentalmente.

Não transmita dados do ambiente para serviços externos, exceto o necessário para instalar dependências de fontes autorizadas.

---

# 5. Preparação do ambiente

## 5.1. Inspeção

Verifique:

- Sistema operacional.
- Versão do Node.js.
- Versão do gerenciador de pacotes.
- Versão do Git.
- Existência de um repositório local.
- Presença de arquivos de configuração.
- Existência de lockfile.
- Dependências já instaladas.

Não registre caminhos absolutos privados no relatório público.

## 5.2. Node.js

Utilize uma versão LTS ativa e compatível com as ferramentas selecionadas.

Consulte os requisitos de versão declarados pelas dependências antes de instalar pacotes.

Não substitua automaticamente uma versão instalada se ela já satisfizer os requisitos.

## 5.3. Gerenciador de pacotes

**Preferência inicial: pnpm.**

Entretanto:

- Preserve um gerenciador já adotado pelo projeto.
- Evite múltiplos lockfiles.
- Utilize uma versão estável compatível.
- Registre a decisão no `package.json`.
- Garanta instalação reproduzível.

Não converta um projeto existente entre gerenciadores sem necessidade demonstrada.

## 5.4. Git

Se não existir repositório Git local, poderá inicializá-lo.

Não configure um remoto automaticamente.

Não execute commit, push ou publicação.

Não sobrescreva configurações Git existentes.

---

# 6. Inicialização do WXT

O ExtensionTools utilizará inicialmente:

- WXT.
- React.
- TypeScript.
- Manifest V3.

## 6.1. Procedimento

Consulte a documentação oficial atual do WXT.

Determine a abordagem mais adequada para iniciar um projeto sem funcionalidades implementadas.

Priorize o template oficial React com TypeScript quando compatível com a restrição de não manter código demonstrativo.

Não execute um gerador sobre arquivos existentes sem antes identificar os riscos de sobrescrita.

## 6.2. Configuração inicial

Prepare apenas o necessário para:

- Reconhecimento do projeto.
- Gerenciamento de dependências.
- Configuração inicial do WXT.
- Utilização do TypeScript.
- Suporte ao React.
- Preparação para Manifest V3.

Não implementar ainda:

- Side Panel funcional.
- Popup.
- Background Service Worker.
- Content Scripts.
- Páginas da extensão.
- Comunicação entre contextos.
- Funcionalidades de domínio.

Os respectivos diretórios serão preparados, mas permanecerão sem implementação.

## 6.3. Manifest V3

Não solicitar permissões desnecessárias.

Permissões de acesso a abas, páginas, downloads ou arquivos deverão ser introduzidas apenas quando houver funcionalidades que justifiquem sua utilização.

Não adicionar host permissions amplas por antecipação.

---

# 7. Instalação de dependências

Instale somente as dependências necessárias para a fundação tecnológica e preparação das verificações futuras.

Antes de instalar, consulte as versões e recomendações oficiais atuais.

## 7.1. Dependências principais

| Dependência | Finalidade |
|---|---|
| `react` | Interface React |
| `react-dom` | Renderização |
| `wxt` | Framework da extensão |
| `@wxt-dev/module-react` | Integração React com WXT, conforme compatibilidade |

Classifique corretamente dependências de execução e desenvolvimento conforme a orientação das ferramentas.

## 7.2. TypeScript

Instale e prepare:

- `typescript`.
- Tipos do React.
- Tipos do React DOM.
- Tipagens adicionais realmente necessárias.

Não duplique dependências já instaladas pelo template.

## 7.3. Estilização

Prepare o ambiente para Tailwind CSS.

Utilize a integração atualmente recomendada para a versão do WXT e do Tailwind selecionadas.

Não adicione múltiplas estratégias de configuração incompatíveis.

Não criar ainda componentes de interface ou estilos de funcionalidades.

## 7.4. Qualidade

Prepare as dependências necessárias para:

- ESLint.
- Formatação consistente.
- Typecheck.
- Verificações futuras.

Prefira integrações compatíveis com React, TypeScript e a versão de WXT instalada.

Evite configurações duplicadas ou obsoletas.

## 7.5. Testes

Instale as dependências fundamentais para:

- Vitest.
- Playwright.
- Tipagens e integrações essenciais.

Não implementar testes nesta fase.

Não configurar testes fictícios apenas para obter resultados positivos.

Não instalar navegadores adicionais do Playwright sem necessidade imediata, salvo quando a configuração inicial exigir e isso estiver justificado.

## 7.6. Dependências futuras

Não instalar antecipadamente todas as bibliotecas previstas para:

- Renderização Markdown.
- Editores de código.
- Mermaid.
- XML.
- JSON.
- Exportação PDF.
- Captura de páginas.
- Gerenciamento de arquivos.
- Calendários.

Essas dependências serão selecionadas durante a implementação de cada módulo.

## 7.7. Validação

Após a instalação:

- Confirmar que as dependências foram instaladas.
- Verificar a integridade do lockfile.
- Identificar conflitos de versões.
- Verificar compatibilidade com Node.js.
- Confirmar ausência de lockfiles conflitantes.
- Registrar problemas existentes.

Não executar comandos inexistentes no projeto.

---

# 8. Criação do `.gitignore`

Esta é uma das atividades mais importantes da fase.

Crie um `.gitignore` adequado a:

- Node.js.
- TypeScript.
- WXT.
- React.
- Testes automatizados.
- Ferramentas de desenvolvimento.
- Harness.
- Configurações locais.
- Repositório público.

## 8.1. Dependências

Impedir o versionamento de:

- `node_modules/`.
- Diretórios temporários dos gerenciadores.
- Caches locais.
- Artefatos temporários de instalação.

O lockfile escolhido deverá permanecer versionável.

## 8.2. Builds

Ignorar os diretórios de geração de artefatos do WXT e outras saídas produzidas automaticamente.

Incluindo, conforme aplicável:

- `.output/`.
- `.wxt/`.
- `dist/`.
- Diretórios temporários de build.
- Pacotes gerados para distribuição.

Não ignorar o código-fonte necessário ao build.

## 8.3. Testes

Ignorar artefatos temporários como:

- `coverage/`.
- `test-results/`.
- `playwright-report/`.
- Relatórios HTML gerados.
- Screenshots produzidas por testes.
- Vídeos temporários.
- Traces de execução.
- Caches de testes.

Os arquivos-fonte dos testes deverão continuar versionáveis.

## 8.4. Arquivos de ambiente

Ignorar arquivos privados de ambiente, incluindo variações de `.env`.

Permitir exclusivamente arquivos de exemplo explicitamente revisados, como `.env.example`, quando forem necessários.

Os exemplos não poderão conter valores reais.

## 8.5. Arquivos privados

Ignorar integralmente:

`.local/`

Essa regra deverá abranger todos os seus subdiretórios e conteúdos.

## 8.6. Credenciais e certificados

Adicionar padrões de exclusão apropriados para:

- Chaves privadas.
- Certificados com chave privada.
- Arquivos de credenciais.
- Keystores.
- Contêineres de certificados.
- Arquivos de autenticação sensíveis.

Não incluir credenciais reais como exemplos.

## 8.7. Backups e dados

Adicionar padrões de exclusão para:

- Backups.
- Dumps.
- Bancos de dados locais.
- Arquivos compactados que possam conter dados privados.
- Exportações de dados.
- Arquivos temporários de recuperação.

Não bloquear indiscriminadamente arquivos essenciais à construção da extensão.

## 8.8. Documentos externos

Adotar uma política inicial restritiva para documentos importados.

Por padrão, impedir o versionamento acidental de:

- XMLs externos.
- PDFs de terceiros.
- Planilhas de dados.
- Documentos de escritório.
- Exportações CSV.
- Arquivos compactados.
- Arquivos de evidências.

No futuro, fixtures sintéticas poderão receber exceções explícitas, limitadas a diretórios específicos e sujeitas à revisão de segurança.

Não criar exceções genéricas que permitam documentos privados em qualquer diretório.

## 8.9. Logs

Ignorar:

- Logs de execução.
- Logs de depuração.
- Logs de instalação.
- Arquivos temporários de diagnóstico.
- Relatórios locais não destinados à publicação.

## 8.10. Arquivos do sistema operacional

Ignorar arquivos temporários e metadados locais típicos dos sistemas operacionais, sem impedir o versionamento de configurações úteis do projeto.

## 8.11. Configurações de IDE

Distinguir configurações privadas das configurações compartilháveis.

Arquivos com preferências pessoais ou caminhos locais deverão ser ignorados.

Não ignorar automaticamente configurações públicas úteis à equipe quando forem seguras e justificadas.

---

# 9. Política complementar de publicação

O `.gitignore` não é uma barreira de segurança completa.

Ele não impede:

- Inclusão forçada.
- Exposição em arquivos já rastreados.
- Publicação de conteúdo sensível dentro de arquivos permitidos.
- Vazamento em mensagens de commit.
- Exposição em artefatos.
- Permanência de segredos no histórico.

Nesta fase, prepare documentação pública explicando essas limitações.

Não implemente ainda os scanners.

Registre como requisitos obrigatórios da próxima fase:

1. Secrets Scanner.
2. Absolute Path Scanner.
3. Forbidden Reference Scanner.
4. Sensitive File Scanner.
5. Repository Leak Scanner.
6. Artifact Scanner.
7. Verificação de arquivos staged.
8. Auditoria de commits destinados ao push.
9. Testes positivos e negativos dos verificadores.
10. Integração futura com hooks e CI.

**A instalação de dependências e a criação do `.gitignore` não significam que o repositório esteja plenamente protegido.**

Até a implementação dos verificadores críticos, a publicação deverá permanecer bloqueada.

---

# 10. Configurações adicionais do Git

## 10.1. `.gitattributes`

Crie uma configuração básica para:

- Normalização de finais de linha.
- Consistência de arquivos textuais.
- Tratamento apropriado de arquivos binários.
- Redução de diferenças artificiais entre sistemas operacionais.

Evite regras excessivamente específicas sem necessidade.

## 10.2. Arquivos locais

Prepare `.local/`, mas garanta que seu conteúdo não seja versionado.

Não coloque informações confidenciais dentro dessa pasta apenas para testar as regras.

## 10.3. Verificação inicial

Confirme que os padrões configurados estão sendo respeitados.

Utilize apenas arquivos de teste sintéticos e temporários.

Verifique também se arquivos legítimos, como `package.json`, lockfile, documentação e código-fonte futuro, continuam elegíveis ao versionamento.

Remova os arquivos temporários criados exclusivamente para essa validação.

Não inclua arquivos indevidos no índice do Git.

---

# 11. Estrutura inicial do projeto

Crie o seguinte esqueleto, adaptando-o quando necessário à estrutura real exigida pelo WXT:

```text
extension-tools/
│
├── AGENTS.md
├── GEMINI.md
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
├── .gitignore
├── .gitattributes
├── package.json
├── pnpm-lock.yaml
│
├── .local/
│
├── .harness/
│   ├── agents/
│   ├── skills/
│   ├── policies/
│   ├── contracts/
│   └── templates/
│
├── .gemini/
│   └── agents/
│
├── scripts/
│   ├── automation/
│   ├── security/
│   ├── quality/
│   ├── architecture/
│   ├── documentation/
│   ├── release/
│   └── lib/
│
├── tests/
│   ├── harness/
│   │   ├── automation/
│   │   ├── security/
│   │   ├── quality/
│   │   ├── architecture/
│   │   └── fixtures/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── architecture/
│   │   └── adr/
│   ├── product/
│   ├── features/
│   ├── development/
│   └── reports/
│
├── src/
│   ├── entrypoints/
│   │   ├── background/
│   │   ├── sidepanel/
│   │   ├── pages/
│   │   └── content/
│   │
│   ├── features/
│   │   ├── calendar/
│   │   ├── markdown/
│   │   ├── xml-inspector/
│   │   ├── json-inspector/
│   │   ├── text-diff/
│   │   ├── pdf-export/
│   │   ├── quick-files/
│   │   ├── reference-hub/
│   │   ├── investigation-board/
│   │   ├── snippet-library/
│   │   ├── tab-workspaces/
│   │   └── evidence-capture/
│   │
│   ├── platform/
│   │   ├── browser/
│   │   ├── file-system/
│   │   ├── persistence/
│   │   └── messaging/
│   │
│   └── shared/
│       ├── ui/
│       ├── types/
│       └── errors/
│
└── public/
```

**Observações:**

- A árvore representa a estrutura lógica desejada, não obriga a existência de todos os arquivos no disco.
- O lockfile deverá corresponder ao gerenciador efetivamente selecionado.
- Arquivos de configuração adicionais poderão ser criados quando necessários.
- O diretório `.local/` será privado e ignorado.
- Não criar arquivos de aplicação vazios apenas para representar módulos.
- Utilizar `.gitkeep` quando for necessário preservar diretórios vazios no Git.
- Não versionar `.gitkeep` dentro de `.local/`.
- Preservar as convenções exigidas pela versão instalada do WXT.

---

# 12. Inicialização do harness

## 12.1. Agents

Verifique a existência dos seguintes agentes canônicos:

- `orchestrator.md`
- `architect.md`
- `developer.md`
- `code-reviewer.md`
- `test-engineer.md`
- `security-auditor.md`
- `documentation-engineer.md`
- `script-engineer.md`
- `release-engineer.md`

Diretório:

`.harness/agents/`

Se os arquivos já existirem, preserve seu conteúdo.

Se ainda não tiverem sido fornecidos, não invente suas definições.

Prepare somente a estrutura.

## 12.2. Integração com Gemini

Prepare:

`.gemini/agents/`

O Gemini CLI utilizará esse diretório para descobrir os subagentes.

Entretanto, a fonte canônica permanecerá em:

`.harness/agents/`

Não crie cópias divergentes.

Não implemente ainda o sincronizador.

Registre essa integração como pendência para a fase de automação do harness.

## 12.3. Skills

Prepare os diretórios de:

- `implementation`
- `architecture-review`
- `code-review`
- `testing`
- `security-audit`
- `public-repository-safety`
- `documentation`
- `script-development`
- `release-validation`

Os diretórios ficarão sob:

`.harness/skills/`

Não escreva ainda o conteúdo das skills.

Se uma skill já existir, preserve-a.

## 12.4. Policies

Prepare o diretório:

`.harness/policies/`

Políticas previstas:

- Segurança.
- Arquitetura.
- Testes.
- Documentação.
- Segurança de repositório público.
- Execução de agentes.

Não invente regras novas que contrariem a documentação canônica.

## 12.5. Contracts

Prepare:

`.harness/contracts/`

Contratos previstos:

- Agent Contract.
- Skill Contract.
- Script Contract.
- Report Contract.

A implementação detalhada será realizada posteriormente.

## 12.6. Templates

Prepare:

`.harness/templates/`

Templates previstos:

- Relatório de implementação.
- Relatório de revisão.
- Relatório de segurança.
- ADR.

Não gerar documentos fictícios de desenvolvimento.

---

# 13. Preparação dos scripts

Crie apenas os diretórios.

## 13.1. Automation

`scripts/automation/`

Reservado para futuras automações operacionais.

## 13.2. Security

`scripts/security/`

Reservado para scanners e verificações de segurança.

## 13.3. Quality

`scripts/quality/`

Reservado para validações de código e qualidade.

## 13.4. Architecture

`scripts/architecture/`

Reservado para verificações de dependências e limites modulares.

## 13.5. Documentation

`scripts/documentation/`

Reservado para integridade de documentos.

## 13.6. Release

`scripts/release/`

Reservado para validação e preparação de publicações.

## 13.7. Shared Library

`scripts/lib/`

Reservado para componentes compartilhados entre scripts.

Não criar scripts de exemplo sem necessidade.

Não adicionar comandos ao `package.json` que dependam de scripts ainda inexistentes.

---

# 14. Preparação dos testes

Crie apenas a estrutura.

Diretórios:

- `tests/harness/automation/`
- `tests/harness/security/`
- `tests/harness/quality/`
- `tests/harness/architecture/`
- `tests/harness/fixtures/`
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

Não criar testes artificiais.

Não gerar fixtures com documentos reais.

Não declarar cobertura de testes inexistentes.

Os testes deverão ser implementados juntamente com os respectivos componentes nas fases seguintes.

---

# 15. Documentação inicial

## 15.1. README.md

Se não existir, crie um documento inicial com:

- Identificação do projeto.
- Objetivo geral.
- Estado atual.
- Tecnologias selecionadas.
- Instruções básicas de instalação.
- Referências para arquitetura e segurança.
- Informação de que o projeto está em fase de inicialização.

Não apresentar funcionalidades como concluídas.

## 15.2. SECURITY.md

Preparar a política pública inicial com:

- Classificação do repositório.
- Tipos de dados proibidos.
- Cuidados com credenciais.
- Princípio de permissões mínimas.
- Regras de publicação.
- Limitações dos controles atuais.
- Orientação para comunicação privada de vulnerabilidades, sem inventar contatos.

Não registrar identificadores privados.

## 15.3. CONTRIBUTING.md

Preparar orientações iniciais para colaboradores:

- Respeitar as políticas.
- Utilizar dados sintéticos.
- Não publicar informações privadas.
- Não enviar credenciais.
- Manter alterações relacionadas ao escopo.
- Executar verificações disponíveis.
- Declarar testes executados.
- Respeitar as decisões arquiteturais.

## 15.4. Documentos arquiteturais

Preservar os documentos existentes.

Caso alguma referência ainda não exista, registrar a pendência.

Não elaborar uma nova arquitetura funcional nesta fase.

---

# 16. Configuração inicial do package.json

Configure apenas as informações necessárias para:

- Identificação do pacote.
- Gerenciador de pacotes.
- Dependências.
- Dependências de desenvolvimento.
- Comandos realmente disponíveis.
- Configuração mínima exigida pelo WXT.

Utilizar:

- Nome técnico apropriado.
- Versão inicial coerente com o estágio pré-release.
- Declaração de licença somente quando aprovada.
- Restrições de versão compatíveis com as ferramentas.

Não criar comandos fictícios como:

- `verify:all`
- `security:scan`
- `architecture:check`
- `harness:verify`

Enquanto seus scripts correspondentes não existirem.

Esses comandos serão implementados posteriormente.

Não ativar automaticamente comandos de publicação.

---

# 17. Verificações permitidas nesta fase

Após preparar a estrutura, execute somente verificações compatíveis com o escopo.

## 17.1. Estrutura

Confirmar que:

- Os diretórios foram criados.
- Não existem duplicidades indevidas.
- Os arquivos existentes foram preservados.
- O projeto possui organização coerente.
- Os diretórios privados não estão preparados para versionamento.

## 17.2. Dependências

Confirmar:

- Instalação bem-sucedida.
- Lockfile válido.
- Ausência de conflito evidente.
- Compatibilidade de versões.
- Ferramentas fundamentais disponíveis.

## 17.3. Git

Verificar:

- Regras do `.gitignore`.
- Exclusão do diretório `.local/`.
- Exclusão de dependências instaladas.
- Exclusão de artefatos temporários.
- Exclusão de credenciais e certificados de teste sintéticos.
- Elegibilidade de arquivos públicos legítimos.
- Ausência de arquivos privados rastreados.

## 17.4. Segurança

Verificar manualmente o escopo criado.

Não afirmar que o projeto passou por auditoria completa, pois os scanners ainda não foram implementados.

## 17.5. WXT

Validar apenas o que for possível sem código de aplicação.

Se o build exigir entrypoints ainda não implementados, registrar essa limitação.

Não criar código demonstrativo apenas para produzir um build bem-sucedido.

---

# 18. Proibições específicas desta execução

Nesta fase, não execute:

- Desenvolvimento de funcionalidades.
- Implementação de interfaces React.
- Criação de scripts de automação.
- Implementação de scanners.
- Implementação de testes.
- Criação de workflows funcionais.
- Desenvolvimento de adaptadores.
- Criação de serviços.
- Desenvolvimento de componentes.
- Integrações externas.
- Publicação no GitHub.
- Commit.
- Push.
- Criação de release.
- Instalação desnecessária de bibliotecas futuras.
- Alterações em arquivos privados não relacionados.

Não adicione segredos ou dados profissionais ao projeto.

---

# 19. Relatório de inicialização

Ao concluir a execução, crie:

`docs/reports/H0-FOUNDATION-REPORT.md`

O relatório deverá conter:

## 19.1. Ambiente

- Node.js utilizado.
- Gerenciador de pacotes.
- Versões principais.
- Ferramentas reconhecidas.

## 19.2. Estrutura

- Diretórios criados.
- Arquivos criados.
- Arquivos existentes preservados.
- Diferenças em relação à estrutura planejada.

## 19.3. Dependências

- Dependências instaladas.
- Justificativas relevantes.
- Problemas encontrados.
- Dependências adiadas.

## 19.4. Git

- Regras de exclusão adicionadas.
- Categorias protegidas.
- Testes sintéticos de exclusão realizados.
- Limitações conhecidas.

## 19.5. Segurança

Distinguir:

- Proteções configuradas.
- Proteções verificadas.
- Proteções ainda não implementadas.
- Riscos restantes.

## 19.6. Pendências

Registrar:

- Scripts de segurança.
- Testes dos scanners.
- Hooks.
- CI.
- Sincronização de agents.
- Skills.
- Quality gates.
- Código inicial do WXT.
- Testes da aplicação.

## 19.7. Estado final

Utilizar uma das classificações:

- **Concluído:** todos os requisitos de H0 aplicáveis foram atendidos.
- **Parcial:** existem entregáveis pendentes.
- **Bloqueado:** impedimento relevante.

Não declarar as verificações futuras como concluídas.

---

# 20. Critérios de aceitação

A fase H0 somente poderá ser considerada concluída quando:

- [ ] O projeto existente tiver sido inspecionado.
- [ ] Nenhum arquivo preexistente tiver sido sobrescrito indevidamente.
- [ ] O ambiente Node.js estiver preparado.
- [ ] O gerenciador de pacotes estiver definido.
- [ ] O WXT estiver configurado no nível permitido.
- [ ] React e TypeScript estiverem preparados.
- [ ] As dependências fundamentais estiverem instaladas.
- [ ] O lockfile estiver consistente.
- [ ] O `.gitignore` estiver criado.
- [ ] `.local/` estiver protegido contra versionamento comum.
- [ ] Arquivos de credenciais e certificados estiverem cobertos por regras de exclusão.
- [ ] Backups, dumps e arquivos privados estiverem cobertos por regras apropriadas.
- [ ] Arquivos de build e teste forem ignorados.
- [ ] O `.gitattributes` estiver configurado.
- [ ] O esqueleto da aplicação estiver criado.
- [ ] O esqueleto do harness estiver criado.
- [ ] Os diretórios dos nove agentes estiverem preparados ou preservados.
- [ ] A integração estrutural do Gemini estiver preparada.
- [ ] Os diretórios de skills estiverem preparados.
- [ ] Os diretórios de scripts estiverem preparados.
- [ ] Os diretórios de testes estiverem preparados.
- [ ] A documentação inicial estiver organizada.
- [ ] Nenhum código funcional tiver sido implementado.
- [ ] As verificações compatíveis com H0 tiverem sido executadas.
- [ ] As limitações de segurança estiverem documentadas.
- [ ] O relatório de inicialização estiver concluído.
- [ ] Nenhum commit ou push tiver sido realizado.

---

# 21. Entrega final

Ao terminar, apresente:

1. Resumo da inicialização.
2. Estrutura efetivamente criada.
3. Dependências instaladas e respectivas versões.
4. Configurações realizadas.
5. Regras do `.gitignore`.
6. Verificações executadas e resultados.
7. Problemas identificados.
8. Limitações.
9. Pendências para H1.
10. Localização do relatório.

Não apenas afirme que a estrutura foi criada: verifique sua existência.

Não apresente arquivos inexistentes como entregáveis concluídos.

Não declare scanners ou testes como implementados.

---

# 22. Próxima fase — H1

Após H0, a próxima etapa será:

**H1 — Implementação das Proteções Executáveis do Repositório Público**

Escopo previsto:

- Secrets Scanner.
- Absolute Path Scanner.
- Forbidden Reference Scanner.
- Sensitive File Scanner.
- Repository Leak Scanner.
- Testes automatizados dos scanners.
- Testes negativos de segurança.
- Verificação dos arquivos staged.
- Integração com pre-commit.
- Integração com pre-push.
- Verificação inicial de integridade do harness.

**Não iniciar H1 nesta execução.**

---

# Diretriz final

Execute exclusivamente a inicialização estrutural do ExtensionTools.

Prepare o ambiente, configure o repositório, instale as dependências fundamentais, crie os diretórios e organize a documentação.

Preserve todas as decisões arquiteturais já estabelecidas.

Não introduza código funcional.

Não publique arquivos.

Não execute commit ou push.

**O resultado esperado é um esqueleto de projeto organizado, com dependências instaladas, regras básicas de proteção configuradas e pronto para a implementação futura dos controles executáveis de segurança, testes e automação.**
