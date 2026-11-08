/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/components/WorkspaceHeader.tsx
 * Responsabilidade: Apresentação da identidade visual permanente do ExtensionTools.
 *
 * Papel Arquitetural:
 * Componente estritamente apresentacional (Presentational Component).
 * Não possui estado local, não interage com o armazenamento do navegador
 * e não conhece as implementações ou seleção de ferramentas.
 *
 * Diretrizes Visuais (DESIGN.md):
 * - Cabeçalho minimalista, escuro e com tipografia limpa.
 * - Identidade da marca ExtensionTools com destaque semântico e visual.
 * - Elemento estrutural fixo sem encolhimento acidental (shrink-0).
 * ==============================================================================
 */

/**
 * Cabeçalho estrutural permanente do Workspace no Side Panel.
 *
 * Identifica o produto e provê o contexto inicial de uso sem acoplamento
 * com regras de negócio, fluxos de navegação ou ferramentas ativas.
 */
export function WorkspaceHeader() {
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b border-[#2B2B33] bg-[#101013] px-4 py-3"
      role="banner"
    >
      <div className="flex min-w-0 items-center gap-2">
        {/* Indicador de acento visual da marca (Brand Red #DF2531) */}
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#DF2531]"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-wide text-white">
            ExtensionTools
          </h1>
          <p className="truncate text-xs text-[#9CA3AF]">Workspace de Ferramentas</p>
        </div>
      </div>
    </header>
  );
}
