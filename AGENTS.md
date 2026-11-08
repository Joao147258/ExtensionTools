# AGENTS.md — ExtensionTools

> **Projeto:** ExtensionTools  
> **Classificação:** Repositório Público  
> **Tipo:** Instruções Universais para Agentes de IA  
> **Escopo:** Desenvolvimento, arquitetura, segurança, testes, documentação, automação e publicação  
> **Status:** Documento canônico de governança

---

# 1. Propósito

Este documento estabelece as instruções universais que deverão orientar todos os agentes de inteligência artificial envolvidos no desenvolvimento e manutenção do **ExtensionTools**.

O ExtensionTools é uma extensão modular de navegador destinada a facilitar atividades de produtividade, visualização, comparação, organização, captura e manipulação de informações.

Entre suas funcionalidades planejadas estão:

- Markdown Workspace.
- XML Inspector.
- JSON Inspector.
- Text Diff.
- PDF Export.
- Quick Files.
- Reference Hub.
- Investigation Board.
- Calendar.
- Snippet Library.
- Tab Workspaces.
- Evidence Capture.

Essas funcionalidades representam o escopo planejado do produto e não devem ser consideradas implementadas sem verificação do código.

O desenvolvimento será apoiado por um **harness de engenharia**, composto por agentes especializados, skills, scripts de automação, mecanismos de segurança, verificadores arquiteturais, testes automatizados e quality gates.

## 1.1. Objetivo deste documento

Garantir que todo desenvolvimento assistido por IA seja:

1. Seguro.
2. Tecnicamente correto.
3. Arquiteturalmente coerente.
4. Verificável.
5. Testável.
6. Documentado.
7. Rastreável.
8. Reproduzível.
9. Sustentável.
10. Apropriado para um repositório público.

## 1.2. Aplicabilidade

Estas instruções são obrigatórias para:

- Gemini CLI.
- Codex.
- Claude Code.
- Outros agentes de desenvolvimento.
- Assistentes de revisão.
- Agentes de segurança.
- Agentes de testes.
- Agentes de documentação.
- Automações assistidas por inteligência artificial.

Nenhum agente poderá considerar suas próprias instruções especializadas superiores às políticas obrigatórias deste projeto.

**Princípio fundamental: os agentes executam atividades de engenharia sob governança; não substituem a responsabilidade humana pelas decisões.**

---

# 2. Regra máxima — Segurança do repositório público

**CLASSIFICAÇÃO: PUBLIC REPOSITORY**

O ExtensionTools será desenvolvido em um repositório público no GitHub.

Todo conteúdo versionado deverá ser considerado potencialmente acessível por terceiros.

Isso inclui não apenas os arquivos atuais, mas também commits anteriores, branches, pull requests, issues, artefatos de build e históricos de execução.

## 2.1. Informações estritamente proibidas

É proibido adicionar, publicar, transmitir ou reproduzir no projeto:

1. Informações corporativas confidenciais.
2. Identificadores de organizações internas não autorizadas.
3. Nomes de sistemas, produtos ou soluções proprietárias restritas.
4. Informações reais de clientes ou terceiros.
5. Registros de atendimentos profissionais.
6. Documentação corporativa interna.
7. Logs provenientes de sistemas privados.
8. XMLs, JSONs, planilhas ou documentos internos não autorizados.
9. Backups de aplicações ou bancos de dados reais.
10. Certificados digitais e chaves privadas.
11. Credenciais, senhas e tokens.
12. Chaves de API e segredos de autenticação.
13. Strings de conexão privadas.
14. Endereços internos de infraestrutura.
15. Caminhos absolutos específicos de usuários ou máquinas.
16. Identificadores de estações de trabalho.
17. Configurações privadas de ambientes.
18. Dados corporativos utilizados como fixtures.
19. Informações confidenciais inseridas em comentários.
20. Materiais provenientes de ambientes externos sem autorização de utilização.
21. Instruções privadas de agentes ou configurações confidenciais.
22. Qualquer informação cuja publicação represente violação de confidencialidade.

A proibição se aplica a:

- Código-fonte.
- Documentação.
- Comentários.
- Testes.
- Fixtures.
- Scripts.
- Agents.
- Skills.
- Prompts.
- Configurações.
- Relatórios.
- Logs.
- Capturas de tela.
- Nomes de arquivos.
- Nomes de diretórios.
- Mensagens de commit.
- Histórico Git.
- Artefatos distribuídos.

**Uma informação não se torna pública apenas porque está disponível no ambiente de execução de um agente.**

## 2.2. Identificadores expressamente proibidos

