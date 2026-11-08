import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// Saneamento de variáveis de ambiente herdadas de ambientes em contêiner/snap (ex.: VS Code Snap).
// O VS Code Snap injeta variáveis de ambiente apontando para seus schemas e bibliotecas internas,
// o que faz com que o executável nativo do Google Chrome/Chromium aborte imediatamente via GLib
// com o erro "Settings schema 'org.gnome.settings-daemon.plugins.xsettings' does not contain a key named 'antialiasing'".
export const SNAP_ENV_VARS = [
  'GSETTINGS_SCHEMA_DIR',
  'GIO_MODULE_DIR',
  'GTK_PATH',
  'GTK_EXE_PREFIX',
  'GTK_IM_MODULE_FILE',
  'LOCPATH',
];

export function sanitizeEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  for (const envVar of SNAP_ENV_VARS) {
    const origKey = `${envVar}_VSCODE_SNAP_ORIG`;
    if (env[origKey] !== undefined) {
      if (env[origKey]) {
        env[envVar] = env[origKey];
      } else {
        delete env[envVar];
      }
    } else if (env[envVar]?.includes('/snap/code/')) {
      delete env[envVar];
    }
  }

  if (env.XDG_DATA_DIRS_VSCODE_SNAP_ORIG !== undefined) {
    env.XDG_DATA_DIRS = env.XDG_DATA_DIRS_VSCODE_SNAP_ORIG;
  }
}

// Remoção de SingletonLock estéril deixado por processos anteriores que já encerraram.
export function cleanupStaleLock(): void {
  try {
    const lockPath = path.resolve(process.cwd(), '.wxt/chrome-data/SingletonLock');
    if (fs.existsSync(lockPath)) {
      try {
        const target = fs.readlinkSync(lockPath);
        const match = target.match(/-(\d+)$/);
        if (match) {
          const pid = parseInt(match[1], 10);
          try {
            process.kill(pid, 0);
          } catch {
            fs.unlinkSync(lockPath);
          }
        }
      } catch {
        // Ignora caso não consiga ler link
      }
    }
  } catch {
    // Ignora falhas de acesso a lock
  }
}

// Tratamento defensivo para desconexão abrupta do socket/pipe CDP (ECONNRESET/EPIPE)
// e propagação de encerramento limpo para processos Chromium destacados.
export function setupProcessGuards(): void {
  process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
    if (err?.code === 'ECONNRESET' || err?.code === 'EPIPE') {
      return;
    }
    throw err;
  });

  const terminateSpawnedChrome = () => {
    try {
      const pidFile = path.resolve(process.cwd(), '.wxt/chrome-data/chrome.pid');
      if (fs.existsSync(pidFile)) {
        const pidStr = fs.readFileSync(pidFile, 'utf8').trim();
        const pid = parseInt(pidStr, 10);
        if (!isNaN(pid)) {
          try {
            process.kill(pid, 'SIGTERM');
          } catch {
            // Processo já finalizado
          }
        }
      }
    } catch {
      // Ignora falha na leitura do pid
    }
  };

  process.once('SIGINT', () => {
    terminateSpawnedChrome();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    terminateSpawnedChrome();
    process.exit(0);
  });
}

// Execução automática na inicialização do WXT
sanitizeEnvironment();
cleanupStaleLock();
setupProcessGuards();

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    chromiumProfile: '.wxt/chrome-data',
    keepProfileChanges: true,
  },
  manifest: {
    name: 'ExtensionTools',
    description: 'Extensão modular de produtividade local-first para navegadores',
    version: '0.1.0',
    minimum_chrome_version: '114',
    action: {
      default_title: 'Abrir ExtensionTools',
    },
    permissions: [],
  },
});
