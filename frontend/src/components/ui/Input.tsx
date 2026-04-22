/**
 * Input — labeled text field with inline validation feedback.
 *
 * Props
 * ─────
 * label   – visible label (also used as aria + id fallback)
 * error   – validation message shown in red below the field
 * hint    – helper text shown when there is no error
 * icon    – optional leading icon (16–18 px SVG/element)
 *
 * Usage
 * ─────
 * <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
 */
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?:  string;
  icon?:  ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, id, className = '', style, ...rest }, ref) => {
    const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errId   = `${inputId}-err`;
    const hintId  = `${inputId}-hint`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...( style as React.CSSProperties | undefined) }}>
        <label
          htmlFor={inputId}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '.01em' }}
        >
          {label}
        </label>

        <div style={{ position: 'relative' }}>
          {icon && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--c-text-subtle)', display: 'flex', alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errId : hint ? hintId : undefined}
            style={{ paddingLeft: icon ? 38 : undefined }}
            className={className}
            {...rest}
          />
        </div>

        {hint && !error && (
          <span id={hintId} style={{ fontSize: 12, color: 'var(--c-text-subtle)' }}>
            {hint}
          </span>
        )}
        {error && (
          <span
            id={errId}
            role="alert"
            style={{
              fontSize: 12,
              color: 'var(--c-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// needed for CSSProperties cast
import React from 'react';
