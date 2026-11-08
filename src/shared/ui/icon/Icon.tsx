import type { ComponentPropsWithRef } from 'react';
import type { VisualSize } from '../types';
import { cx } from '../utils/cx';
import { ICON_PATHS, type IconName } from './icons';

export type { IconName } from './icons';

export interface IconProps extends ComponentPropsWithRef<'svg'> {
  /** Nome do ícone cadastrado no catálogo canônico */
  name: IconName;
  /** Escala de tamanho visual. Default: 'md' */
  visualSize?: VisualSize;
  /** Rótulo textual para acessibilidade. Quando omitido, o ícone é decorativo (aria-hidden="true") */
  label?: string;
}

/**
 * Componente Icon para renderização de glifos vetoriais monocromáticos do Design System.
 * Herda a cor do elemento pai via currentColor.
 */
export function Icon({ name, visualSize = 'md', label, className, ref, ...props }: IconProps) {
  const sizeClasses = visualSize === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const isSpinner = name === 'spinner';

  const a11yProps = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };

  const content = ICON_PATHS[name];

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      className={cx(
        'inline-block shrink-0 stroke-current fill-none stroke-2 stroke-linecap-round stroke-linejoin-round',
        sizeClasses,
        isSpinner && 'animate-spin',
        className
      )}
      {...a11yProps}
      {...props}
    >
      {content}
    </svg>
  );
}
