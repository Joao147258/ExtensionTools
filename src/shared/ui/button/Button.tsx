import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { VisualSize } from '../types';
import { cx } from '../utils/cx';
import { Icon } from '../icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /** Variante semântica visual. Default: 'secondary' */
  variant?: ButtonVariant;
  /** Escala de tamanho e densidade visual. Default: 'md' */
  visualSize?: VisualSize;
  /** Indica se o botão está em processamento assíncrono. Default: false */
  loading?: boolean;
  /** Texto alternativo para leitores de tela durante o estado loading */
  loadingText?: string;
  /** Ícone ou elemento exibido antes do conteúdo textual */
  iconLeft?: ReactNode;
  /** Ícone ou elemento exibido após o conteúdo textual */
  iconRight?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-base-white hover:bg-brand-hover active:bg-brand-active focus-visible:ring-brand-primary',
  secondary:
    'bg-surface-elevated text-text-primary border border-border-default hover:bg-surface-dark hover:border-border-focus active:bg-bg-dark focus-visible:ring-brand-primary',
  danger:
    'bg-feedback-error text-base-white hover:opacity-90 active:opacity-80 focus-visible:ring-feedback-error',
};

const SIZE_CLASSES: Record<VisualSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-xs gap-2',
};

/**
 * Componente Button para disparo de ações do usuário.
 * Define type="button" por padrão e gerencia acessibilidade de loading e desabilitação.
 */
export function Button({
  variant = 'secondary',
  visualSize = 'md',
  loading = false,
  loadingText,
  iconLeft,
  iconRight,
  type = 'button',
  disabled,
  children,
  className,
  ref,
  ...props
}: ButtonProps) {
  const isEffectivelyDisabled = Boolean(disabled || loading);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isEffectivelyDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={cx(
        'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[visualSize],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Icon name="spinner" visualSize={visualSize} aria-hidden="true" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {iconLeft}
          {children && <span>{children}</span>}
          {iconRight}
        </>
      )}
    </button>
  );
}
