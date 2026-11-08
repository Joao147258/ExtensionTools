# File System Access API — Estratégia de Testes e Mocks

> **Módulo:** `.harness/skills/file-system-access/references/testing-strategy.md`  
> **Status:** Referência Técnica Normativa  
> **Escopo:** Vitest / Playwright / ExtensionTools Harness  

---

## 1. Princípios da Estratégia de Testes

A manipulação de arquivos locais envolve interações com recursos do sistema operacional hospedeiro. Para garantir confiabilidade absoluta sem colocar em risco arquivos do desenvolvedor ou do usuário:

1. **Testes Unitários Rápidos e Determinísticos**: Toda lógica de aplicação, contratos e adaptadores deve ser testável em ambiente Node.js / Vitest utilizando mocks fiéis às especificações da WICG.
2. **Isolamento Total do Disco Real**: Testes automatizados executados na máquina de desenvolvimento ou no CI nunca devem ler, alterar ou apagar arquivos reais do sistema de arquivos host fora de diretórios temporários efêmeros criados especificamente para o teste (`fs.mkdtempSync`).
3. **Fidelidade Comportamental de Mocks**: Mocks não devem ser meros objetos com funções vazias (`vi.fn()`); devem simular a máquina de estados de permissões, os streams de escrita e as exceções canônicas (`DOMException`).
4. **Testes E2E Reais no Chromium**: Validação em navegador real através de Playwright para comprovar que o navegador real responde aos eventos de pickers e permissões de forma esperada.

---

## 2. Modelagem Canônica de Mocks de Handles

### 2.1. `MockFileSystemHandle`
Representa a base comum para arquivos e diretórios:
```typescript
export class MockFileSystemHandle {
  public kind: 'file' | 'directory';
  public name: string;
  protected permissionState: PermissionState = 'granted';

  constructor(name: string, kind: 'file' | 'directory') {
    this.name = name;
    this.kind = kind;
  }

  async isSameEntry(other: MockFileSystemHandle): Promise<boolean> {
    return this.name === other.name && this.kind === other.kind;
  }

  async queryPermission(descriptor: { mode?: 'read' | 'readwrite' } = {}): Promise<PermissionState> {
    return this.permissionState;
  }

  async requestPermission(descriptor: { mode?: 'read' | 'readwrite' } = {}): Promise<PermissionState> {
    return this.permissionState;
  }

  setMockPermission(state: PermissionState): void {
    this.permissionState = state;
  }
}
```

### 2.2. `MockFileSystemFileHandle`
Simula um handle de arquivo com leitura e escrita atômica via stream:
```typescript
export class MockFileSystemFileHandle extends MockFileSystemHandle {
  private content: Uint8Array = new Uint8Array();
  private lastModified: number = Date.now();

  constructor(name: string, initialContent: string | Uint8Array = '') {
    super(name, 'file');
    this.setContent(initialContent);
  }

  setContent(data: string | Uint8Array): void {
    if (typeof data === 'string') {
      this.content = new TextEncoder().encode(data);
    } else {
      this.content = data;
    }
    this.lastModified = Date.now();
  }

  async getFile(): Promise<File> {
    if (this.permissionState === 'denied') {
      throw new DOMException('The request is not allowed by the user agent.', 'NotAllowedError');
    }
    return new File([this.content], this.name, { lastModified: this.lastModified });
  }

  async createWritable(options?: { keepExistingData?: boolean }): Promise<MockFileSystemWritableFileStream> {
    if (this.permissionState !== 'granted') {
      throw new DOMException('Permission was not granted to write to this file.', 'NotAllowedError');
    }
    return new MockFileSystemWritableFileStream(this, options?.keepExistingData ?? false);
  }
}
```

### 2.3. `MockFileSystemWritableFileStream`
Simula o arquivo temporário `.crswap` que só persiste os dados ao invocar `close()`:
```typescript
export class MockFileSystemWritableFileStream {
  private buffer: number[] = [];
  private closed = false;
  private aborted = false;

  constructor(private targetHandle: MockFileSystemFileHandle, keepExistingData: boolean) {
    if (keepExistingData) {
      // copia buffer existente se keepExistingData = true
    }
  }

  async write(data: string | Uint8Array | ArrayBuffer): Promise<void> {
    if (this.closed || this.aborted) {
      throw new DOMException('Stream is closed or aborted', 'InvalidStateError');
    }
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
    this.buffer.push(...bytes);
  }

  async close(): Promise<void> {
    if (this.closed || this.aborted) return;
    this.closed = true;
    this.targetHandle.setContent(new Uint8Array(this.buffer));
  }

  async abort(): Promise<void> {
    this.aborted = true;
    this.buffer = [];
  }
}
```