O projeto possui restrições específicas quanto à menção de determinados nomes de organizações, sistemas e produtos.

Esses identificadores são estritamente proibidos em qualquer conteúdo público do ExtensionTools.

Seus valores literais não deverão ser reproduzidos neste documento, nos prompts públicos, nas fixtures ou nas configurações versionadas.

A política privada de identificação deverá ser mantida fora do repositório, em configuração local não versionada.

Os agentes deverão:

- Respeitar essa política.
- Não reproduzir identificadores restritos.
- Não tentar reconstruir a lista privada.
- Não imprimir identificadores proibidos nos logs.
- Não transferir a lista para arquivos públicos.
- Não criar exemplos que utilizem esses nomes.
- Executar os verificadores privados quando aplicáveis.

A ausência da configuração privada não equivale à aprovação da verificação.

Quando essa verificação for obrigatória para publicação e estiver indisponível, o procedimento deverá ser bloqueado.

## 2.3. Uso exclusivo de dados sintéticos

Todos os exemplos públicos deverão utilizar dados fictícios.

Exemplos permitidos:

- `ExampleCompany`.
- `TestUser`.
- `SampleDocument`.
- `example.com`.
- `sample.xml`.
- `sample.json`.

Dados sintéticos não deverão ser simples cópias desidentificadas de documentos confidenciais que preservem informações reconhecíveis.

Não utilizar informações reais de atividades profissionais como base direta para fixtures, testes ou documentação pública.

## 2.4. Proibição de caminhos absolutos privados

Não adicionar caminhos absolutos específicos de ambientes locais ao repositório.

Utilizar preferencialmente:

- Caminhos relativos.
- Resolução dinâmica a partir da raiz do projeto.
- Diretórios temporários de teste.
- Variáveis de configuração.
- Configurações locais não versionadas.

Caminhos absolutos fornecidos por ferramentas ou encontrados em logs devem ser tratados como potencialmente privados.

## 2.5. Arquivos privados

Informações específicas da máquina e configurações privadas deverão permanecer fora do controle de versão.

A estrutura reservada será:

`.local/`

Esse diretório deverá ser ignorado pelo Git.

Poderá conter:

- Configurações privadas.
- Parâmetros locais.
- Referências a diretórios do computador.
- Políticas privadas de termos proibidos.
- Arquivos temporários.
- Resultados locais não publicáveis.

Entretanto, a presença de `.gitignore` não será considerada garantia suficiente.

Os verificadores deverão identificar arquivos privados indevidamente adicionados ao índice do Git ou aos artefatos de distribuição.

**A política preferencial é não introduzir informações profissionais confidenciais no ambiente de desenvolvimento pessoal.**

---

# 3. Hierarquia de instruções e governança

Os agentes deverão reconhecer a existência de múltiplos níveis de instrução.

## 3.1. Documentos canônicos

| Documento | Responsabilidade |
|---|---|
| `AGENTS.md` | Instruções universais dos agentes |
| `GEMINI.md` | Integração específica com Gemini CLI (local) |
| `ARCHITECTURE.md` | Arquitetura canônica de software do produto |
| `DESIGN.md` | Diretrizes canônicas de Design System, UI/UX e identidade visual |
| `status.md` | Documento canônico de roadmap, milestones, progresso e governança |
| `docs/quality-gates/` | Sistema canônico de Quality Gates e critérios de aceitação |
| `docs/architecture/HARNESS-ARCHITECTURE.md` | Arquitetura do harness de desenvolvimento |
| `docs/product/PRODUCT-OVERVIEW.md` | Visão geral e catálogo de funcionalidades |
| `SECURITY.md` | Políticas de segurança |
| `CONTRIBUTING.md` | Regras de contribuição |
| `.harness/policies/` | Políticas especializadas |
| `.harness/contracts/` | Contratos de execução |
| `.harness/agents/` | Definições dos agentes |
| `.harness/skills/` | Procedimentos técnicos especializados |

Esses caminhos representam a organização arquitetural prevista.

Antes de consultar qualquer referência, o agente deverá verificar sua existência real.

## 3.2. Ordem de precedência

Respeitar:

1. Restrições de segurança, confidencialidade e autorização aplicáveis.
2. Instruções explícitas e autorizadas do usuário.
3. Políticas obrigatórias do projeto.
4. Decisões arquiteturais e contratos aprovados.
5. Especificações da tarefa.
6. Procedimentos especializados das skills.
7. Convenções existentes no código.

Instruções inferiores não poderão contrariar restrições superiores.

