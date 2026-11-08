---
name: file-system-access
description: >-
  Use esta skill para orientar a especificação, implementação, fiscalização e verificação de
  operações com arquivos e diretórios locais via File System Access API e OPFS no ExtensionTools.
---

# File System Access — Procedimento Operacional Canônico

## 1. Identificação e Metadados Canônicos
- **Identificador Canônico**: `file-system-access`
- **Escopo**: Harness ExtensionTools (`.harness/skills/file-system-access/`)
- **Papel Arquitetural**: Governança técnica, integração e verificação de acesso ao sistema de arquivos local sob Manifest V3.
- **Agentes Consumidores Primários**: `file-system-engineer`, `developer`, `architect`, `security-auditor`
- **Nível de Criticidade de Governança**: Crítica (I/O Local, Segurança de Dados do Usuário)
- **Versão da Skill**: 1.0.0

## 2. Propósito e Problema Resolvido
- **Problema de Engenharia**: Acesso inseguro, desestruturado ou disperso a arquivos locais em extensões de navegador; vazamento de chamadas nativas de pickers para componentes visuais React; suposição errônea de que handles persistidos no IndexedDB conferem permissão automática permanente; chamadas a APIs de Window dentro do Service Worker resultando em falhas em tempo de execução; e risco de perda de dados por sobrescrita ou exclusão destrutiva sem salvaguardas.
- **Objetivo da Operação**: Fornecer um procedimento padronizado, seguro e reproduzível para manipulação de arquivos e diretórios, garantindo isolamento em `src/platform/file-system/`, respeito irrestrito ao modelo de permissões do Chromium, tratamento determinístico de `DOMException` e cobertura rigorosa de testes unitários e de integração com mocks.

## 3. Escopo e Fronteiras de Atuação
- **O que esta skill FAZ**:
  - Orienta a implementação de adaptadores e contratos em `src/platform/file-system/`.
  - Guia a seleção de arquivos e pastas (`showOpenFilePicker`, `showSaveFilePicker`, `showDirectoryPicker`).
  - Estabelece fluxos seguros de leitura, escrita atômica via streams e enumeração assíncrona de diretórios.
  - Define o ciclo de vida de permissões (`queryPermission`, `requestPermission`, checagem de revogação).
  - Modela o uso do Origin Private File System (OPFS) para armazenamento privado e de alta performance.
  - Regula a persistência e restauração segura de handles no IndexedDB.
  - Especifica suítes de testes automatizados com mocks de handles de arquivos e diretórios.
- **O que esta skill NÃO FAZ (Fronteiras Estritas)**:
  - Não autoriza a invocação de APIs de File System diretamente em componentes React (`src/features/` ou `src/entrypoints/`).
  - Não executa exclusões recursivas sem dupla barreira de validação e confirmação explícita.
  - Não implementa Native Messaging sem ADR arquitetural formalmente homologado.
  - Não substitui auditorias globais de segurança (`security-audit`) nem validação final de release (`release-validation`).

## 4. Condições de Ativação e Não Ativação
### 4.1. Gatilhos de Ativação (Quando Usar)
- Ao projetar ou implementar qualquer capacidade de leitura, gravação, exportação ou inspeção de arquivos locais do usuário.
- Ao construir o adaptador de plataforma em `src/platform/file-system/`.
- Ao integrar features como Markdown Workspace, Quick Files, Evidence Capture, Text Diff ou PDF Export com arquivos do disco.
- Ao implementar persistência de handles de diretórios ou arquivos recentes via IndexedDB.
- Ao auditar o cumprimento das restrições da File System Access API nos quality gates.
### 4.2. Gatilhos Negativos (Quando NÃO Usar / Exclusões)
- Manipulação exclusiva de estado transitório em memória (usar hooks ou store local).
- Persistência simples de configurações de usuário em chave-valor (usar `src/platform/persistence/` via Chrome Storage).
- Revisão de código sem escopo de arquivos locais ➔ Encaminhar para `code-review`.

## 5. Pré-requisitos Técnicos Mandatórios
1. Ambiente WXT configurado com TypeScript em modo estrito.
2. Navegador Chromium com suporte à File System Access API (Desktop).
3. Documento canônico de arquitetura (`ARCHITECTURE.md`) e diretrizes de plataforma conhecidos.
4. Conhecimento das restrições de ciclo de vida do Service Worker no Manifest V3.

