import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../utils/cx';

export type PanelTag = 'div' | 'section' | 'aside';
export type PanelSurface = 'primary' | 'secondary' | 'elevated';
export type PanelPadding = 'none' | 'sm' | 'md' | 'lg';

export interface PanelProps extends ComponentPropsWithRef<'div'> {
  /** Tag HTML semântica a ser renderizada. Default: 'div' */
  as?: PanelTag;
  /** Cor de fundo da superfície conforme tokens. Default: 'secondary' */
  surface?: PanelSurface;
  /** Espaçamento interno padronizado. Default: 'md' */
  padding?: PanelPadding;
  /** Conteúdo interno */
  children: ReactNode;
}

const SURFACE_CLASSES: Record<PanelSurface, string> = {
  primary: 'bg-bg-dark',
  secondary: 'bg-surface-dark',
  elevated: 'bg-surface-elevated shadow-xs',
};

const PADDING_CLASSES: Record<PanelPadding, string> = {
  none: 'p-0',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

/**
 * Componente Panel para agrupamento estrutural e delimitação de blocos de conteúdo.
 * Componente apresentacional reutilizável com polimorfismo controlado.
 */
export function Panel({
  as: Tag = 'div',
  surface = 'secondary',
  padding = 'md',
  children,
  className,
  ref,
  ...props
}: PanelProps) {
  return (
    <Tag
      ref={ref}
      {...props}
      className={cx(
        'rounded-lg border border-border-default overflow-hidden',
        SURFACE_CLASSES[surface],
        PADDING_CLASSES[padding],
        className
      )}
    >
      {children}
    </Tag>
  );
}
