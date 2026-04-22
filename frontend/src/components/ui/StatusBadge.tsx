import { TicketPriority, TicketStatus } from '@/types';

type BadgeValue = TicketStatus | TicketPriority;

const config: Record<BadgeValue, { bg: string; color: string; dot: string; label: string }> = {
  open:        { bg: 'var(--c-primary-light)', color: 'var(--c-primary)', dot: 'var(--c-primary)', label: 'Open' },
  in_progress: { bg: 'var(--c-warning-light)', color: 'var(--c-warning)', dot: 'var(--c-warning)', label: 'In Progress' },
  closed:      { bg: 'var(--c-success-light)', color: 'var(--c-success)', dot: 'var(--c-success)', label: 'Closed' },
  low:         { bg: 'var(--c-surface)', color: 'var(--c-text-muted)', dot: 'var(--c-border)', label: 'Low' },
  medium:      { bg: 'var(--c-warning-light)', color: 'var(--c-warning)', dot: 'var(--c-warning)', label: 'Medium' },
  high:        { bg: 'var(--c-danger-light)', color: 'var(--c-danger)', dot: 'var(--c-danger)', label: 'High' },
};

interface StatusBadgeProps {
  value:  BadgeValue;
  type?:  'status' | 'priority';
  showDot?: boolean;
}

export function StatusBadge({ value, showDot = true }: StatusBadgeProps) {
  const c = config[value];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '.02em',
        background: c.bg,
        color: c.color,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {showDot && (
        <span
          style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: c.dot,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
      )}
      {c.label}
    </span>
  );
}