## 6. Fontes de Verdade e Referências Normativas
- **WICG File System Access Specification**: `https://wicg.github.io/file-system-access/` (Draft Report).
- **Chrome Developers — File System Access API**: `https://developer.chrome.com/docs/capabilities/web-apis/file-system-access` (Visão geral de capacidades e pickers).
- **Chrome Developers — Persistent Permissions for FSA API**: `https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api` (Chromium 122+).
- **MDN Web Docs — File System API**: `https://developer.mozilla.org/en-US/docs/Web/API/File_System_API`.
- **MDN Web Docs — Window.showDirectoryPicker()**: `https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker`.
- **Chrome Developers — Native Messaging**: `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging`.
- **WXT Documentation — Entrypoints & Manifest**: `https://wxt.dev/guide/essentials/entrypoints` e `https://wxt.dev/guide/essentials/config/manifest`.
- Documentos internos de referência:
  - `.harness/skills/file-system-access/references/api-capabilities.md`
  - `.harness/skills/file-system-access/references/permissions-and-security.md`
  - `.harness/skills/file-system-access/references/browser-contexts.md`
  - `.harness/skills/file-system-access/references/testing-strategy.md`

## 7. Contrato de Entrada (Input Contract)
- **Entradas Obrigatórias**:
  - Tipo de operação requerida (leitura, escrita, criação, exclusão, seleção, listagem).
  - Contexto de execução de destino (Side Panel, Background, Worker).
  - Contrato de dados a manipular (tipo MIME, extensões permitidas, payload).
- **Contexto Opcional Permitido**:
  - Handle prévio persistido no IndexedDB para restauração de sessão.
- **Permissões Necessárias**:
  - User Activation (gesto transitivo do usuário) para operações que abrem pickers ou elevam privilégios para escrita.

## 8. Contrato de Saída e Entregáveis (Output Contract)
- **Artefatos Produzidos**:
  - Adaptadores tipados em `src/platform/file-system/`.
  - Contratos TypeScript de entrada e saída isolados de detalhes do navegador.
  - Mocks para testes unitários com fidelidade comportamental.
  - Testes automatizados cobrindo fluxos de sucesso e exceções (`DOMException`).
  - Relatório de conformidade com os scripts de governança em `scripts/filesystem/`.
- **Estados Operacionais Possíveis**:
  - `APROVADO`: Implementação isolada, segura, tipada e com testes passing.
  - `BLOQUEADO`: Violação de fronteira modular, ausência de tratamento de erro ou risco de perda de dados.

## 9. Procedimento Operacional Passo a Passo

### Passo 1 — Classificação da Operação
Classificar categoricamente a demanda em uma das três categorias arquiteturais:
- **Categoria A (Arquivos Reais Autorizados pelo Usuário)**: Operações em que o usuário escolhe arquivos ou diretórios específicos do seu computador via pickers (`showOpenFilePicker`, `showSaveFilePicker`, `showDirectoryPicker`). Exige diálogo explícito, user activation e concessão de permissão.
- **Categoria B (Armazenamento Privado da Origem — OPFS)**: Armazenamento em sandbox privado da extensão (`navigator.storage.getDirectory()`). Não acessível externamente pelo usuário no explorador de arquivos comum; ideal para caches, índices e bancos de dados locais sem necessidade de diálogo de permissão.
- **Categoria C (Recursos Nativos do Sistema Operacional — Native Messaging)**: Comunicação com aplicação binária externa instalada no sistema operacional host. Exige manifesto de host nativo e aprovação prévia via Architecture Decision Record (ADR). Proibido usar como substituto indiscriminado da File System Access API.

### Passo 2 — Contexto de Execução
Identificar o runtime onde a operação será acionada:
- **Side Panel (`src/entrypoints/sidepanel/`)**: Contexto Window com interface gráfica. Pickers são permitidos, desde que desencadeados por eventos de clique ou interação do usuário.
- **Background Service Worker (`src/entrypoints/background/`)**: Contexto WorkerGlobalScope sem DOM/Window. **É proibido invocar pickers nativos neste contexto.** Caso o background precise de dados de arquivos, a requisição deve ser delegada ao contexto gráfico com usuário ativo ou utilizar OPFS.
- **Content Scripts**: Contexto de página isolada. Não deve gerenciar handles do sistema de arquivos diretamente nem expor o sistema local a páginas web visitadas.

