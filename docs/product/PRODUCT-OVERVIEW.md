# ExtensionTools — Visão Geral do Produto e Ferramentas

**Tipo:** Extensão de produtividade para navegadores  
**Plataforma inicial:** Google Chrome e navegadores baseados em Chromium  
**Arquitetura proposta:** Monólito modular, local-first, Manifest V3  
**Estado:** Planejamento e definição de requisitos

---

## 1. Visão geral

O **ExtensionTools** é uma extensão de navegador que reúne ferramentas de produtividade, visualização, organização, análise e manipulação de informações em um único ambiente.

Seu objetivo é reduzir a necessidade de alternar constantemente entre sites, aplicativos, exploradores de arquivos e ferramentas auxiliares para executar tarefas relativamente simples.

A extensão deverá permitir que o usuário realize operações diretamente no navegador, com acesso rápido por painel lateral, abas dedicadas e menus de contexto.

### Proposta central

**Capturar, visualizar, organizar, comparar, documentar e reutilizar informações com o mínimo de esforço operacional.**

O ExtensionTools não pretende substituir sistemas de gestão, editores especializados, serviços de armazenamento ou sistemas operacionais.

Sua função será atuar como uma camada de produtividade sobre as ferramentas, documentos e processos que o usuário já utiliza.

### Princípios do produto

1. **Local-first:** priorizar processamento e armazenamento locais.
2. **Modularidade:** funcionalidades independentes, com integração quando útil.
3. **Simplicidade:** resolver tarefas frequentes sem processos excessivamente complexos.
4. **Privacidade:** evitar coleta, transmissão e armazenamento desnecessários.
5. **Controle do usuário:** operações que modificam arquivos exigem ações explícitas.
6. **Interoperabilidade:** utilizar formatos abertos e preservar arquivos existentes.
7. **Extensibilidade:** permitir adicionar novas ferramentas sem comprometer as anteriores.
8. **Segurança:** solicitar apenas as permissões necessárias para cada operação.

---

# 2. Ferramentas principais

## 2.1. Calendar — Calendário e compromissos

### Objetivo

Disponibilizar um calendário compacto e de fácil acesso dentro do navegador.

### Problema resolvido

A necessidade de abrir aplicativos ou páginas externas para consultar compromissos, verificar datas e organizar atividades.

### Funcionalidades

- Visualização diária, semanal e mensal.
- Consulta rápida aos próximos compromissos.
- Criação, edição e exclusão de eventos.
- Compromissos recorrentes.
- Pesquisa de eventos.
- Categorias e identificação visual dos compromissos.
- Lembretes locais.
- Visualização de compromissos diretamente no painel lateral.
- Integração opcional com provedores de calendário autorizados.

### Comportamento esperado

Ao abrir o ExtensionTools, o usuário poderá consultar os próximos compromissos sem abandonar a página atual.

O calendário também poderá ser aberto em uma aba completa para visualizações mais detalhadas.

### Considerações arquiteturais

O calendário deverá funcionar inicialmente com dados locais.

Integrações externas serão opcionais e implementadas por adaptadores específicos, sem tornar o módulo dependente de um provedor.

Os lembretes dependerão das limitações de execução do navegador e não substituirão um sistema de notificações garantidas do sistema operacional.

---

## 2.2. Markdown Workspace — Editor e visualizador Markdown

### Objetivo

Permitir a visualização imediata de conteúdo Markdown, principalmente a partir de texto copiado e colado.

### Problema resolvido

Frequentemente, o usuário possui um conteúdo Markdown, mas não um arquivo `.md`.

Atualmente, a visualização exige abrir um site externo, colar o texto e utilizar o visualizador disponibilizado.

O ExtensionTools deverá eliminar essa dependência para as operações habituais.

### Funcionalidades essenciais

- Colar Markdown diretamente em um campo de texto.
- Renderizar o conteúdo imediatamente.
- Visualizar editor e resultado lado a lado.
- Alternar entre edição e visualização.
- Suporte a GitHub Flavored Markdown (GFM).
- Tabelas, listas, títulos e links.
- Blocos de código com destaque de sintaxe.
- Copiar o Markdown original.
- Copiar conteúdo formatado quando suportado.
- Importar arquivos `.md`.
- Exportar conteúdo como `.md`, HTML ou PDF.
- Abrir em painel lateral ou aba completa.
- Limpar e substituir rapidamente o conteúdo.

