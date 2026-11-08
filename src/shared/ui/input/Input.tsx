import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import type { FormFieldA11yProps, VisualSize } from '../types';
import { cx } from '../utils/cx';

export type TextInputType = 'text' | 'search' | 'email' | 'password' | 'url' | 'tel';

export interface InputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'>, FormFieldA11yProps {
  /** Tipo nativo do controle textual. Default: 'text' */
  type?: TextInputType;
  /** Escala de densidade visual. Default: 'md' */
  visualSize?: VisualSize;
  /** Ícone ou elemento exibido à esquerda */
  iconLeft?: ReactNode;
  /** Ícone ou elemento exibido à direita */
  iconRight?: ReactNode;
  /** Classe CSS customizada aplicada ao container raiz do campo */
  containerClassName?: string;
}

/**
 * Componente Input acessível para entrada de dados textuais.
 * Realiza amarração semântica entre label, input, dica e erro com useId().
 */
export function Input({
  type = 'text',
  visualSize = 'md',
  label,
  hint,
  error,
  hideLabel = false,
  iconLeft,
  iconRight,
  id,
  className,
  containerClassName,
  ref,
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const hasError = Boolean(error);
  const describedBy = hasError ? errorId : hintId;

  const sizeClasses =
    visualSize === 'sm'
      ? cx('h-7 text-xs', iconLeft ? 'pl-8' : 'pl-2.5', iconRight ? 'pr-8' : 'pr-2.5')
      : cx('h-8 text-xs', iconLeft ? 'pl-9' : 'pl-3', iconRight ? 'pr-9' : 'pr-3');

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
        {iconLeft && (
          <div className="absolute left-2.5 flex items-center pointer-events-none text-text-muted">
            {iconLeft}
          </div>
        )}

        <input
          ref={ref}
          id={controlId}
          type={type}
          disabled={disabled}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cx(
            'w-full rounded-md font-sans text-text-primary bg-surface-dark placeholder:text-text-muted',
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
        />

        {iconRight && (
          <div className="absolute right-2.5 flex items-center text-text-muted">{iconRight}</div>
        )}
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