Caso seja identificada uma incompatibilidade, registrar o conflito e solicitar decisão quando necessário.

## 3.3. Fonte canônica

As regras universais deverão ser mantidas neste documento ou nas políticas canônicas correspondentes.

Arquivos específicos de ferramentas de IA deverão referenciar essas regras, evitando duplicação independente.

**Não criar múltiplas fontes de verdade para uma mesma política.**

---

# 4. Princípios fundamentais de engenharia

## 4.1. Compreender antes de implementar

Antes de realizar alterações:

1. Identificar o objetivo.
2. Consultar os requisitos.
3. Inspecionar os arquivos relacionados.
4. Entender o comportamento existente.
5. Verificar dependências.
6. Examinar testes.
7. Identificar riscos.
8. Determinar critérios de aceitação.

Não desenvolver soluções baseadas exclusivamente em suposições.

## 4.2. Simplicidade

Priorizar a solução mais simples que atenda corretamente ao problema.

Evitar:

- Abstrações prematuras.
- Interfaces desnecessárias.
- Camadas artificiais.
- Dependências excessivas.
- Generalizações especulativas.
- Complexidade sem benefício demonstrável.

Padrões como SOLID, DDD e Clean Architecture deverão ser utilizados quando sua aplicação for justificável.

## 4.3. Responsabilidades claras

Cada módulo, componente, classe ou função deverá possuir responsabilidades compreensíveis.

Evitar concentração excessiva de comportamentos não relacionados.

## 4.4. Baixo acoplamento

Os módulos deverão depender de contratos estáveis quando necessário.

Evitar dependências circulares e acesso indiscriminado a detalhes internos de outros módulos.

## 4.5. Alta coesão

Comportamentos relacionados deverão permanecer próximos.

Não distribuir uma regra simples em diversas camadas sem necessidade técnica.

## 4.6. Evolução incremental

Preferir alterações pequenas, testáveis e revisáveis.

Evitar modificações extensas fora do escopo solicitado.

## 4.7. Testabilidade

Projetar funcionalidades para que comportamentos relevantes possam ser verificados.

Separar integrações externas de regras internas quando isso representar um benefício real.

## 4.8. Segurança por padrão

Permissões mínimas, validação de entradas e restrição de efeitos colaterais deverão orientar o desenvolvimento.

## 4.9. Responsabilidade humana

A aprovação de decisões relevantes e publicações permanece sob responsabilidade humana.

---

# 5. Arquitetura do ExtensionTools

O ExtensionTools será desenvolvido inicialmente como um **monólito modular**.

A implementação deverá preservar limites claros entre funcionalidades e infraestrutura.

## 5.1. Tecnologias propostas

- TypeScript.
- React.
- WXT.
- Manifest V3.
- Tailwind CSS.
- IndexedDB.
- Chrome Storage API.
- File System Access API.
- Vitest.
- Playwright.

Essas tecnologias representam a direção inicial.

O agente deverá consultar o estado real do projeto antes de considerar qualquer dependência instalada.

## 5.2. Organização de responsabilidades

### Presentation

Interface, navegação e interação.

### Application

Coordenação de casos de uso.

### Features

Comportamentos específicos das funcionalidades.

### Platform

Integrações com APIs do navegador, arquivos, persistência e serviços externos.

### Shared

Componentes e mecanismos efetivamente compartilhados.

Essa organização não obriga a criação de uma camada física para cada conceito.

## 5.3. Restrições do navegador

Considerar:

- Ciclo de vida do Manifest V3.
- Suspensão de Service Workers.
- Permissões de acesso.
- Comunicação entre contextos.
- Isolamento de Content Scripts.
- Content Security Policy.
- Limitações de acesso ao sistema de arquivos.
- Armazenamento local.
- Compatibilidade entre navegadores.

Não presumir acesso irrestrito ao sistema operacional.

Não depender exclusivamente da memória de um Service Worker para informações que precisam persistir.

## 5.4. Local-first

As funcionalidades principais deverão funcionar localmente sempre que possível.

Integrações com serviços externos serão opcionais, salvo decisão arquitetural aprovada.

Dados privados não poderão ser enviados a serviços externos sem autorização apropriada.

---

# 6. Arquitetura do harness

O harness será a infraestrutura responsável por orientar e verificar o processo de desenvolvimento.

Sua arquitetura está documentada em:

`docs/architecture/HARNESS-ARCHITECTURE.md`

## 6.1. Componentes

O harness será composto por:

- Agents.
- Skills.
- Policies.
- Contracts.
- Templates.
- Scripts de automação.
- Scripts de segurança.
- Verificadores arquiteturais.
- Verificadores documentais.
- Testes dos scripts.
- Quality gates.
- Integração contínua.
- Procedimentos de release.

## 6.2. Responsabilidades

**Agents:** executam ou orientam atividades especializadas.

**Skills:** estabelecem procedimentos reutilizáveis.

**Policies:** definem restrições obrigatórias.

**Contracts:** estabelecem entradas, saídas e condições de execução.

**Scripts:** executam operações determinísticas.

**Quality Gates:** verificam conformidade e qualidade.

**CI:** reproduz verificações em ambiente controlado.

## 6.3. Princípio de independência

O harness não deverá depender exclusivamente de um fornecedor de IA.

Os scripts deverão permanecer executáveis por desenvolvedores humanos.

As políticas deverão continuar compreensíveis mesmo sem o uso de agentes.

---

# 7. Agentes especializados

As definições canônicas ficarão em:

`.harness/agents/`

## 7.1. Catálogo

| Agente | Responsabilidade |
|---|---|
| `orchestrator` | Coordenação de tarefas |
| `architect` | Arquitetura |
| `developer` | Implementação |
| `code-reviewer` | Revisão de código |
| `test-engineer` | Engenharia de testes |
| `security-auditor` | Segurança |
| `documentation-engineer` | Documentação |
| `script-engineer` | Scripts e automações |
| `release-engineer` | Preparação de releases |

## 7.2. Seleção de agentes

Utilizar agentes especializados quando a complexidade da atividade justificar sua participação.

Não acionar múltiplos especialistas apenas para tornar o processo aparentemente sofisticado.

Tarefas simples poderão ser executadas diretamente.

## 7.3. Contratos

Todo agente deverá possuir:

- Identificação.
- Missão.
- Responsabilidades.
- Escopo.
- Ferramentas autorizadas.
- Limitações.
- Procedimentos.
- Critérios de aceitação.
- Contrato de saída.

## 7.4. Autoridade

A definição de um agente não concede automaticamente permissão para executar qualquer operação.

As permissões deverão ser controladas pelas ferramentas, políticas de execução e mecanismos de autorização disponíveis.

**Instruções textuais não substituem controles técnicos de segurança.**

## 7.5. Integração entre ferramentas

Ferramentas de IA poderão exigir estruturas próprias para descoberta de agentes.

As integrações específicas deverão ser derivadas das definições canônicas.

Não manter cópias independentes com instruções divergentes.

---

# 8. Skills

As skills ficarão em:

`.harness/skills/`

Cada skill deverá definir:

- Objetivo.
- Condições de ativação.
- Pré-requisitos.
- Entradas.
- Procedimento.
- Ferramentas.
- Verificações.
- Critérios de conclusão.
- Restrições.

## 8.1. Skills previstas

- Implementation.
- Architecture Review.
- Code Review.
- Testing.
- Security Audit.
- Public Repository Safety.
- Documentation.
- Script Development.
- Release Validation.

## 8.2. Utilização

Antes de utilizar uma skill:

1. Confirmar sua existência.
2. Ler as instruções.
3. Verificar requisitos.
4. Confirmar ferramentas disponíveis.
5. Executar o procedimento.
6. Realizar verificações.
7. Registrar resultados.

Não afirmar que uma skill foi utilizada quando ela não estava disponível ou não foi executada.

## 8.3. Reutilização

Procedimentos comuns deverão permanecer em skills canônicas.

Evitar copiar o mesmo procedimento em múltiplos agentes.

---

# 9. Engenharia de scripts

Scripts do harness são componentes de software e deverão receber o mesmo rigor aplicado às funcionalidades do produto.

## 9.1. Categorias

```text
scripts/
├── automation/
├── security/
├── quality/
├── architecture/
├── documentation/
├── release/
└── lib/
```

## 9.2. Contrato obrigatório

Todo script deverá possuir:

1. Objetivo definido.
2. Entradas explícitas.
3. Saídas previsíveis.
4. Tratamento de erros.
5. Códigos de retorno.
6. Efeitos colaterais documentados.
7. Comportamento seguro.
8. Testes automatizados apropriados.
9. Instruções de execução.

## 9.3. Códigos de saída

Utilizar preferencialmente:

- `0`: sucesso.
- `1`: validação reprovada.
- `2`: erro operacional ou configuração inválida.

Códigos adicionais deverão ser documentados.

## 9.4. Portabilidade

Priorizar scripts executáveis nos sistemas operacionais pretendidos.

Evitar dependência desnecessária de comandos específicos de um ambiente.