### Funcionalidades futuras

- Múltiplos documentos temporários.
- Rascunhos locais.
- Renderização Mermaid.
- Fórmulas LaTeX.
- Sumário navegável.
- Pesquisa dentro do documento.
- Comparação entre duas versões Markdown.
- Modelos reutilizáveis de documentação.

### Considerações arquiteturais

A entrada principal será texto, e não necessariamente um arquivo.

O editor, renderizador e mecanismo de exportação deverão ser componentes separados.

Conteúdos HTML incorporados ao Markdown deverão ser tratados como não confiáveis.

---

## 2.3. XML Inspector — Visualizador e analisador estrutural de XML

### Objetivo

Facilitar a leitura, inspeção, formatação e comparação de documentos XML.

### Problema resolvido

Documentos XML extensos ou sem formatação são difíceis de interpretar diretamente em editores simples ou respostas de integrações.

### Funcionalidades

- Colar XML diretamente.
- Importar arquivos XML.
- Formatação automática com indentação.
- Exibição de estrutura hierárquica.
- Expandir e recolher elementos.
- Pesquisar tags, atributos e valores.
- Destacar erros de sintaxe.
- Identificar namespaces.
- Visualizar conteúdo em formato texto ou árvore.
- Comparar dois XMLs.
- Localizar diferenças entre valores e estruturas.
- Copiar elementos ou trechos selecionados.
- Exportar XML formatado.
- Enviar conteúdo selecionado para o Text Diff.

### Possíveis evoluções

- Validação contra arquivos XSD fornecidos pelo usuário.
- Navegação estruturada por XPath.
- Identificação de elementos obrigatórios conforme um schema carregado.
- Comparação entre documentos com normalização configurável.
- Relatórios de diferenças estruturais.

### Limitações

O XML Inspector será uma ferramenta técnica genérica.

Ele não deverá presumir regras fiscais, interpretar automaticamente rejeições como causas confirmadas ou substituir validadores oficiais.

A validação estrutural de XML não equivale à validação das regras de negócio de uma integração.

---

## 2.4. JSON Inspector — Visualizador e analisador JSON

### Objetivo

Facilitar a inspeção de dados estruturados em JSON.

### Funcionalidades

- Colar JSON diretamente.
- Importar arquivos `.json`.
- Formatar e validar sintaxe.
- Visualização hierárquica.
- Expandir e recolher objetos e arrays.
- Pesquisar propriedades e valores.
- Copiar caminhos de propriedades.
- Comparar documentos JSON.
- Identificar propriedades adicionadas, removidas ou modificadas.
- Exportar JSON formatado.

### Integração

O módulo deverá compartilhar componentes e mecanismos de comparação com o XML Inspector e o Text Diff, quando tecnicamente adequado.

---

## 2.5. Text Diff — Comparador de conteúdo

### Objetivo

Identificar rapidamente diferenças entre duas versões de texto ou documentos.

### Problema resolvido

A comparação manual de mensagens, parâmetros, documentos e estruturas aumenta o esforço de análise e a possibilidade de deixar alterações despercebidas.

### Funcionalidades

- Colar dois textos.
- Comparação lado a lado.
- Comparação em linha.
- Destaque de adições, exclusões e modificações.
- Identificação das linhas alteradas.
- Comparação de caracteres.
- Opção de ignorar espaços em branco.
- Copiar diferenças selecionadas.
- Exportar resultados.

### Integrações

O motor de comparação poderá ser reutilizado por:

- Markdown Workspace.
- XML Inspector.
- JSON Inspector.
- Investigation Board.

### Consideração arquitetural

O mecanismo de comparação deverá ser independente da interface.

Comparações semânticas ou estruturais exigirão normalizadores específicos para cada formato.

---

## 2.6. PDF Export — Captura e exportação de conteúdo

### Objetivo

Permitir salvar páginas, artigos ou partes de uma página em documentos PDF.

### Problema resolvido

A necessidade de utilizar múltiplas ferramentas para guardar conteúdos encontrados durante a navegação.

### Modos de operação

**Página completa**

Preparar a página para impressão ou exportação em PDF.

**Artigo**

Extrair o conteúdo principal de uma página quando tecnicamente possível, reduzindo elementos desnecessários.

**Seleção**

