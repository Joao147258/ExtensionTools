# File System Access API — Matriz de Capacidades da API

> **Módulo:** `.harness/skills/file-system-access/references/api-capabilities.md`  
> **Status:** Referência Técnica Normativa  
> **Escopo:** Chromium Desktop / Manifest V3 / WXT  

---

## 1. Visão Geral das Capacidades

A File System Access API (padronizada pelo WICG) permite que aplicações web e extensões de navegador leiam ou salvem alterações diretamente em arquivos e diretórios selecionados pelo usuário no dispositivo local.

No ambiente de extensão (Manifest V3), a API opera mediante obtenção de referências opacas (`FileSystemHandle`), isolando o código de caminhos absolutos do sistema operacional e aplicando verificações de segurança em tempo de execução.

---

## 2. Métodos de Seleção (Pickers Globais em Window)

### 2.1. `window.showOpenFilePicker(options?)`
- **Finalidade**: Exibir diálogo nativo do sistema operacional para o usuário selecionar um ou mais arquivos existentes para leitura (e opcionalmente escrita posterior).
- **Contexto Compatível**: Contextos com objeto `window` (Side Panel, Extension Full Pages, Popups). **Incompatível com Background Service Workers.**
- **Requisitos de Autorização**: Exige **User Activation** (gesto transitivo do usuário, como `click`). Lança `SecurityError` se chamado sem interação recente.
- **Opções Relevantes**:
  - `multiple`: Booleano (padrão `false`). Permite seleção múltipla.
  - `excludeAcceptAllOption`: Booleano. Força restrição aos filtros definidos.
  - `types`: Array de `{ description: string, accept: Record<string, string[]> }` com tipos MIME e extensões.
- **Comportamento**: Retorna uma `Promise<FileSystemFileHandle[]>`. Se o usuário fechar ou cancelar o diálogo, a Promise é rejeitada.
- **Exceções (`DOMException`)**:
  - `AbortError`: Usuário cancelou ou fechou a janela do picker.
  - `SecurityError`: Falta de ativação do usuário (User Activation) ou contexto não seguro.
  - `TypeError`: Opções malformadas ou tipos MIME inválidos.
- **Limitações**: Não suporta caminhos pré-definidos arbitrários do sistema de arquivos; apenas sugestões de `id` ou `startIn` com diretórios padrão conhecidos (`'documents'`, `'desktop'`, `'downloads'`).
- **Fonte Oficial**: WICG File System Access API (§ 5.1 `showOpenFilePicker`), Chrome Developers FSA Guide.

---

### 2.2. `window.showSaveFilePicker(options?)`
- **Finalidade**: Exibir diálogo nativo para salvar um arquivo, permitindo ao usuário definir o nome, extensão e localização no disco.
- **Contexto Compatível**: Contextos com `window` (Side Panel, Páginas completas). Incompatível com Background Service Worker.
- **Requisitos de Autorização**: Exige User Activation. O handle resultante já nasce com permissão implícita de escrita para a sessão atual.
- **Opções Relevantes**:
  - `suggestedName`: String com sugestão inicial de nome de arquivo.
  - `types`: Filtros de tipo MIME e extensão autorizados.
  - `excludeAcceptAllOption`: Força adesão estrita ao tipo sugerido.
- **Comportamento**: Retorna uma `Promise<FileSystemFileHandle>`. Cria o arquivo no disco (se não existir) ou obtém referência para substituição.
- **Exceções (`DOMException`)**:
  - `AbortError`: Usuário cancelou o diálogo de salvamento.
  - `SecurityError`: Falta de gesto ativo do usuário.
- **Limitações**: Se o usuário selecionar um arquivo já existente, o diálogo nativo do sistema operacional costuma exibir prompt de confirmação de substituição.
- **Fonte Oficial**: WICG FSA Specification (§ 5.2 `showSaveFilePicker`), Chrome Docs.

---

### 2.3. `window.showDirectoryPicker(options?)`
- **Finalidade**: Exibir diálogo nativo para seleção de um diretório completo, concedendo acesso hierárquico às suas entradas filhas.
- **Contexto Compatível**: Contextos com `window` (Side Panel). Incompatível com Background Service Worker.
- **Requisitos de Autorização**: Exige User Activation. Permite especificar `mode: 'read'` (padrão) ou `mode: 'readwrite'`.
- **Opções Relevantes**:
  - `id`: Identificador para lembrar a última pasta aberta.
  - `mode`: `'read' | 'readwrite'`.
  - `startIn`: Diretório de inicialização sugerido.
- **Comportamento**: Retorna uma `Promise<FileSystemDirectoryHandle>`. O acesso a subpastas e arquivos descendentes herda o escopo concedido.
- **Exceções (`DOMException`)**:
  - `AbortError`: Usuário cancelou a seleção.
  - `SecurityError`: Diretório restrito selecionado (ex: diretório de sistema como `/Windows`, `/System32`, `/etc`, ou pastas de perfis de navegadores). O Chromium bloqueia pastas sensíveis automaticamente.
- **Limitações**: Selecionar diretórios muito grandes pode gerar consumo alto de memória se o aplicativo tentar carregar recursivamente todas as entradas de uma só vez.
- **Fonte Oficial**: MDN `Window.showDirectoryPicker()`, WICG FSA Specification (§ 5.3).

---

## 3. Métodos de `FileSystemFileHandle`

### 3.1. `getFile()`
- **Finalidade**: Obter uma instância imutável do objeto `File` do navegador, representando o estado atual do arquivo no disco.
- **Contexto Compatível**: Window, Workers e contextos com handle válido.
- **Requisitos de Autorização**: Permissão `'read'` concedida no handle.
- **Comportamento**: Retorna uma `Promise<File>`. O objeto `File` permite ler conteúdo como texto (`text()`), ArrayBuffer (`arrayBuffer()`) ou stream (`stream()`).
- **Exceções (`DOMException`)**:
  - `NotAllowedError`: Permissão `'read'` negada ou revogada.
  - `NotFoundError`: Arquivo foi movido, renomeado ou excluído externamente após a obtenção do handle.