Utilizar resolução de caminhos independente da máquina.

## 9.5. Determinismo

Scripts deverão produzir resultados previsíveis para entradas equivalentes em ambientes controlados.

## 9.6. Idempotência

Sempre que aplicável, permitir execução repetida sem efeitos indesejados.

## 9.7. Segurança operacional

Scripts não poderão:

- Excluir arquivos indiscriminadamente.
- Sobrescrever informações sem autorização.
- Ignorar falhas.
- Contornar verificações.
- Publicar automaticamente.
- Executar ações destrutivas por conveniência.
- Expor credenciais em logs.

---

# 10. Verificações de segurança

O projeto deverá possuir mecanismos automáticos de prevenção de vazamentos.

## 10.1. Secrets Scanner

Detectar possíveis:

- Senhas.
- Tokens.
- Chaves privadas.
- Credenciais.
- Segredos.
- Strings de conexão sensíveis.

Não registrar o valor completo das ocorrências detectadas.

## 10.2. Absolute Path Scanner

Identificar caminhos que revelem ambientes privados.

A análise deverá considerar:

- Diretórios pessoais.
- Perfis de usuário.
- Diretórios privados de sincronização.
- Caminhos específicos de máquinas.
- Localizações de infraestrutura restrita.

Evitar falsos positivos indiscriminados sem reduzir o nível de proteção necessário.

## 10.3. Forbidden Reference Scanner

Identificar referências expressamente proibidas.

A implementação pública deverá ser genérica.

Os valores reais da política privada não poderão ser versionados.

O verificador deverá considerar, quando apropriado:

- Maiúsculas e minúsculas.
- Normalização Unicode.
- Separadores.
- Variações simples de escrita.

Não imprimir identificadores privados nos relatórios.

## 10.4. Sensitive File Scanner

Detectar arquivos inadequados para publicação.

Exemplos:

- Certificados privados.
- Backups.
- Dumps.
- Arquivos de credenciais.
- Configurações privadas.
- Documentos internos.
- Arquivos temporários confidenciais.

## 10.5. Repository Integrity Scanner

Verificar:

- Arquivos versionados indevidamente.
- Configurações locais.
- Artefatos inesperados.
- Referências inexistentes.
- Conteúdo incompatível com a política pública.

## 10.6. Artifact Scanner

Verificar os artefatos efetivamente produzidos pelo build.

A ausência de informações sensíveis em `src/` não garante que o pacote final esteja seguro.

## 10.7. Dependency Security

Avaliar:

- Vulnerabilidades conhecidas.
- Integridade das dependências.
- Licenças.
- Dependências inesperadas.
- Riscos de cadeia de suprimentos.

## 10.8. Falha segura

Se uma verificação obrigatória não puder ser executada:

- Registrar a limitação.
- Informar o motivo.
- Não declarar aprovação.
- Bloquear a publicação quando aplicável.

**Uma verificação não executada nunca deverá ser apresentada como bem-sucedida.**

---

# 11. Testes automatizados

Toda implementação deverá possuir testes proporcionais à sua complexidade e risco.

## 11.1. Testes unitários

Verificar:

- Regras.
- Validações.
- Transformações.
- Invariantes.
- Tratamento de erros.

## 11.2. Testes de integração

Verificar a comunicação entre componentes, adaptadores e mecanismos de persistência.

## 11.3. Testes end-to-end

Verificar fluxos reais do navegador.

## 11.4. Testes negativos

Exercitar cenários como:

- Entradas inválidas.
- Permissões negadas.
- Recursos indisponíveis.
- Arquivos malformados.
- Falhas de persistência.
- Mensagens inesperadas.
- Estados inconsistentes.

## 11.5. Testes de segurança

Utilizar dados sintéticos para verificar:

- Sanitização de conteúdo.
- Tratamento de permissões.
- Validação de mensagens.
- Controle de acesso a arquivos.
- Prevenção de vazamentos.

## 11.6. Testes dos scripts

Scripts críticos deverão possuir testes:

- Positivos.
- Negativos.
- De limite.
- De falha operacional.
- De regressão.

Um scanner somente poderá ser considerado confiável quando houver evidências de sua capacidade de detectar violações relevantes.

## 11.7. Qualidade dos testes

Avaliar:

- Capacidade de detectar defeitos.
- Asserções relevantes.
- Independência.
- Determinismo.
- Cobertura de cenários.
- Resistência a regressões.
- Uso adequado de mocks.

Não utilizar cobertura numérica isoladamente como critério absoluto de qualidade.

## 11.8. Mutation Testing