### 2.4. `MockFileSystemDirectoryHandle`
Simula estrutura de diretório em memória com subpastas e arquivos:
```typescript
export class MockFileSystemDirectoryHandle extends MockFileSystemHandle {
  private entriesMap = new Map<string, MockFileSystemHandle>();

  constructor(name: string) {
    super(name, 'directory');
  }

  async *entries(): AsyncIterableIterator<[string, MockFileSystemHandle]> {
    for (const entry of this.entriesMap.entries()) {
      yield entry;
    }
  }

  async *values(): AsyncIterableIterator<MockFileSystemHandle> {
    for (const val of this.entriesMap.values()) {
      yield val;
    }
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<MockFileSystemFileHandle> {
    const existing = this.entriesMap.get(name);
    if (existing) {
      if (existing.kind !== 'file') {
        throw new DOMException(`Entry ${name} is a directory`, 'TypeMismatchError');
      }
      return existing as MockFileSystemFileHandle;
    }
    if (options?.create) {
      const newFile = new MockFileSystemFileHandle(name);
      this.entriesMap.set(name, newFile);
      return newFile;
    }
    throw new DOMException(`File ${name} not found`, 'NotFoundError');
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<MockFileSystemDirectoryHandle> {
    const existing = this.entriesMap.get(name);
    if (existing) {
      if (existing.kind !== 'directory') {
        throw new DOMException(`Entry ${name} is a file`, 'TypeMismatchError');
      }
      return existing as MockFileSystemDirectoryHandle;
    }
    if (options?.create) {
      const newDir = new MockFileSystemDirectoryHandle(name);
      this.entriesMap.set(name, newDir);
      return newDir;
    }
    throw new DOMException(`Directory ${name} not found`, 'NotFoundError');
  }

  async removeEntry(name: string, options?: { recursive?: boolean }): Promise<void> {
    const existing = this.entriesMap.get(name);
    if (!existing) {
      throw new DOMException(`Entry ${name} not found`, 'NotFoundError');
    }
    if (existing.kind === 'directory' && !options?.recursive) {
      const dir = existing as MockFileSystemDirectoryHandle;
      if (dir.entriesMap.size > 0) {
        throw new DOMException(`Directory ${name} is not empty`, 'InvalidModificationError');
      }
    }
    this.entriesMap.delete(name);
  }
}
```

---

## 3. Matriz de Cenários Mínimos Obrigatórios de Teste

| Identificador | Cenário | Comportamento Esperado | Tipo de Verificação |
| :--- | :--- | :--- | :--- |
| **TC-FS-01** | Seleção autorizada de arquivo | Retorna handle válido com permissão `'granted'` | Unitário com Mock |
| **TC-FS-02** | Diálogo de seleção cancelado | Lança `AbortError`, aplicação captura e encerra graciosamente | Unitário com Mock |
| **TC-FS-03** | Permissão negada pelo usuário | Lança `NotAllowedError`, atualiza estado e notifica UI | Unitário com Mock |
| **TC-FS-04** | Permissão revogada na sessão | Detecta `'prompt'` ou `'denied'`, solicita reautorização limpa | Unitário com Mock |
| **TC-FS-05** | Arquivo não existente no disco | Lança `NotFoundError`, trata sem travamento | Unitário com Mock |
| **TC-FS-06** | Arquivo alterado externamente | Recarrega snapshot novo sem corromper estado local | Unitário / Integração |
| **TC-FS-07** | Falha de leitura durante `getFile()` | Tratamento gracioso com log sanitizado | Unitário com Mock |
| **TC-FS-08** | Falha de escrita no stream | Stream cancelado via `abort()`, arquivo original preservado | Unitário com Mock |
| **TC-FS-09** | Escrita interrompida no meio | Arquivo temporário `.crswap` é descartado | Unitário com Mock |
| **TC-FS-10** | Arquivo existente com risco de sobrescrita | Exige confirmação explícita antes de truncar | Unitário com Mock |
| **TC-FS-11** | Exclusão de entrada não autorizada | Rejeição imediata com `NotAllowedError` | Unitário com Mock |
| **TC-FS-12** | Tentativa de exclusão recursiva sem confirmação | Bloqueada pelo guard de segurança antes de chamar a API | Unitário com Mock |
| **TC-FS-13** | Operação em ambiente não suportado | Detecta ausência de FSA e oferece fallback seguro | Unitário |

---

## 4. Limitações Conhecidas dos Mocks

1. **Locks do Sistema Operacional**: Mocks em memória não simulam o comportamento do Windows ou Linux quando um arquivo está aberto exclusivamente por outro processo (ex: editor externo com lock ativo).
2. **Latência de Disco e Quota Real**: Mocks operam em microssegundos; operações em discos reais ou unidades de rede têm latência variável e limites físicos de I/O.
3. **Comportamento Gráfico dos Pickers**: A aparência, atalhos e seleção de múltiplas pastas dependem do gerenciador de janelas do sistema operacional hospedeiro.

Por essas razões, testes unitários com mocks garantem a lógica e resiliência dos contratos, enquanto testes end-to-end com Playwright no Chromium validam a integração final com a plataforma web.