- **Limitações**: O `File` retornado é um snapshot em memória no momento da chamada; modificações externas posteriores não atualizam o objeto `File` já instanciado.
- **Fonte Oficial**: WICG FSA (§ 4.2 `getFile`).

---

### 3.2. `createWritable(options?)`
- **Finalidade**: Criar um fluxo de gravação atômica (`FileSystemWritableFileStream`) para alterar o conteúdo do arquivo.
- **Contexto Compatível**: Contextos com handle válido e permissão de escrita.
- **Requisitos de Autorização**: Permissão `'readwrite'` concedida no handle.
- **Opções Relevantes**:
  - `keepExistingData`: Booleano (padrão `false`). Se `false`, o arquivo é truncado para tamanho 0 ao iniciar; se `true`, copia os dados existentes para o arquivo temporário de swap.
- **Comportamento**: Retorna uma `Promise<FileSystemWritableFileStream>`. O Chromium escreve as alterações em um arquivo temporário de swap (geralmente com sufixo `.crswap`). As alterações só são aplicadas atomicamente ao arquivo original quando o método `close()` for resolvido com sucesso.
- **Exceções (`DOMException`)**:
  - `NotAllowedError`: Permissão `'readwrite'` não concedida.
  - `NotFoundError`: Arquivo alvo não existe mais no disco.
  - `NoModificationAllowedError`: Arquivo bloqueado por outro processo do sistema operacional.
  - `QuotaExceededError`: Sem espaço em disco para criar o arquivo temporário.
- **Limitações**: Requer sempre bloco `try/catch/finally` para invocar `abort()` caso ocorra erro durante o streaming, impedindo que arquivos `.crswap` fiquem órfãos.
- **Fonte Oficial**: WICG FSA (§ 4.2 `createWritable`), Chrome Developers FSA Guide.

---

## 4. Métodos de `FileSystemDirectoryHandle`

### 4.1. `getFileHandle(name, options?)`
- **Finalidade**: Obter o handle de um arquivo contido diretamente dentro deste diretório.
- **Opções**: `{ create?: boolean }`. Se `true`, cria o arquivo se ele não existir.
- **Exceções**:
  - `NotFoundError`: Arquivo não existe e `create` é `false`.
  - `TypeMismatchError`: A entrada existente com esse nome é um diretório, não um arquivo.
  - `NotAllowedError`: Permissão insuficiente (ex: `create: true` exige `'readwrite'`).

---

### 4.2. `getDirectoryHandle(name, options?)`
- **Finalidade**: Obter o handle de um subdiretório dentro deste diretório.
- **Opções**: `{ create?: boolean }`. Se `true`, cria a pasta se não existir.
- **Exceções**:
  - `NotFoundError`: Subdiretório não existe e `create` é `false`.
  - `TypeMismatchError`: Entrada existente com esse nome é um arquivo, não pasta.
  - `NotAllowedError`: Permissão insuficiente.

---

### 4.3. `removeEntry(name, options?)`
- **Finalidade**: Excluir um arquivo ou subdiretório contido neste diretório.
- **Opções**: `{ recursive?: boolean }` (padrão `false`).
- **Comportamento**: Remove o arquivo ou pasta. Se o alvo for um diretório contendo arquivos e `recursive` for `false`, lança `InvalidModificationError`.
- **Exceções**:
  - `NotFoundError`: Entrada com o nome informado não foi encontrada.
  - `InvalidModificationError`: Tentativa de remover diretório não vazio com `recursive: false`.
  - `NotAllowedError`: Permissão de escrita negada.
- **Salvaguardas Mandatórias**: O uso de `recursive: true` exige confirmação prévia em duas etapas e logs de auditoria sanitizados.

---

### 4.4. `resolve(possibleDescendant)`
- **Finalidade**: Obter o caminho relativo (array de strings) desde este diretório raiz até um handle descendente.
- **Retorno**: `Promise<string[] | null>`. Retorna `null` se o handle não for descendente deste diretório.
- **Uso**: Excelente para construir breadcrumbs, identificar árvores de arquivos e evitar suposições sobre caminhos absolutos do sistema operacional.

---

### 4.5. `entries()`, `keys()`, `values()`
- **Finalidade**: Iteradores assíncronos para percorrer todas as entradas do diretório.
- **Uso Padrão**:
  ```typescript
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === 'file') {
      // processa arquivo
    } else if (handle.kind === 'directory') {
      // processa subdiretório
    }
  }
  ```

---

## 5. Método Experimental: `FileSystemHandle.move()`

- **Finalidade**: Renomear ou mover um arquivo/diretório para outro local ou novo nome.
- **Status Normativo**: **Experimental / Suporte Não Homogêneo**.
- **Comportamento Documentado**: Aceita novo nome de arquivo ou um novo diretório pai com nome opcional.
- **Limitações Comprovadas**:
  - Não possui suporte universal em todas as plataformas Chromium.
  - Falha com `InvalidModificationError` ao tentar mover entre sistemas de arquivos diferentes ou partições distintas.
  - Pode não suportar movimentação de diretórios inteiros em determinadas versões.
- **Diretriz do ExtensionTools**: **Não depender exclusivamente de `move()`**. Para operações de renomeação ou movimentação, o adaptador de plataforma deve tentar `move()` e ter fallback automático comprovado de cópia atômica (`read` -> `write` no destino) seguida de remoção (`removeEntry`) da origem após confirmação de integridade.
