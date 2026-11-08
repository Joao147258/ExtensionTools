import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanelApp } from '../../app/sidepanel/SidePanelApp';
import './style.css';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/entrypoints/sidepanel/main.tsx
 * Responsabilidade: Bootstrap e inicialização do runtime React 19 no Side Panel.
 *
 * Conecta o runtime WXT à composição B1-C01 (SidePanelApp).
 * ==============================================================================
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz do Side Panel não encontrado (#root).');
}

createRoot(rootElement).render(
  <StrictMode>
    <SidePanelApp />
  </StrictMode>
);
