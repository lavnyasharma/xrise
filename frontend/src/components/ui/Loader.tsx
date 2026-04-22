interface LoaderProps {
  text?:  string;
  size?:  'sm' | 'md' | 'lg';
  inline?: boolean;
}

const sizes = { sm: 20, md: 36, lg: 52 };

export function Loader({ text = 'Loading…', size = 'md', inline = false }: LoaderProps) {
  const px = sizes[size];
  return (
    <div
      role="status"
      aria-label={text}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: inline ? 0 : 56,
        color: 'var(--c-text-subtle)',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          width:  px,
          height: px,
          border: `${size === 'sm' ? 2 : 3}px solid var(--c-border)`,
          borderTopColor: 'var(--c-primary)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      {!inline && text}
    </div>
  );
}
