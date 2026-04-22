interface EmptyStateProps {
  emoji?:       string;
  title?:       string;
  description?: string;
  action?:      React.ReactNode;
}

export function EmptyState({
  emoji       = '📭',
  title       = 'Nothing here yet',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '56px 24px', textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 48, lineHeight: 1 }}>{emoji}</span>
      <strong style={{ fontSize: 16, color: 'var(--c-text)', marginTop: 4 }}>{title}</strong>
      {description && (
        <p style={{ fontSize: 13, color: 'var(--c-text-muted)', maxWidth: 340 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

import React from 'react';