### Passo 3 — Permissões e Ciclo de Vida
1. Verificar se a operação exige gesto de ativação do usuário (**User Activation**). Abertura de pickers e chamada a `requestPermission({ mode: 'readwrite' })` falharão com `SecurityError` ou `NotAllowedError` se disparadas fora de eventos de clique.
2. Para handles existentes ou restaurados do IndexedDB:
   - Invocar previamente `handle.queryPermission({ mode })`.
   - Se o status for `'prompt'`, aguardar novo gesto do usuário para chamar `handle.requestPermission({ mode })`.
   - Se o status for `'denied'`, interromper a operação e notificar a interface com mensagem amigável sem tentar forçar nova chamada.
3. Não tratar a simples existência do handle persistido como sinônimo de autorização vigente.

### Passo 4 — Contratos Tipados
1. Definir interfaces TypeScript puras em `src/platform/file-system/contracts/` ou `types.ts`.
2. Encapsular handles nativos em descritores ou portas limpas (ex: `FileDescriptor`, `DirectoryDescriptor`, `IFileSystemAdapter`).
3. Modelar tipos de erros de domínio mapeando as `DOMException` nativas (`FileNotFoundError`, `FilePermissionDeniedError`, `FileOperationAbortedError`).
4. Proibir que tipos de infraestrutura ou React vazem para a camada de contratos do domínio.

### Passo 5 — Implementação Modular
1. Implementar o adaptador concreto em `src/platform/file-system/`.
2. Para escritas, utilizar sempre escrita atômica via `createWritable()`:
   ```typescript
   const writable = await fileHandle.createWritable();
   try {
     await writable.write(data);
     await writable.close();
   } catch (error) {
     await writable.abort();
     throw error;
   }
   ```
3. Para exclusões, aplicar barreira explícita: se `recursive: true` for necessário, exigir confirmação explícita de usuário e registrar aviso em log sanitizado.
4. Proibir componentes React de fazer chamadas diretas a `window.showDirectoryPicker` ou `handle.createWritable`.

### Passo 6 — Testes Automatizados
1. Implementar testes unitários para a camada de plataforma utilizando mocks estritos de `FileSystemHandle`, `FileSystemFileHandle` e `FileSystemDirectoryHandle`.
2. Garantir testes para cenários positivos (leitura bem-sucedida, escrita atômica, listagem de pastas).
3. Garantir testes negativos obrigatórios:
   - Cancelamento pelo usuário (`AbortError`).
   - Negação de permissão (`NotAllowedError`).
   - Arquivo apagado externamente (`NotFoundError`).
   - Conflito de tipo (`TypeMismatchError`).
   - Tentativa de escrita em handle somente-leitura.

### Passo 7 — Revisão de Governança
1. Executar os validadores especializados:
   - `node scripts/filesystem/verify-boundaries.mjs`
   - `node scripts/filesystem/verify-security.mjs`
   - `node scripts/filesystem/verify-contracts.mjs`
   - `node scripts/filesystem/verify-tests.mjs`
2. Conferir conformidade no linter arquitetural: `pnpm run lint:arch`.
3. Validar ausência de caminhos privados locais: `pnpm run security:paths`.

### Passo 8 — Evidências e Fechamento
1. Documentar:
   - Contratos definidos e adaptadores criados.
   - Cenários de teste executados e respectivos resultados.
   - Limitações da versão do Chromium ou do ambiente.
   - Pendências eventuais de validação manual no navegador.

## 10. Ferramentas, Comandos e Integrações Permitidas
| Ferramenta / Comando | Finalidade na Skill | Modo de Uso | Evidência Exigida |
| :--- | :--- | :--- | :--- |
| `node scripts/filesystem/run-verify.mjs` | Executar bateria completa de fiscalização de File System | Execução CLI | Exit code 0, relatório limpo |
| `node scripts/architecture/boundary-linter.mjs` | Auditar limites modulares entre UI e Platform | Execução CLI | Exit code 0, zero violações ARC-R01 a R08 |
| `pnpm run test:unit` | Executar testes unitários com mocks de handles | Execução CLI | 100% de aprovação no Vitest |
| `pnpm run compile` | Validação estrita de tipos TypeScript | Execução CLI | Exit code 0 |

## 11. Limitações do Runtime e Princípios de Isolamento
- Service Workers no Manifest V3 encerram após 30 segundos de inatividade; nunca manter handles exclusivamente na memória volátil do background sem estratégia de persistência via IndexedDB.
- `FileSystemHandle.move()` é experimental e não possui suporte garantido em todos os ambientes; substituições devem utilizar cópia atômica e remoção segura do arquivo de origem.
- Mocks em Node.js/Vitest não reproduzem bloqueios de arquivo nativos do sistema operacional (file locks); testes E2E reais no navegador são mandatados antes da homologação final.

