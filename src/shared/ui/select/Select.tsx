import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import type { FormFieldA11yProps, VisualSize } from '../types';
import { cx } from '../utils/cx';
import { Icon } from '../icon';

export interface SelectProps
  extends Omit<ComponentPropsWithRef<'select'>, 'size'>, FormFieldA11yProps {
  /** Escala de densidade visual. Default: 'md' */
  visualSize?: VisualSize;
  /** Opções nativas (<option>, <optgroup>) */
  children: ReactNode;
  /** Classe CSS customizada aplicada ao container raiz do campo */
  containerClassName?: string;
}

/**
 * Componente Select nativo estilizado do Design System do ExtensionTools.
 * Utiliza o elemento <select> nativo envelopado com chevron decorativo e amarração acessível.
 */
export function Select({
  visualSize = 'md',
  label,
  hint,
  error,
  hideLabel = false,
  children,
  id,
  className,
  containerClassName,
  ref,
  disabled,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const hasError = Boolean(error);
  const describedBy = hasError ? errorId : hintId;

  const sizeClasses = visualSize === 'sm' ? 'h-7 pl-2.5 pr-7 text-xs' : 'h-8 pl-3 pr-8 text-xs';

  return (
    <div className={cx('flex flex-col gap-1 w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={controlId}
          className={cx(
            'text-xs font-medium text-text-primary select-none',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={controlId}
          disabled={disabled}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cx(
            'w-full rounded-md font-sans text-text-primary bg-surface-dark appearance-none cursor-pointer',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-dark',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-elevated',
            hasError
              ? 'border border-feedback-error hover:border-feedback-error focus-visible:ring-feedback-error focus-visible:border-feedback-error'
              : 'border border-border-default hover:border-border-focus focus-visible:ring-brand-primary focus-visible:border-brand-primary',
            sizeClasses,
            className
          )}
          {...props}
        >
          {children}
        </select>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <Icon name="chevron-down" visualSize={visualSize} aria-hidden="true" />
        </div>
      </div>

      {hasError ? (
        <span id={errorId} role="alert" className="text-2xs text-feedback-error font-medium">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="text-2xs text-text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
