import { TicketPriority, TicketStatus } from '@/types';

type BadgeValue = TicketStatus | TicketPriority;

const config: Record<BadgeValue, { bg: string; color: string; border: string; label: string }> = {
  open:        { bg: 'var(--c-primary-light)',  color: 'var(--c-primary)', border: 'var(--c-primary)',  label: 'Open' },
  in_progress: { bg: 'var(--c-warning-light)',  color: 'var(--c-warning)', border: 'var(--c-warning)',  label: 'In Progress' },
  closed:      { bg: 'var(--c-success-light)',  color: 'var(--c-success)', border: 'var(--c-success)',  label: 'Closed' },
  low:         { bg: 'var(--c-surface-3)',      color: 'var(--c-text-muted)', border: 'var(--c-border)', label: 'Low' },
  medium:      { bg: 'var(--c-warning-light)',  color: 'var(--c-warning)', border: 'var(--c-warning)',  label: 'Medium' },
  high:        { bg: 'var(--c-danger-light)',   color: 'var(--c-danger)',  border: 'var(--c-danger)',   label: 'High' },
};

interface StatusBadgeProps {
  value:    BadgeValue;
  showDot?: boolean;
}

export function StatusBadge({ value, showDot = true }: StatusBadgeProps) {
  const c = config[value];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.05em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        opacity: 0.95,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {showDot && (
        <span
          style={{
            width: 5, height: 5,
            borderRadius: '50%',
            background: c.color,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
      )}
      {c.label}
    </span>
  );
}