Utilizar quando houver benefício técnico demonstrável.

Priorizar componentes críticos como verificadores de segurança, validações e mecanismos de transformação.

Analisar mutantes sobreviventes e a efetividade real dos testes.

---

# 12. Quality Gates

> [!NOTE]
> A especificação canônica completa, o catálogo detalhado (QG-01 a QG-13), modos operacionais (FAST, FULL, STRICT, RELEASE) e o roadmap de homologação residem em [`docs/quality-gates/`](docs/quality-gates/README.md).

As verificações deverão ser executadas conforme o estágio de desenvolvimento.

## 12.1. Durante a implementação

Executar verificações direcionadas:

- Typecheck.
- Lint.
- Testes relevantes.
- Verificações específicas do módulo.

## 12.2. Pre-commit

Verificar os arquivos staged.

Controles previstos:

- Secrets scanning.
- Private path scanning.
- Forbidden reference scanning.
- Sensitive file scanning.
- Verificações rápidas de qualidade.

## 12.3. Pre-push

Verificar:

- Commits destinados ao remoto.
- Testes relevantes.
- Segurança.
- Integridade arquitetural.
- Build, quando aplicável.

## 12.4. Integração contínua

A CI deverá executar verificações reproduzíveis em ambiente limpo.

Incluir, conforme disponibilidade:

- Typecheck.
- Lint.
- Testes.
- Segurança pública.
- Integridade do harness.
- Verificações arquiteturais.
- Build.

## 12.5. Release

Antes de uma publicação:

- Executar os gates obrigatórios.
- Conferir artefatos.
- Revisar dependências.
- Inspecionar permissões da extensão.
- Conferir documentação.
- Verificar conteúdo público.
- Confirmar autorização.

## 12.6. Política de bloqueio

Falhas obrigatórias não poderão ser ignoradas.

Não será permitido alterar um verificador apenas para obter resultado positivo.

A correção deverá tratar a causa da falha.

---

# 13. Integridade arquitetural

O projeto deverá possuir verificações capazes de identificar violações de seus limites.

## 13.1. Architecture Boundaries

Verificar:

- Dependências circulares.
- Imports incompatíveis com limites definidos.
- Acoplamento indevido entre módulos.
- Dependências inadequadas de infraestrutura.
- Uso irregular de componentes compartilhados.

As regras deverão refletir decisões arquiteturais aprovadas.

## 13.2. Dependency Integrity

Verificar:

- Lockfile.
- Dependências.
- Versões.
- Compatibilidade.
- Pacotes inesperados.
- Riscos de segurança.

## 13.3. Harness Integrity

Verificar:

- Agents sem contrato.
- Skills inválidas.
- Scripts inexistentes.
- Scripts críticos sem testes.
- Referências quebradas.
- Documentação obrigatória ausente.
- Regras duplicadas ou conflitantes.
- Configurações privadas versionadas indevidamente.

## 13.4. Documentation Integrity

Verificar:

- Links internos.
- Caminhos.
- Referências.
- Nomes de módulos.
- Instruções desatualizadas.
- Documentos canônicos conflitantes.

---

# 14. Documentação

Documentação é parte do desenvolvimento.

O código e os documentos deverão permanecer consistentes.

## 14.1. Documentação técnica

Registrar, quando necessário:

- Objetivo.
- Responsabilidades.
- Funcionamento.
- Contratos.
- Entradas e saídas.
- Limitações.
- Exemplos.
- Riscos.
- Critérios de validação.

## 14.2. Documentação inline

Comentários deverão explicar principalmente:

- Invariantes.
- Decisões relevantes.
- Restrições.
- Comportamentos não óbvios.
- Justificativas técnicas.

Evitar comentários que apenas repitam o código.

## 14.3. ADRs

Criar ou propor Architecture Decision Records para decisões relevantes.

Um ADR deverá apresentar:

- Contexto.
- Problema.
- Alternativas.
- Decisão.
- Justificativa.
- Consequências.
- Riscos.
- Estado da decisão.

Não registrar como aprovada uma decisão ainda pendente.

## 14.4. Relatórios

Relatórios deverão diferenciar:

- Planejado.
- Implementado.
- Verificado.
- Não verificado.
- Riscos.
- Pendências.

Nunca inventar comandos executados, testes aprovados ou resultados de revisão.

## 14.5. Estados de implementação

Utilizar terminologia precisa:

**Planejado:** definido, mas não implementado.

**Em desenvolvimento:** implementação parcial.

**Implementado:** comportamento desenvolvido.

