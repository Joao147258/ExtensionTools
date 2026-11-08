# File System Access API — Permissões, Segurança e Salvaguardas

> **Módulo:** `.harness/skills/file-system-access/references/permissions-and-security.md`  
> **Status:** Referência Técnica Normativa  
> **Escopo:** Chromium Desktop / Manifest V3 / WXT  

---

## 1. Princípio Fundamental de Permissões

No modelo de segurança do Chromium para a File System Access API:

> **O usuário é o proprietário soberano de seus arquivos locais.**  
> A extensão nunca obtém privilégios globais ou permanentes por omissão. O acesso é concedido individualmente para cada arquivo ou diretório mediante interação consciente do usuário.

---

## 2. User Activation (Gesto Transitivo do Usuário)

- **Definição**: O navegador exige que ações sensíveis ocorram em resposta direta a um evento do usuário (clique, toque ou pressionamento de tecla). Esse estado é conhecido como **Transient User Activation** e expira após poucos segundos.
- **Operações que Exigem User Activation**:
  - `window.showOpenFilePicker()`
  - `window.showSaveFilePicker()`
  - `window.showDirectoryPicker()`
  - `handle.requestPermission({ mode: 'readwrite' })`
- **Operações que NÃO Exigem User Activation**:
  - `handle.queryPermission({ mode })` (verificação puramente passiva de estado)
  - `handle.getFile()` (desde que a permissão `'read'` já esteja concedida)
  - Leitura/escrita no Origin Private File System (OPFS).
- **Implicações Arquiteturais**:
  - Nunca disparar pickers em `useEffect`, `setTimeout`, rotinas de background, cron jobs ou listeners de mensagens assíncronas cujo vínculo com o evento original do mouse tenha sido perdido.
  - Se uma operação em background necessitar de arquivo local, ela deve sinalizar a UI para que o usuário clique em um botão de ação antes de abrir o picker.

---

## 3. Estados de Permissão e Métodos de Verificação

### 3.1. `handle.queryPermission(descriptor)`
- **Assinatura**: `queryPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>`
- **Estados Retornados (`PermissionState`)**:
  - `'granted'`: A permissão está ativa e a operação de I/O pode prosseguir imediatamente.
  - `'prompt'`: A permissão não está ativa, mas pode ser solicitada ao usuário via `requestPermission()`.
  - `'denied'`: O usuário recusou a permissão ou o navegador a bloqueou. O código deve abortar o fluxo e não tentar abrir novas janelas insistentes de solicitação.

### 3.2. `handle.requestPermission(descriptor)`
- **Assinatura**: `requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>`
- **Comportamento**: Exibe um diálogo de confirmação do navegador solicitando permissão explícita.
- **Regras Estritas**:
  - Deve ser precedido por `queryPermission()`. Se o status já for `'granted'`, não invocar `requestPermission()`.
  - Deve ser chamado estritamente dentro do handler de um gesto do usuário. Se chamado sem ativação, a Promise é rejeitada com `SecurityError`.

---

## 4. Persistência de Handles e Permissões no Chromium 122+

A partir do Chromium 122, o suporte a permissões persistentes para a File System Access API foi introduzido via integração com a Permission Manager API e Page Info:

1. **Armazenamento de Handles no IndexedDB**:
   - Handles de arquivo e diretório (`FileSystemHandle`) são serializáveis via algoritmo de Structured Clone e podem ser persistidos diretamente em object stores do IndexedDB.
2. **Reativação de Permissões ao Restaurar**:
   - **Regra Inegociável**: Restaurar um handle do IndexedDB **NÃO garante** que a permissão continue ativa.
   - Ao carregar um handle persistido:
     ```typescript
     const permission = await handle.queryPermission({ mode: 'readwrite' });
     if (permission === 'prompt') {
       // Requer ação do usuário para invocar requestPermission()
       promptUserToReauthorize(handle);
     } else if (permission === 'denied') {
       // Acesso revogado pelo usuário nas configurações do navegador
       handleRevokedPermission(handle);
     }
     ```
3. **Revogação pelo Usuário**: O usuário pode revogar permissões a qualquer momento através do painel de informações do site/extensão no navegador (`Page Info` / `chrome://settings/content/filesystem`). O código deve estar preparado para receber `NotAllowedError` mesmo após ter recebido permissão no início da sessão.

---

## 5. Salvaguardas Contra Sobrescrita Silenciosa de Dados

1. **Política de Escrita Segura**:
   - A criação de stream via `handle.createWritable()` utiliza por padrão um arquivo de swap temporário (`.crswap`). Se o processo da extensão cair no meio da escrita, o arquivo original do usuário não é corrompido.
   - Quando o arquivo já existir e uma nova gravação for solicitada, o componente deve verificar explicitamente:
     1. Se a intenção é substituição completa ou atualização incremental (`keepExistingData: true`).
     2. Se o usuário confirmou a substituição caso haja colisão de nomes em diretório.
2. **Tratamento Seguro de Stream**:
   ```typescript
   const writable = await fileHandle.createWritable();
   try {
     await writable.write(chunk);
     await writable.close(); // Fecha e renomeia .crswap para o nome final atomicamente
   } catch (err) {
     await writable.abort(); // Descarta o swap temporário
     throw err;
   }
   ```

---

## 6. Salvaguardas em Exclusão e Exclusão Recursiva

1. **Exclusão de Arquivos Unitários**:
   - `directoryHandle.removeEntry(filename)` remove o arquivo especificado.
2. **Exclusão de Pastas com `recursive: true`**:
   - **Risco Severo**: A exclusão recursiva apaga irreversivelmente todos os arquivos e subdiretórios contidos na pasta selecionada sem mover para a lixeira do sistema operacional na maioria dos ambientes.
   - **Salvaguarda Arquitetural Obrigatória**:
     - Nenhuma chamada a `removeEntry(name, { recursive: true })` pode ser executada sem dupla confirmação gráfica do usuário.
     - O diálogo de confirmação deve exibir o nome da pasta e a quantidade aproximada de arquivos afetados quando determinável.
     - Logs da extensão devem registrar a operação de exclusão de forma sanitizada (sem caminhos absolutos do host).

---

## 7. Isolamento e Não Vazamento de Informações Sensíveis

- **Proibição de Caminhos Absolutos**: A File System Access API não fornece caminhos absolutos do sistema de arquivos por design de segurança. Os objetos `FileSystemHandle.name` expõem apenas o nome do arquivo ou da pasta relativa.
- **Sanitização de Logs**: É proibido concatenar o conteúdo de arquivos lidos ou dados confidenciais do usuário em mensagens de erro enviadas ao console do navegador ou a serviços de telemetria.
