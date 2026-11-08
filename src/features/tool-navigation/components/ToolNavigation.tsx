import { NavigationItem } from './NavigationItem';
import type { ToolNavigationProps } from '../navigation.types';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/tool-navigation/components/ToolNavigation.tsx
 * Responsabilidade: Lista navegável e controlada de destinos de ferramentas (B1-F02).
 *
 * Papel Arquitetural:
 * Componente de navegação estrutural puramente controlado (Controlled Component).
 * Renderiza uma coleção de destinos (`NavigationDestination`), identifica visual e
 * semanticamente o destino ativo e comunica solicitações de seleção ao Composition Root.
 *
 * Invariantes Arquiteturais:
 * - Não possui estado local de seleção (`useState`), derivando 100% das props.
 * - Não executa nem importa lógica ou componentes internos das ferramentas.
 * - Impede a emissão de seleção para itens desabilitados ou já ativos.
 * - Respeita o isolamento de fronteiras da arquitetura Feature-First.
 * ==============================================================================
 */

/**
 * Apresenta a coleção de destinos disponíveis para navegação no ExtensionTools.
 */
export function ToolNavigation({
  tools,
  activeToolId,
  onSelectTool,
  orientation = 'horizontal',
}: ToolNavigationProps) {
  const isVertical = orientation === 'vertical';

  return (
    <nav aria-label="Ferramentas" className="min-w-0 w-full">
      {tools.length === 0 ? (
        <p className="px-2 py-1 text-xs text-[#9CA3AF]">Nenhuma ferramenta disponível.</p>
      ) : (
        <ul
          className={[
            'min-w-0',
            isVertical ? 'flex flex-col gap-1' : 'flex items-center gap-1.5 overflow-x-auto py-0.5',
          ].join(' ')}
        >
          {tools.map((tool) => {
            const active = tool.id === activeToolId;

            /**
             * Comunica a seleção à composição somente se o destino for válido,
             * estiver habilitado e não for o destino já ativo.
             */
            function handleSelect() {
              if (tool.disabled || active) {
                return;
              }

              onSelectTool(tool.id);
            }

            return (
              <li key={tool.id} className={isVertical ? 'w-full' : 'shrink-0'}>
                <NavigationItem
                  destination={tool}
                  active={active}
                  onSelect={handleSelect}
                  orientation={orientation}
                />
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