Permitir selecionar texto ou elementos específicos para preparar uma versão exportável.

**Captura visual**

Capturar a região visível da página, com possibilidade de recorte.

### Funcionalidades complementares

- Pré-visualização antes da exportação.
- Configuração de nome do documento.
- Inclusão opcional de URL e data de captura.
- Ajustes de margens e orientação quando suportados.
- Anotações sobre capturas.
- Exportação de conteúdo produzido no Markdown Workspace.

### Limitações

A exportação de HTML formatado não garante fidelidade visual absoluta à página original.

Capturas visuais e PDFs com texto selecionável possuem características distintas.

A extensão deverá informar essas diferenças e não prometer exportação silenciosa ou perfeita de qualquer página.

---

# 3. Organização de arquivos e referências

## 3.1. Quick Files — Acesso rápido a arquivos

### Objetivo

Reduzir a necessidade de navegar repetidamente pelo explorador de arquivos para acessar documentos frequentes.

### Funcionalidades

- Selecionar arquivos e diretórios autorizados.
- Criar favoritos.
- Organizar favoritos por categorias.
- Localizar arquivos dentro de diretórios autorizados.
- Listar arquivos recentes utilizados na extensão.
- Abrir formatos suportados nos visualizadores internos.
- Pesquisar documentos pelo nome.
- Consultar metadados básicos.
- Acessar pastas frequentes.

### Considerações arquiteturais

A primeira versão utilizará recursos de acesso ao sistema de arquivos disponíveis no navegador.

A abertura direta no aplicativo nativo ou no explorador do sistema operacional poderá depender de um aplicativo auxiliar.

A extensão não deverá realizar varreduras irrestritas do computador.

---

## 3.2. Reference Hub — Central de referências

### Objetivo

Facilitar o acesso a documentação, arquivos técnicos, páginas e referências consultadas frequentemente.

### Problema resolvido

Materiais importantes podem estar distribuídos entre diretórios locais, favoritos do navegador e páginas externas.

O Reference Hub deverá permitir localizá-los rapidamente sem substituir os repositórios originais.

### Funcionalidades

- Registrar links de páginas.
- Vincular arquivos e diretórios locais.
- Criar categorias e etiquetas.
- Pesquisar referências.
- Marcar itens favoritos.
- Registrar descrição e observações.
- Identificar a origem de documentos.
- Registrar versão e data de consulta.
- Abrir documentos nos visualizadores disponíveis.
- Vincular referências a um workspace de investigação.

### Organização dos materiais

As referências continuarão armazenadas nos diretórios originais.

O Reference Hub manterá apenas vínculos e metadados estritamente necessários e autorizados.

A ferramenta não deverá criar cópias automáticas de materiais ou presumir que uma documentação arquivada continua vigente.

### Integração com Investigation Board

Um atendimento poderá referenciar um documento técnico existente, evitando duplicações desnecessárias.

Referências vinculadas não serão consideradas evidências de que determinada regra foi verificada, a menos que essa verificação tenha sido registrada.

---

# 4. Investigation Board — Assistente de organização de atendimentos

## 4.1. Objetivo

Facilitar a criação, localização, organização, acompanhamento e documentação de investigações técnicas, aproveitando estruturas de diretórios já existentes.

O Investigation Board não deverá substituir sistemas de chamados, ferramentas corporativas ou o explorador de arquivos.

Sua principal função será atuar como uma camada operacional sobre os diretórios autorizados.

## 4.2. Estrutura de arquivos existente

Um dos cenários que orientam o desenvolvimento utiliza diretórios locais sincronizados com OneDrive.

A organização segue uma hierarquia semelhante a:

- Tipo de atendimento.
- Ano.
- Mês.
- Pasta identificadora da ocorrência.
- Arquivos e documentos relacionados.

Existem também diretórios independentes de materiais técnicos reutilizáveis.

**A extensão deverá preservar essas estruturas, sem exigir migração ou reorganização.**

O ExtensionTools trabalhará sobre os diretórios locais autorizados. A sincronização continuará sendo responsabilidade do cliente OneDrive.

## 4.3. Configuração de diretórios

### Funcionalidades

- Selecionar diretórios-raiz.
- Definir categorias de diretórios.
- Configurar padrões de nomenclatura.
- Identificar hierarquias de ano e mês.
- Reconhecer pastas existentes.
- Navegar pela estrutura.
- Atualizar a listagem sob demanda.
- Verificar permissões de acesso.