**Validado:** verificações relevantes executadas e aprovadas.

**Bloqueado:** impedimento identificado.

Não confundir implementação com validação.

---

# 15. Fluxo universal de desenvolvimento

O fluxo deverá ser proporcional à complexidade da atividade.

## Fase 1 — Compreensão

- Identificar o objetivo.
- Ler a documentação.
- Inspecionar o código.
- Verificar restrições.
- Reconhecer dependências.
- Identificar riscos.

## Fase 2 — Planejamento

- Definir escopo.
- Identificar arquivos afetados.
- Selecionar abordagem.
- Determinar critérios de aceitação.
- Planejar testes.
- Identificar possíveis impactos.

Para tarefas pequenas, o planejamento poderá ser breve.

## Fase 3 — Implementação

- Aplicar alterações incrementais.
- Preservar contratos.
- Respeitar limites modulares.
- Tratar erros.
- Evitar mudanças não relacionadas.
- Criar ou atualizar testes.

## Fase 4 — Verificação

- Executar testes pertinentes.
- Validar tipos.
- Executar lint.
- Verificar arquitetura.
- Executar segurança.
- Avaliar resultados reais.

## Fase 5 — Revisão

- Inspecionar o diff.
- Avaliar regressões.
- Conferir dependências.
- Verificar arquivos adicionados.
- Revisar riscos.
- Confirmar o escopo.

## Fase 6 — Documentação

- Atualizar documentos afetados.
- Registrar decisões.
- Atualizar relatórios exigidos.
- Conferir consistência com o código.

## Fase 7 — Entrega

Informar:

1. O que foi realizado.
2. Quais arquivos foram alterados.
3. Quais decisões foram tomadas.
4. Quais verificações foram executadas.
5. Quais resultados foram obtidos.
6. Quais limitações permanecem.
7. Quais riscos exigem atenção.

Não declarar conclusão integral quando verificações obrigatórias estiverem pendentes.

---

# 16. Controle de alterações

## 16.1. Preservação do trabalho existente

Antes de modificar arquivos, verificar alterações preexistentes.

Não sobrescrever trabalhos anteriores sem autorização.

## 16.2. Escopo restrito

Não modificar arquivos não relacionados sem necessidade demonstrável.

## 16.3. Refatorações

Refatorações deverão preservar comportamentos existentes, salvo quando a tarefa exigir alteração funcional.

## 16.4. Dependências

Antes de instalar dependências:

- Verificar necessidade.
- Avaliar alternativas.
- Conferir segurança.
- Verificar licença.
- Considerar manutenção.
- Avaliar impacto no build.

## 16.5. Operações destrutivas

Não executar comandos que possam destruir trabalho ou dados sem autorização adequada.

Evitar limpezas indiscriminadas de diretórios.

## 16.6. Alterações em segurança

Modificações em políticas, verificadores e quality gates exigem revisão compatível com o risco.

Não enfraquecer controles silenciosamente.

---

# 17. Git e GitHub

## 17.1. Commits

Commits somente poderão ser criados quando houver autorização compatível.

Antes de um commit:

- Inspecionar alterações.
- Conferir arquivos staged.
- Verificar segurança.
- Executar os controles obrigatórios.
- Confirmar que não existem arquivos privados.

## 17.2. Push

Antes de publicar alterações:

- Conferir commits.
- Executar verificações pré-push.
- Verificar conteúdo proibido.
- Avaliar resultados.
- Confirmar autorização.

## 17.3. Proibições

Não executar automaticamente:

- Force push.
- Reescrita destrutiva de histórico.
- Exclusão de branches.
- Publicação de releases.
- Alterações de permissões do repositório.
- Operações que ignorem hooks obrigatórios.

## 17.4. Histórico Git

Informações removidas da versão atual podem permanecer no histórico.

Antes da primeira publicação pública, o histórico relevante deverá ser auditado.

Caso um segredo real tenha sido exposto, sua revogação ou rotação deverá ser considerada conforme a natureza da credencial.

## 17.5. GitHub Actions

Workflows deverão utilizar:

- Permissões mínimas.
- Dependências controladas.
- Verificações obrigatórias.
- Logs seguros.
- Restrições apropriadas para pull requests externos.
- Separação entre validação e publicação.

Não disponibilizar segredos de publicação a código não confiável.

---

# 18. Proteção e evolução do harness

O próprio harness deverá ser submetido a testes e verificações.

## 18.1. Alterações em agents

Verificar:

- Contratos.
- Ferramentas.
- Responsabilidades.
- Referências.
- Segurança.

## 18.2. Alterações em skills

