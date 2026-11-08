# Guia do Ambiente de Desenvolvimento Local — ExtensionTools

> **Projeto:** ExtensionTools  
> **Classificação:** Repositório Público (Safe-by-Default)  
> **Framework:** WXT 0.21.5 / React 19 / TypeScript 7  
> **Alvo:** Chromium / Google Chrome (Manifest V3)

---

## 1. Requisitos do Ambiente

- **Node.js:** Versão 24.x LTS (compatível com Node v24.18.0).
- **Gerenciador de Pacotes:** `npm` (ou `pnpm` conforme lockfile).
- **Navegador:** Chromium ou Google Chrome instalado no sistema (detectado automaticamente via `/usr/bin/google-chrome` ou `which chromium`).
- **Sistema Operacional:** Linux / macOS / Windows (com suporte gráfico a janelas X11/Wayland).

---

## 2. Instalação das Dependências

Instale as dependências com o gerenciador do projeto:

```bash
npm install
```

O projeto inclui o framework `wxt` e a ferramenta oficial de automação de navegador `web-ext` em `devDependencies`.

---

## 3. Como Executar o Ambiente de Desenvolvimento

Para iniciar o ambiente com automação completa, execute:

```bash
npm run dev
```

Este comando dispara o WXT (`wxt`), que executa a esteira automática:
1. Inicia o servidor local de desenvolvimento Vite (`http://localhost:3000`).
2. Pré-renderiza e compila os artefatos de desenvolvimento da extensão em `.output/chrome-mv3-dev/`.
3. Localiza o executável do Chromium ou Google Chrome no sistema.
4. Inicializa uma instância dedicada do navegador apontando para o perfil isolado `.wxt/chrome-data/`.
5. Carrega a extensão `ExtensionTools` automaticamente em modo unpacked/desenvolvedor.

Não é necessário abrir o menu de extensões (`chrome://extensions`) nem clicar em "Carregar sem compactação".

---

## 4. Como o WXT Inicia o Navegador

O WXT 0.21.5 utiliza internamente o runner `web-ext` (`WebExtRunner`) para gerenciar o processo do navegador.

A configuração em `wxt.config.ts` estabelece:

```typescript
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifestVersion: 3,
  webExt: {
    chromiumProfile: '.wxt/chrome-data',
    keepProfileChanges: true,
  },
  manifest: {
    name: 'ExtensionTools',
    description: 'Extensão modular de produtividade local-first para navegadores',
    version: '0.1.0',
    permissions: [],
  },
});
```

- **`chromiumProfile`**: Especifica o diretório `.wxt/chrome-data` como pasta de dados do usuário (`--user-data-dir`).
- **`keepProfileChanges: true`**: Garante que o diretório e suas configurações não sejam excluídos ao fechar o navegador.

---

## 5. Como Abrir o Side Panel

Por determinação das políticas de segurança do Manifest V3 e da API do Chromium:
> A abertura do Side Panel (`chrome.sidePanel.open`) exige um gesto ou interação do usuário e não pode ser acionada programaticamente de forma desatendida no carregamento da página.

Para abrir o Side Panel:
1. Localize o ícone da extensão **ExtensionTools** na barra de ferramentas do navegador (ou no menu de extensões).
2. Clique no ícone da extensão.
3. O Service Worker em `src/entrypoints/background/index.ts` intercepta a ação via `browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` e abre imediatamente o Side Panel na lateral direita do navegador, exibindo o Workspace Shell.

---

## 6. Hot Module Replacement (HMR)

O servidor Vite em `http://localhost:3000` fornece atualização automática em tempo real (HMR):
- Alterações em componentes React (`src/app/`, `src/features/`) ou estilos CSS (`src/shared/styles/`, `style.css`) são propagadas instantaneamente via WebSocket ao Side Panel.
- Para recarregar a extensão completa em caso de alteração em manifests ou background, use o atalho padrão `Alt + R` no navegador.

---

## 7. Persistência e Isolamento do Perfil

- **Isolamento:** O perfil é salvo exclusivamente em `.wxt/chrome-data/`, completamente separado do navegador e perfil pessoal do desenvolvedor.
- **Persistência:** Preferências, extensões fixadas, janelas e dados do IndexedDB/Chrome Storage permanecem gravados entre encerramentos e reinicializações de `npm run dev`.
- **Segurança:** O caminho `.wxt/` está listado no `.gitignore` do repositório, garantindo que nenhum histórico, cache ou dado local seja versionado ou exposto publicamente.

---

## 8. Diagnóstico e Resolução de Problemas Comuns

### Aviso `manifest.manifest_version config was set, but ignored`
- **Causa:** Declarar `manifest_version: 3` dentro do objeto `manifest` em `wxt.config.ts`.
- **Solução:** Declarar `manifestVersion: 3` no primeiro nível do `defineConfig(...)` do WXT.

### Navegador não abre automaticamente e exibe mensagem manual
- **Causa:** Ausência da dependência `web-ext` no projeto ou execução dentro de ambiente restrito (ex: WSL sem servidor gráfico).
- **Solução:** Certifique-se de que `web-ext` esteja instalado em `devDependencies` e que haja uma sessão gráfica ativa (`$DISPLAY` configurado).

### Bloqueio por perfil em uso (SingletonLock)
- **Causa:** Uma instância anterior do Chrome ficou travada ou rodando em background no mesmo perfil.
- **Solução:** Encerre o processo órfão com `pkill -f chrome-data` ou remova o lock com `rm -f .wxt/chrome-data/SingletonLock`.

### Encerramento repentino do Chrome e `Error: read ECONNRESET`
- **Causa:** Em ambientes Linux onde o editor (ex.: VS Code) roda encapsulado via Snap, variáveis internas como `GSETTINGS_SCHEMA_DIR` e `GTK_PATH` vazam para o terminal integrado. O Google Chrome nativo do sistema operacional tenta carregar os schemas GNOME do Snap, gerando falha fatal no GLib (`GLib-GIO-ERROR: Settings schema 'org.gnome.settings-daemon.plugins.xsettings' does not contain a key named 'antialiasing'`) com sinal SIGABRT (código 134). A quebra instantânea do canal de comunicação CDP faz o socket emitir `ECONNRESET`.
- **Solução implementada:** `wxt.config.ts` higieniza automaticamente as variáveis de ambiente herdadas do Snap antes do WXT inicializar o runner, restaurando os caminhos originais do host, e registra proteções de processo para reconexão graciosa.

---

## 9. Como Encerrar o Ambiente Corretamente

1. No terminal onde `npm run dev` está executando, pressione `Ctrl + C`.
2. O servidor WXT encerra graciosamente o processo filho do navegador e finaliza a sessão.
