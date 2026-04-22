import { AxiosError } from 'axios';

interface ErrorStateProps {
  error:    unknown;
  onRetry?: () => void;
  compact?: boolean;
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}

export function ErrorState({ error, onRetry, compact = false }: ErrorStateProps) {
  const message = extractMessage(error);
  if (compact) {
    return (
      <p role="alert" style={{ fontSize: 13, color: 'var(--c-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden>⚠</span> {message}
      </p>
    );
  }
  return (
    <div
      role="alert"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        padding: '48px 24px', textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 44 }}>😕</span>
      <div>
        <p style={{ fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>Something went wrong</p>
        <p style={{ fontSize: 13, color: 'var(--c-text-muted)', maxWidth: 340 }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4, padding: '8px 20px',
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