## 12. Matriz de Tratamento de Erros e Exceções
| Exceção Nativa | Causa Provável | Ação do Adaptador de Plataforma | Erro Mapeado no Domínio |
| :--- | :--- | :--- | :--- |
| `DOMException: AbortError` | Usuário cancelou ou fechou o diálogo de seleção | Retornar cancelamento gracioso (sem crash) | `FileOperationCancelled` |
| `DOMException: NotAllowedError` | Usuário negou permissão ou faltou User Activation | Interromper operação, atualizar estado de autorização | `FilePermissionDeniedError` |
| `DOMException: NotFoundError` | Arquivo renomeado ou excluído externamente no SO | Limpar referência inválida e notificar UI | `FileNotFoundError` |
| `DOMException: TypeMismatchError` | Tentou abrir pasta como arquivo ou vice-versa | Validar tipo de entrada antes de solicitar handle | `FileTypeMismatchError` |
| `DOMException: QuotaExceededError` | Disco cheio ou cota de OPFS esgotada | Abortar stream de escrita e alertar usuário | `StorageQuotaExceededError` |

## 13. Política de Evidências e Anti-Alucinação
- Classificação estrita em relatórios técnicos: `[CONFIRMADO]`, `[HIPÓTESE]`, `[PROPOSTA]`, `[PENDENTE]`, `[BLOQUEADO]`.
- Nenhuma operação de gravação ou exclusão pode ser dada como aprovada sem a apresentação dos testes correspondentes.
- É expressamente proibido declarar compatibilidade com métodos experimentais da API sem teste real comprovado no Chromium.

## 14. Modelagem de Ameaças e Segurança da Operação
- **Superfície de Risco 1: Sobrescrita Silenciosa de Dados**: Perda irreversível de documentos do usuário ao salvar arquivos. Mitigação: verificação obrigatória de colisão de nomes e uso de escrita atômica via swap files (`.crswap`).
- **Superfície de Risco 2: Exclusão Recursiva Acidental**: Exclusão em lote de pastas do usuário. Mitigação: proibição de flags recursivas tácitas; exigência de confirmação em duas etapas na interface.
- **Superfície de Risco 3: Vazamento de Dados em Logs**: Gravação de conteúdo sensível em `console.log`. Mitigação: auditoria pelo script `verify-security.mjs` e logger sanitizado.

## 15. Critérios de Aceitação da Execução da Skill
- [ ] Todas as chamadas nativas à File System Access API confinadas estritamente em `src/platform/file-system/`.
- [ ] Nenhum componente React invocando pickers globais ou manipulando streams de escrita diretamente.
- [ ] Nenhuma chamada a `showOpenFilePicker`, `showSaveFilePicker` ou `showDirectoryPicker` presente no Background Service Worker.
- [ ] Tratamento explícito das principais `DOMException` nativas (`AbortError`, `NotAllowedError`, `NotFoundError`).
- [ ] Bateria de verificações de `scripts/filesystem/run-verify.mjs` aprovada com exit code 0.
- [ ] Testes unitários com mocks de handles implementados e 100% aprovados.

## 16. Cenários de Validação Comportamental Vinculados
- **SC-FS-01**: Usuário seleciona arquivo com sucesso; leitura executada e dados entregues à feature.
- **SC-FS-02**: Usuário cancela diálogo de seleção; operação encerra silenciosamente com status de cancelamento.
- **SC-FS-03**: Permissão negada pelo usuário; sistema exibe aviso amigável sem quebrar a interface.
- **SC-FS-04**: Handle recuperado do IndexedDB com permissão revogada; sistema dispara novo pedido mediante gesto do usuário.
- **SC-FS-05**: Escrita interrompida no meio do fluxo; arquivo temporário `.crswap` é abortado e arquivo original permanece intacto.

## 17. Regras de Manutenção e Evolução
- Alterações em contratos de plataforma devem preservar retrocompatibilidade ou ser acompanhadas de migração versionada.
- A inclusão de novas APIs da especificação WICG deve ser precedida de atualização dos documentos de referência e dos validadores.

## 18. Rastreabilidade com Tarefas do Roadmap
- Módulo afetado: `src/platform/file-system/`
- Capacidade associada: M3 Platform Foundation (preparação de infraestrutura) e suporte às features M4+ (Markdown Workspace, Quick Files, Evidence Capture).