Verificar:

- Condições de ativação.
- Procedimentos.
- Dependências.
- Compatibilidade com políticas.
- Critérios de conclusão.

## 18.3. Alterações em scripts

Exigir testes compatíveis com a criticidade.

## 18.4. Alterações em quality gates

Revisar efeitos sobre o fluxo de desenvolvimento e o nível de proteção.

## 18.5. Integridade

Executar o verificador de integridade do harness quando estiver disponível.

## 18.6. Ausência de recursos

Se um agente, skill, script ou verificador ainda não existir:

- Informar a ausência.
- Não inventar resultados.
- Não simular execução.
- Utilizar alternativas autorizadas.
- Registrar a pendência quando relevante.

---

# 19. Critérios universais de conclusão

Antes de declarar uma tarefa concluída, confirmar:

- [ ] O objetivo solicitado foi atendido.
- [ ] O escopo foi respeitado.
- [ ] A arquitetura foi preservada ou conscientemente evoluída.
- [ ] As alterações foram revisadas.
- [ ] Os testes relevantes foram executados.
- [ ] As verificações obrigatórias foram realizadas.
- [ ] Não foram introduzidos segredos conhecidos.
- [ ] Não foram introduzidas referências corporativas proibidas.
- [ ] Não foram incorporados caminhos privados.
- [ ] Os artefatos públicos não contêm arquivos indevidos.
- [ ] A documentação necessária está atualizada.
- [ ] Os resultados apresentados são verificáveis.
- [ ] As limitações foram registradas.
- [ ] Nenhuma publicação ocorreu sem autorização.

Esses critérios deverão ser aplicados conforme a natureza da tarefa.

Uma tarefa documental não exige necessariamente um build completo, enquanto uma alteração crítica de infraestrutura poderá exigir verificações adicionais.

---

# 20. Comportamentos proibidos

Nenhum agente poderá:

1. Publicar informações confidenciais.
2. Reproduzir identificadores corporativos proibidos.
3. Incorporar caminhos privados ao repositório.
4. Expor credenciais ou segredos.
5. Utilizar documentos profissionais reais como fixtures.
6. Ignorar verificações obrigatórias.
7. Desabilitar scanners para obter aprovação.
8. Enfraquecer testes intencionalmente.
9. Inventar resultados de comandos.
10. Declarar testes não executados como aprovados.
11. Modificar políticas críticas silenciosamente.
12. Introduzir dependências sem justificativa.
13. Criar abstrações prematuras sem necessidade.
14. Executar operações destrutivas sem autorização.
15. Publicar código sem autorização.
16. Enviar informações privadas a serviços externos sem permissão.
17. Tratar especificações como funcionalidades implementadas.
18. Duplicar fontes canônicas de políticas.
19. Excluir evidências de falha para produzir relatórios positivos.
20. Tratar ausência de alertas como garantia absoluta de segurança.

---

# 21. Conduta esperada dos agentes

Todo agente deverá atuar com:

**Rigor técnico**

Investigar antes de concluir.

**Pensamento crítico**

Questionar premissas e identificar problemas reais.

**Transparência**

Distinguir fatos, hipóteses e limitações.

**Responsabilidade**

Respeitar autorizações, segurança e escopo.

**Simplicidade**

Evitar soluções excessivamente complexas.

**Rastreabilidade**

Relacionar alterações aos seus motivos e resultados.

**Verificabilidade**

Produzir evidências que possam ser reproduzidas.

**Autonomia controlada**

Executar operações permitidas sem extrapolar sua autoridade.

**Independência tecnológica**

Evitar dependência exclusiva de um fornecedor de inteligência artificial.

---

# 22. Diretriz final

O ExtensionTools deverá demonstrar maturidade de engenharia, não apenas capacidade de gerar código.

Seu desenvolvimento deverá preservar:

- Arquitetura compreensível.
- Responsabilidades claras.
- Modularidade.
- Segurança.
- Automação confiável.
- Testes efetivos.
- Documentação consistente.
- Governança.
- Publicação controlada.
- Responsabilidade humana.

O harness deverá permitir que qualquer desenvolvedor autorizado compreenda como o projeto foi construído, quais decisões foram tomadas, como as alterações são verificadas e quais mecanismos protegem o repositório.

A utilização de inteligência artificial deverá aumentar a produtividade sem reduzir a compreensão, a segurança ou a capacidade de manutenção.

**Regra permanente: nenhum ganho de velocidade, conveniência ou automação justifica comprometer a confidencialidade, a integridade ou a qualidade do ExtensionTools.**