### Comportamento esperado

O usuário selecionará uma pasta local.

A extensão apresentará seu conteúdo e permitirá executar ações autorizadas sem exigir que os arquivos sejam importados para um repositório separado.

## 4.4. Criação assistida de atendimentos

### Objetivo

Automatizar tarefas repetitivas de organização de diretórios.

### Funcionalidades

- Selecionar categoria de atendimento.
- Informar os identificadores necessários.
- Definir um resumo curto.
- Sugerir ano e mês.
- Gerar uma prévia do nome da pasta.
- Validar caracteres e nomes.
- Identificar possíveis duplicidades.
- Criar o diretório após confirmação.
- Criar subdiretórios opcionais por template.
- Abrir o atendimento recém-criado na interface.

### Requisitos

O padrão de nomenclatura deverá ser configurável.

A extensão não deverá modificar, renomear ou mover automaticamente pastas preexistentes.

## 4.5. Workspace de investigação

### Objetivo

Disponibilizar uma visão operacional dos documentos associados a uma ocorrência.

### Funcionalidades

- Selecionar uma pasta existente.
- Listar documentos e subdiretórios.
- Identificar formatos suportados.
- Abrir XML, JSON e Markdown.
- Enviar documentos ao comparador.
- Vincular referências técnicas.
- Registrar observações temporárias.
- Organizar hipóteses e resultados de testes.
- Registrar pendências.
- Preparar documentação estruturada.

### Estados de evidência

As anotações poderão classificar informações como:

- Observado.
- Hipótese.
- Confirmado.
- Descartado.
- Pendente.

Essa classificação será informada pelo usuário, não determinada automaticamente pela extensão.

### Limitações

O Investigation Board não deverá:

- Diagnosticar automaticamente um sistema externo.
- Alterar dados de produção.
- Executar correções operacionais.
- Substituir o sistema oficial de chamados.
- Interpretar a existência de um arquivo como confirmação de uma hipótese.

## 4.6. Documentação de investigações

A extensão poderá oferecer modelos de anotação Markdown contendo:

- Identificação da investigação.
- Descrição do problema.
- Comportamento observado.
- Comportamento esperado.
- Evidências analisadas.
- Hipóteses.
- Testes executados.
- Resultados.
- Pendências.
- Conclusão.

O usuário poderá exportar essas anotações para a pasta correspondente, quando houver autorização.

O arquivo gerado deverá continuar acessível independentemente do ExtensionTools.

## 4.7. Integração com OneDrive

### Modelo proposto

**ExtensionTools → Diretório local autorizado → Cliente OneDrive → Sincronização**

Não haverá necessidade inicial de autenticação na API do OneDrive.

### Cuidados

- Arquivos sob demanda podem não estar disponíveis offline.
- O navegador pode exigir renovação de permissões.
- A extensão não deverá presumir que uma alteração foi sincronizada com sucesso.
- Devem ser tratados possíveis conflitos de nomenclatura e arquivos.
- Arquivos alterados poderão ser sincronizados automaticamente pelo OneDrive.
- Operações de escrita exigirão confirmação.
- Alterações e exclusões em massa não farão parte do MVP.

## 4.8. Arquivos sensíveis

O Investigation Board deverá respeitar limites especiais para:

- Backups.
- Certificados digitais e chaves privadas.
- Documentos confidenciais.
- Credenciais.
- Arquivos contendo informações pessoais.
- Arquivos de clientes e ambientes corporativos.

Esses arquivos não deverão ser abertos, analisados, indexados por conteúdo, copiados ou transmitidos automaticamente.

Quando necessário, a extensão poderá exibir apenas informações mínimas de identificação, conforme permissões e políticas aplicáveis.

---

# 5. Ferramentas complementares

## 5.1. Snippet Library — Biblioteca de textos reutilizáveis

### Objetivo

Manter uma coleção de modelos textuais e estruturas reutilizáveis.

### Funcionalidades

- Salvar snippets de texto.
- Organizar por categoria.
- Pesquisar snippets.
- Copiar com um clique.
- Criar modelos Markdown.
- Utilizar campos substituíveis.
- Marcar favoritos.

Os modelos genéricos não deverão incorporar informações confidenciais de atendimentos.

---

