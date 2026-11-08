import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    name: 'ExtensionTools',
    description: 'Extensão modular de produtividade local-first para navegadores',
    version: '0.1.0',
    manifest_version: 3,
    permissions: [],
  },
});
