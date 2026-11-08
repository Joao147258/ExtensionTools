# File System Access API — Contextos do Navegador e Arquitetura de Execução

> **Módulo:** `.harness/skills/file-system-access/references/browser-contexts.md`  
> **Status:** Referência Técnica Normativa  
> **Escopo:** Chromium Manifest V3 / WXT Entrypoints  

---

## 1. Matriz de Disponibilidade de APIs por Contexto de Extensão

Em extensões Chromium operando sob Manifest V3 com WXT, o código executa em diferentes ambientes de execução com capacidades e restrições heterogêneas:

| Contexto / Entrypoint | Disponibilidade de Pickers (`showOpenFilePicker`) | Handles FSA (`FileSystemFileHandle`) | Escrita via Stream (`createWritable`) | OPFS (`navigator.storage.getDirectory()`) | Sync Access Handle (`createSyncAccessHandle`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Side Panel** (`src/entrypoints/sidepanel/`) | ✅ Sim (com User Activation) | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não (Apenas Web Workers) |
| **Extension Pages** (`src/entrypoints/pages/`) | ✅ Sim (com User Activation) | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não (Apenas Web Workers) |
| **Background Service Worker** (`src/entrypoints/background/`) | ❌ **PROIBIDO / INEXISTENTE** | ⚠️ Parcial (sem pickers diretos) | ✅ Sim (se handle já obtido) | ✅ Sim | ❌ Não |
| **Content Scripts** (`src/entrypoints/content/`) | ❌ **PROIBIDO** (Isolamento de Segurança) | ❌ Inseguro / Não Recomendado | ❌ Não | ❌ Isolado por Origem da Página | ❌ Não |
| **Dedicated Web Worker** | ❌ Não (Sem objeto Window) | ✅ Sim (recebido via postMessage) | ✅ Sim | ✅ Sim | ✅ **Sim (Ultra-rápido)** |

---

## 2. Detalhamento por Contexto

### 2.1. Side Panel (`src/entrypoints/sidepanel/`)
- **Natureza**: Janela gráfica persistente acoplada à lateral da aba do usuário. Possui objeto global `window`, DOM e suporte a eventos de ponteiro/teclado.
- **Papel no ExtensionTools**: É o ponto focal de interação do usuário. É aqui que os componentes gráficos acionam os adaptadores em `src/platform/file-system/` para invocar os pickers de arquivo e pasta quando o usuário clica em botões da interface.
- **Regra**: Todo picker nativo disparado pelo produto deve ter origem em uma ação consciente do usuário ocorrida no Side Panel ou nas páginas da extensão.

### 2.2. Background Service Worker (`src/entrypoints/background/`)
- **Natureza**: Script em segundo plano orientado a eventos, sem interface visual, operando em `WorkerGlobalScope`.
- **Restrição Crítica**: O Service Worker não possui `window`. Tentativas de invocar `showOpenFilePicker()`, `showSaveFilePicker()` ou `showDirectoryPicker()` resultarão imediatamente em `ReferenceError` ou `TypeError: window is not defined`.
- **Ciclo de Vida Efêmero**: O Chromium suspende o Service Worker após aproximadamente 30 segundos de inatividade. Por esse motivo:
  - Nunca armazene referências de handles exclusivamente em variáveis em memória no Service Worker.
  - Se o Service Worker precisar processar dados de um arquivo selecionado anteriormente, o handle deve ser recuperado do IndexedDB ou recebido via mensagem.

### 2.3. Content Scripts (`src/entrypoints/content/`)
- **Natureza**: Scripts injetados em páginas web externas visitadas pelo usuário.
- **Restrição Crítica de Segurança**: Content Scripts executam no contexto da página web e compartilham o DOM da página. É estritamente proibido expor handles de arquivos locais do usuário a Content Scripts ou permitir que scripts de terceiros manipulem arquivos locais da máquina do usuário.
- **Fronteira**: O ExtensionTools não realiza operações de File System Access em Content Scripts.

### 2.4. Origin Private File System (OPFS)
- **Natureza**: Sistema de arquivos privado altamente otimizado, isolado e exclusivo para a origem da extensão (`chrome-extension://<id>`).
- **Características**:
  - Obtido via `await navigator.storage.getDirectory()`.
  - Não requer permissões nem exibe diálogos de consentimento ao usuário.
  - Invisível no explorador de arquivos comum do sistema operacional host.
  - Ideal para: caches internos, bancos de dados locais (ex: SQLite Wasm / DuckDB Wasm), logs temporários estruturados e snapshots de documentos em edição rápida (como no Quick Files).
- **Acesso Síncrono em Web Workers**: Dentro de Web Workers dedicados, arquivos no OPFS suportam `createSyncAccessHandle()`, permitindo leituras e escritas diretas síncronas em memória em altíssima velocidade.

### 2.5. Native Messaging
- **Natureza**: Comunicação bidirecional com um executável local no computador do usuário via stdin/stdout, utilizando mensagens codificadas em JSON.
- **Restrições**:
  - Exige a permissão `"nativeMessaging"` no manifesto da extensão.
  - Exige que um manifesto de host nativo seja instalado previamente no sistema de arquivos do sistema operacional (fora do escopo da loja de extensões).
- **Diretriz de Governança**: O ExtensionTools é uma aplicação **Local-First pura no navegador**. A introdução de Native Messaging exige um Architecture Decision Record (ADR) aprovado e não pode ser utilizada como atalho para contornar limitações da File System Access API.

---

## 3. Governança de Transporte em Platform Messaging

> [!CAUTION]
> **REGRA DE OURO DE MENSAGERIA:**  
> Não transportar handles ou pressupor suporte à serialização de objetos complexos em Platform Messaging sem validar o comportamento específico do transporte utilizado.

- Os canais de mensageria da extensão (`chrome.runtime.sendMessage`, `Port.postMessage`) convertem payloads em mensagens estruturadas.
- Nem todos os canais de extensão suportam a passagem transparente de instâncias ativas de `FileSystemHandle` com suas capacidades de autorização preservadas entre processos distintos.
- **Padrão Obrigatório de Integração**:
  - Em vez de tentar enviar instâncias de handles pelo barramento de mensagens (`src/platform/messaging/`), persista o handle no IndexedDB identificado por um UUID único e transmita apenas o identificador lógico tipado (`fileId: string`).
  - O contexto consumidor carrega o handle diretamente do IndexedDB e valida suas permissões de forma determinística e independente.
