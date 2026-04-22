/**
 * Button — accessible, multi-variant call-to-action.
 *
 * Props
 * ─────
 * variant  – 'primary' | 'secondary' | 'danger' | 'ghost'  (default: 'primary')
 * size     – 'sm' | 'md' | 'lg'                             (default: 'md')
 * loading  – shows spinner, prevents double-submit
 * icon     – optional leading ReactNode (icon component)
 * ...rest  – forwarded to <button>
 *
 * Usage
 * ─────
 * <Button variant="danger" loading={isPending}>Delete</Button>
 * <Button variant="ghost" size="sm" icon={<PlusIcon />}>Add Reply</Button>
 */
import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
  icon?:    ReactNode;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--c-primary)',
    color: '#fff',
    border: '1.5px solid transparent',
  },
  secondary: {
    background: 'var(--c-surface)',
    color: 'var(--c-text)',
    border: '1.5px solid var(--c-border)',
  },
  danger: {
    background: 'var(--c-danger)',
    color: '#fff',
    border: '1.5px solid transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--c-primary)',
    border: '1.5px solid transparent',
  },
};

const hoverBg: Record<Variant, string> = {
  primary:   'var(--c-primary-h)',
  secondary: '#f8fafc',
  danger:    'var(--c-danger-h)',
  ghost:     'var(--c-primary-light)',
};

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px',  fontSize: 13, borderRadius: 'var(--radius-sm)', gap: 6 },
  md: { padding: '9px 18px',  fontSize: 14, borderRadius: 'var(--radius-sm)', gap: 8 },
  lg: { padding: '11px 24px', fontSize: 15, borderRadius: 'var(--radius-md)', gap: 8 },
};

export function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  icon,
  disabled,
  children,
  style = {},
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    transition: 'background var(--transition), box-shadow var(--transition), transform var(--transition)',
    outline: 'none',
    fontFamily: 'inherit',
    boxShadow: variant === 'primary' || variant === 'danger'
      ? hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)'
      : 'none',
    transform: hovered && !disabled && !loading ? 'translateY(-1px)' : 'none',
    ...styles[variant],
    ...sizes[size],
    background: hovered && !disabled && !loading ? hoverBg[variant] : styles[variant].background,
    ...style,
  };

  return (
    <button
      disabled={disabled || loading}
      style={base}
      onMouseEnter={(e) => { setHovered(true);  onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            width: '1em', height: '1em',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

// Inline React import needed for useState
import React from 'react';