## 5.2. Tab Workspaces — Organização de abas

### Objetivo

Facilitar a organização de múltiplas páginas relacionadas a uma atividade.

### Funcionalidades

- Criar grupos de links.
- Abrir conjuntos de páginas.
- Salvar conjuntos de abas mediante ação do usuário.
- Restaurar páginas registradas.
- Renomear grupos.
- Associar favoritos e referências.

O recurso não deverá capturar automaticamente o conteúdo das páginas.

---

## 5.3. Evidence Capture — Captura de evidências

### Objetivo

Disponibilizar mecanismos de captura visual e documental.

### Funcionalidades

- Capturar a área visível de uma página.
- Selecionar regiões para recorte.
- Adicionar anotações.
- Registrar URL e data, quando aplicável.
- Pré-visualizar antes de salvar.
- Exportar imagens ou PDFs.
- Vincular a captura a um workspace autorizado.

### Requisito de integridade

A ferramenta deverá diferenciar a captura original de versões anotadas ou editadas.

Anotações não devem ser apresentadas como parte do conteúdo original.

---

# 6. Integração entre ferramentas

Embora independentes, as ferramentas deverão compartilhar operações comuns.

### Exemplos de integração

**Markdown Workspace → PDF Export**

Renderizar um documento Markdown e exportar sua visualização.

**XML Inspector → Text Diff**

Comparar dois documentos XML selecionados.

**JSON Inspector → Text Diff**

Identificar alterações entre respostas JSON.

**Quick Files → XML Inspector**

Abrir diretamente um arquivo XML autorizado.

**Reference Hub → Investigation Board**

Vincular uma referência técnica a uma investigação.

**Investigation Board → Markdown Workspace**

Preparar e visualizar anotações estruturadas.

**Evidence Capture → PDF Export**

Exportar uma captura visual documentada.

**Tab Workspaces → Reference Hub**

Abrir grupos de páginas previamente cadastradas.

O compartilhamento de conteúdos deverá ocorrer por ações explícitas, sem transmissão automática entre contextos.

---

# 7. Interface e experiência de uso

## 7.1. Painel lateral

Será o principal ponto de acesso da extensão.

Deverá oferecer:

- Navegação pelas ferramentas.
- Acesso aos favoritos.
- Compromissos próximos.
- Documentos recentes autorizados.
- Ações rápidas.
- Busca de ferramentas.

## 7.2. Abas completas

Ferramentas que necessitam de mais espaço poderão abrir uma página própria da extensão.

Exemplos:

- Markdown Workspace.
- XML Inspector.
- Text Diff.
- Calendário mensal.
- Investigation Board.

## 7.3. Menu de contexto

O usuário poderá selecionar texto ou conteúdo de uma página e executar ações, quando disponíveis e autorizadas.

Exemplos:

- Abrir seleção no Markdown Workspace.
- Comparar texto.
- Salvar referência.
- Preparar conteúdo para PDF.

## 7.4. Consistência visual

Todas as ferramentas deverão compartilhar:

- Design system.
- Navegação.
- Temas claro e escuro.
- Componentes de interface.
- Estados de carregamento e erro.
- Mecanismos de confirmação.
- Mensagens de permissão.
- Padrões de acessibilidade.

---

# 8. Arquitetura técnica proposta

## 8.1. Tecnologias

| Tecnologia | Responsabilidade |
|---|---|
| TypeScript | Linguagem principal |
| React | Interface |
| WXT | Infraestrutura de desenvolvimento da extensão |
| Manifest V3 | Modelo de extensão |
| Tailwind CSS | Estilização |
| IndexedDB | Persistência local de dados não sensíveis e referências autorizadas |
| Chrome Storage API | Configurações e preferências |
| File System Access API | Acesso autorizado a arquivos e diretórios |
| CodeMirror 6 | Edição estruturada |
| react-markdown | Renderização Markdown |
| remark-gfm | Extensões GFM |
| Vitest | Testes unitários |
| Playwright | Testes de integração e interface |

Bibliotecas específicas de comparação, captura e exportação serão selecionadas mediante provas de conceito.

## 8.2. Organização por módulos

```text
extension-tools/
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
├── tests/
├── docs/
└── public/
```

Essa estrutura é uma proposta inicial e poderá ser simplificada conforme a implementação.

## 8.3. Decisões arquiteturais

