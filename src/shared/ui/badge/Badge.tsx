import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../utils/cx';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  /** Tonalidade semântica do badge. Default: 'neutral' */
  tone?: BadgeTone;
  /** Conteúdo textual ou numérico do badge */
  children: ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-elevated text-text-secondary border border-border-default',
  success: 'bg-feedback-success/15 text-feedback-success border border-feedback-success/30',
  warning: 'bg-feedback-warning/15 text-feedback-warning border border-feedback-warning/30',
  danger: 'bg-feedback-error/15 text-feedback-error border border-feedback-error/30',
};

/**
 * Componente Badge para rotulagem, sinalização de status, contagem ou categoria.
 * Elemento puramente informativo (leitura), não interativo.
 */
export function Badge({ tone = 'neutral', children, className, ref, ...props }: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cx(
        'inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium font-sans select-none',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
