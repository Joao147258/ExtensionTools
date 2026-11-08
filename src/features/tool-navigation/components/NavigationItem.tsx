import type { NavigationDestination } from '../navigation.types';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/tool-navigation/components/NavigationItem.tsx
 * Responsabilidade: Apresentação de um destino individual de navegação.
 *
 * Papel Arquitetural:
 * Componente apresentacional atômico e controlado (Presentational Component).
 * Não gerencia estado próprio de seleção, derivando toda a sua aparência e
 * comportamento das propriedades fornecidas (`active`, `destination`, `onSelect`).
 *
 * Acessibilidade (WCAG 2.2 AA):
 * - Elemento nativo `<button type="button">` com suporte completo a foco por Tab,
 *   Shift+Tab e ativação via Enter e Espaço.
 * - Identificação semântica de página ativa via `aria-current="page"`.
 * - Ícone tratado como estritamente decorativo com `aria-hidden="true"`.
 * - Indicador de foco visível destacado na cor da marca (`#DF2531`).
 * ==============================================================================
 */

/**
 * Propriedades do componente NavigationItem.
 */
export interface NavigationItemProps {
  /** Dados do destino a ser renderizado */
  readonly destination: NavigationDestination;
  /** Se o destino está atualmente selecionado */
  readonly active: boolean;
  /** Callback acionado ao selecionar este item */
  readonly onSelect: () => void;
  /** Orientação visual do layout */
  readonly orientation?: 'horizontal' | 'vertical';
}

/**
 * Renderiza o botão interativo para um destino de navegação específico.
 */
export function NavigationItem({
  destination,
  active,
  onSelect,
  orientation = 'horizontal',
}: NavigationItemProps) {
  const { label, description, icon, disabled = false } = destination;

  const isVertical = orientation === 'vertical';

  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      className={[
        // Disposição geométrica base
        'group flex items-center transition-colors',
        isVertical
          ? 'w-full gap-2.5 rounded-md px-3 py-2 text-left'
          : 'gap-2 rounded-md px-3 py-1.5 text-xs whitespace-nowrap',
        // Foco acessível com anel destacado na cor da marca
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DF2531]',
        // Estados desabilitados
        'disabled:cursor-not-allowed disabled:opacity-40',
        // Estados ativos vs inativos alinhados ao DESIGN.md
        active
          ? 'border border-[#DF2531]/40 bg-[#2B2B31] text-white shadow-xs'
          : 'border border-transparent text-[#9CA3AF] hover:border-[#2B2B33] hover:bg-[#1E1E22] hover:text-white',
      ].join(' ')}
    >
      {/* Indicador de acento visual sutil no item ativo */}
      {active && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#DF2531]" aria-hidden="true" />
      )}

      {/* Ícone decorativo opcional */}
      {icon != null && (
        <span
          aria-hidden="true"
          className={[
            'flex shrink-0 items-center justify-center transition-colors',
            active ? 'text-[#DF2531]' : 'text-[#9CA3AF] group-hover:text-white',
          ].join(' ')}
        >
          {icon}
        </span>
      )}

      {/* Rótulo e descrição opcional */}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-medium">{label}</span>

        {isVertical && description && (
          <span className="truncate text-[11px] text-[#6B7280]">{description}</span>
        )}
      </span>
    </button>
  );
}
