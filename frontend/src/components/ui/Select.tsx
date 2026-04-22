import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectOption { value: string; label: string; }

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label:        string;
  options:      SelectOption[];
  error?:       string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, id, ...rest }, ref) => {
    const selectId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label
          htmlFor={selectId}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '.01em' }}
        >
          {label}
        </label>
        <select ref={ref} id={selectId} aria-invalid={!!error} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && (
          <span role="alert" style={{ fontSize: 12, color: 'var(--c-danger)' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
