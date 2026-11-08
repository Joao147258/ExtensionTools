import { Component, type ReactNode } from 'react';

/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: src/features/workspace-shell/components/RenderErrorBoundary.tsx
 * Responsabilidade: Contenção de falhas de renderização de componentes filhos (Fault Containment).
 *
 * Papel Arquitetural:
 * Error Boundary baseado em classe conforme exigido pelo React 19.
 * Delimita uma fronteira de resiliência ao redor do conteúdo dinâmico, garantindo
 * que erros não tratados na renderização de ferramentas não desmontem a interface
 * inteira do Side Panel (preservando o cabeçalho e a barra de navegação).
 *
 * Princípios de Segurança e Privacidade:
 * - Não expõe mensagens técnicas cruas ou rastreamentos de pilha (stack traces) no DOM.
 * - Evita o vazamento de dados manipulados pelo usuário durante o estado de erro.
 * ==============================================================================
 */

/**
 * Contrato de propriedades do RenderErrorBoundary.
 */
export type RenderErrorBoundaryProps = {
  /** Componentes protegidos pelo boundary de renderização */
  children: ReactNode;
  /** Interface de fallback alternativa opcional */
  fallback?: ReactNode;
};

/**
 * Estado interno do RenderErrorBoundary.
 */
export type RenderErrorBoundaryState = {
  /** Indica se ocorreu falha na renderização de algum descendente */
  hasError: boolean;
};

/**
 * Componente de contenção de falhas de renderização da interface.
 */
export class RenderErrorBoundary extends Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  override state: RenderErrorBoundaryState = {
    hasError: false,
  };

  /**
   * Atualiza o estado para que a próxima renderização apresente a interface de fallback.
   *
   * Método puro, sem efeitos colaterais.
   */
  static getDerivedStateFromError(): RenderErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  /**
   * Ponto de captura de erros de renderização.
   * Mantido limpo para não registrar dados sensíveis ou mensagens de usuário em logs abertos.
   */
  override componentDidCatch(_error: unknown, _errorInfo: unknown): void {
    // Tratamento seguro: não propaga dados de contexto ou payload do usuário
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <section
          role="alert"
          aria-live="assertive"
          className="flex min-w-0 flex-col items-center justify-center rounded-lg border border-[#2B2B33] bg-[#1E1E22] p-6 text-center"
        >
          {/* Indicador de erro visual conforme DESIGN.md (#E53935 com ícone de alerta) */}
          <div
            aria-hidden="true"
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#E53935]/15 text-[#E53935]"
          >
            <span className="text-lg font-bold">!</span>
          </div>

          <h2 className="text-sm font-semibold text-white">
            Não foi possível apresentar este conteúdo.
          </h2>

          <p className="mt-1.5 max-w-xs text-xs text-[#9CA3AF]">
            Ocorreu uma falha ao renderizar a ferramenta. Tente alternar para outra ferramenta ou
            reiniciar o Side Panel.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}