### Monólito modular

A extensão será uma única aplicação, organizada em módulos com responsabilidades claras.

Não haverá necessidade inicial de microsserviços ou backend próprio.

### Local-first

Os recursos deverão funcionar localmente sempre que possível.

### Contratos de infraestrutura

Módulos deverão evitar dependência direta das APIs do navegador em suas regras de negócio.

### Componentes compartilhados

Funcionalidades comuns serão centralizadas apenas quando houver reutilização real.

### Persistência controlada

Os dados persistidos deverão ser mínimos, justificáveis e compatíveis com a política de retenção definida para cada ambiente.

### Ausência de processamento externo obrigatório

A utilização das ferramentas principais não dependerá de IA, servidores externos ou autenticação em serviços terceiros.

---

# 9. Segurança, privacidade e isolamento

O ExtensionTools deverá ser desenvolvido como um produto genérico.

Seu código, documentação pública, testes e exemplos não deverão conter dados, arquivos, clientes ou informações internas de qualquer organização.

## 9.1. Uso pessoal

Poderá utilizar:

- Arquivos próprios.
- Rascunhos locais.
- Favoritos.
- Referências públicas.
- Integrações opcionais autorizadas.

## 9.2. Uso profissional

O uso com informações corporativas dependerá de autorização e adequação às políticas da organização.

Uma distribuição profissional poderá exigir configurações e controles diferentes da versão pessoal.

A simples existência de um modo profissional na interface não garante isolamento.

## 9.3. Proteções obrigatórias

- Permissões mínimas.
- Ausência de leitura contínua da área de transferência.
- Ausência de captura automática de páginas.
- Nenhum envio automático de documentos para serviços externos.
- Validação de entradas.
- Tratamento seguro de HTML e Markdown.
- Separação entre dados temporários e persistentes.
- Restrições de acesso a arquivos sensíveis.
- Nenhuma telemetria de conteúdo por padrão.
- Confirmação de operações que modificam arquivos.
- Proteção contra gravações e sobrescritas acidentais.

---

# 10. Roadmap inicial

| Marco | Objetivo | Principais entregáveis |
|---|---|---|
| M0 | Foundation | WXT, Manifest V3, navegação, permissões, armazenamento e testes |
| M1 | Text Workspace | Markdown, XML Inspector e Text Diff |
| M2 | Arquivos e referências | Quick Files e Reference Hub |
| M3 | Captura e exportação | Evidence Capture e PDF Export |
| M4 | Organização de investigações | Investigation Board e integração com diretórios locais |
| M5 | Produtividade | Calendar e Snippet Library |
| M6 | Ferramentas complementares | JSON Inspector e Tab Workspaces |
| M7 | Qualidade e distribuição | Segurança, desempenho, acessibilidade, documentação e publicação |

A ordem poderá ser ajustada conforme resultados das provas de conceito e frequência de uso.

---

# 11. Critérios de sucesso do produto

O sucesso do ExtensionTools não deverá ser medido pela quantidade de ferramentas implementadas.

Os principais indicadores de valor serão:

1. Redução da necessidade de acessar sites externos para tarefas simples.
2. Menor esforço para localizar documentos frequentes.
3. Facilidade para visualizar e comparar conteúdos.
4. Redução de operações repetitivas na organização de arquivos.
5. Preservação de estruturas de diretórios existentes.
6. Facilidade de integração entre ferramentas.
7. Execução local e previsível das operações.
8. Segurança e clareza sobre acesso e persistência de dados.
9. Facilidade para adicionar funcionalidades sem aumentar desnecessariamente o acoplamento.
10. Utilidade real nas atividades cotidianas.

---

# 12. Direção do produto

O **ExtensionTools** será uma suíte modular de produtividade e análise técnica integrada ao navegador.

Seu diferencial não será simplesmente concentrar várias ferramentas em uma interface.

Será permitir que elas trabalhem em conjunto, oferecendo fluxos como:

**Capturar → Visualizar → Comparar → Organizar → Documentar → Exportar**

O produto deverá preservar a autonomia do usuário, respeitar os sistemas e arquivos existentes e evitar complexidade desnecessária.

**Visão de longo prazo:** transformar o navegador em um ambiente mais eficiente para trabalhar com informações, documentos, referências e tarefas recorrentes, sem depender de múltiplos serviços externos para operações cotidianas.
