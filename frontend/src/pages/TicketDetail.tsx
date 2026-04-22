import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTicketDetails, addReply, updateTicketStatus, assignTicket } from '@/api/tickets';
import { getAgents } from '@/api/users';
import { draftReply, summariseTicket } from '@/api/ai';
import { useAuth } from '@/context/AuthContext';
import { TicketEvent, TicketPriority, TicketStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';

const replySchema = z.object({
  message: z.string().trim().min(1, 'Reply cannot be empty').max(10_000),
});
type ReplyForm = z.infer<typeof replySchema>;

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed',      label: 'Closed' },
];

const EVENT_STYLE: Record<string, { icon: string; bg: string; border: string }> = {
  created:      { icon: '🎟',  bg: '#f0f4ff', border: '#c7d7fe' },
  reply:        { icon: '💬',  bg: '#f8fafc', border: 'var(--c-border)' },
  status_change:{ icon: '🔄',  bg: '#fefce8', border: '#fde68a' },
  reassigned:   { icon: '👤',  bg: '#f0fdf4', border: '#bbf7d0' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function Avatar({ email, size = 28 }: { email: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--c-primary), #818cf8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      }}
    >
      {email[0].toUpperCase()}
    </div>
  );
}

function TimelineItem({ event }: { event: TicketEvent }) {
  const s = EVENT_STYLE[event.type] ?? EVENT_STYLE.reply;
  const isReply = event.type === 'reply';

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        gap: 14,
        padding: '18px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      {/* Icon / Avatar */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        {event.createdBy && isReply
          ? <Avatar email={event.createdBy.email} />
          : (
            <div
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: s.bg, border: `1.5px solid ${s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}
            >
              {s.icon}
            </div>
          )
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>
              {event.createdBy ? event.createdBy.email.split('@')[0] : 'System'}
            </span>
            {event.createdBy && (
              <span
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '.04em',
                  color: 'var(--c-primary)', background: 'var(--c-primary-light)',
                  padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase',
                }}
              >
                {event.createdBy.role}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--c-text-subtle)', whiteSpace: 'nowrap' }}>
            {fmt(event.createdAt)}
          </span>
        </div>

        <div
          style={{
            fontSize: 14,
            color: isReply ? 'var(--c-text)' : 'var(--c-text-muted)',
            background: isReply ? '#f8fafc' : 'transparent',
            border: isReply ? '1px solid var(--c-border)' : 'none',
            borderRadius: isReply ? 'var(--radius-md)' : 0,
            padding: isReply ? '12px 16px' : 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.65,
          }}
        >
          {event.message}
        </div>
      </div>
    </div>
  );
}

export function TicketDetail() {
  const { id }       = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const queryClient   = useQueryClient();
  const [assigneeId, setAssigneeId] = useState('');
  const [aiSummary, setAiSummary] = useState<{ summary: string; suggestedPriority: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ticket', id],
    queryFn:  () => getTicketDetails(id!),
    enabled:  !!id,
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    enabled: user?.role === 'admin',
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
  });

  /* ─ AI Draft Reply ─ */
  const draftMutation = useMutation({
    mutationFn: () => draftReply(id!),
    onSuccess: (data) => {
      setValue('message', data.draft, { shouldValidate: true });
    },
  });

  /* ─ AI Summarise ─ */
  const summariseMutation = useMutation({
    mutationFn: () => summariseTicket(id!),
    onSuccess: (data) => {
      setAiSummary(data);
    },
  });

  /* ─ Reply (optimistic) ─ */
  const replyMutation = useMutation({
    mutationFn: (message: string) => addReply(id!, message),
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', id] });
      const prev = queryClient.getQueryData<typeof data>(['ticket', id]);
      queryClient.setQueryData(['ticket', id], (old: typeof data) => {
        if (!old) return old;
        const opt: TicketEvent = {
          id: `opt-${Date.now()}`,
          ticketId: id!,
          type: 'reply',
          message,
          createdBy: user ? { _id: user.id, email: user.email, role: user.role } : null,
          createdAt: new Date().toISOString(),
        };
        return { ...old, timeline: [...old.timeline, opt] };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['ticket', id], ctx.prev);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
    onSuccess: () => reset(),
  });

  /* ─ Status change (optimistic) ─ */
  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => updateTicketStatus(id!, status),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', id] });
      const prev = queryClient.getQueryData<typeof data>(['ticket', id]);
      queryClient.setQueryData(['ticket', id], (old: typeof data) =>
        old ? { ...old, ticket: { ...old.ticket, status } } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['ticket', id], ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  /* ─ Assign ─ */
  const assignMutation = useMutation({
    mutationFn: () => assignTicket(id!, assigneeId.trim()),
    onSuccess: () => {
      setAssigneeId('');
      void queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  if (isLoading) return <Loader text="Loading ticket…" />;
  if (isError)   return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data)     return null;

  const { ticket, timeline } = data;

  return (
    <div className="fade-in" style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 22,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)',
          fontFamily: 'inherit', transition: 'color var(--transition)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-muted)'; }}
      >
        ← Back to Dashboard
      </button>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* Ticket header card */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.3, marginBottom: 10 }}>
                  {ticket.subject}
                </h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge value={ticket.status} />
                  <StatusBadge value={ticket.priority} />
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                fontSize: 14,
                color: 'var(--c-text)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {ticket.body}
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--c-border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <MetaItem label="From">
                {ticket.name} · <span style={{ color: 'var(--c-text-muted)' }}>{ticket.email}</span>
              </MetaItem>
              <MetaItem label="Created">{fmt(ticket.createdAt)}</MetaItem>
              <MetaItem label="Updated">{fmt(ticket.updatedAt)}</MetaItem>
            </div>
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: '4px 24px 4px' }}>
            <h2
              style={{
                fontSize: 14, fontWeight: 700, color: 'var(--c-text-muted)',
                textTransform: 'uppercase', letterSpacing: '.06em',
                padding: '18px 0 6px',
              }}
            >
              Activity Timeline
            </h2>
            {timeline.length === 0
              ? <p style={{ color: 'var(--c-text-subtle)', fontSize: 13, padding: '16px 0' }}>No activity yet.</p>
              : timeline.map((e) => <TimelineItem key={e.id} event={e} />)
            }
          </div>

          {/* Reply box */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--c-text)' }}>
              Add a Reply
            </h2>
            <form onSubmit={handleSubmit((d) => replyMutation.mutate(d.message))} noValidate>
              <textarea
                placeholder="Type your reply here…"
                rows={4}
                aria-invalid={!!errors.message}
                style={{ marginBottom: 4, resize: 'vertical', minHeight: 100 }}
                {...register('message')}
              />
              {errors.message && (
                <p role="alert" style={{ fontSize: 12, color: 'var(--c-danger)', marginBottom: 8 }}>
                  {errors.message.message}
                </p>
              )}
              {replyMutation.isError && (
                <p role="alert" style={{ fontSize: 13, color: 'var(--c-danger)', marginBottom: 8 }}>
                  Failed to submit. Please try again.
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <Button
                  type="button"
                  variant="ghost"
                  loading={draftMutation.isPending}
                  disabled={replyMutation.isPending}
                  onClick={() => void draftMutation.mutate()}
                  style={{ fontSize: 13 }}
                >
                  ✨ Draft with AI
                </Button>
                <Button type="submit" loading={replyMutation.isPending}>
                  Send Reply
                </Button>
              </div>
              {draftMutation.isPending && (
                <p style={{ fontSize: 12, color: 'var(--c-primary)', marginTop: 6, animation: 'pulse 1.5s ease-in-out infinite' }}>
                  AI is drafting a reply…
                </p>
              )}
              {draftMutation.isError && (
                <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 6 }}>
                  Failed to generate draft. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status & Assignee */}
          <div className="card" style={{ padding: 20 }}>
            <SidebarSection label="Change Status">
              <Select
                label=""
                options={STATUS_OPTIONS}
                value={ticket.status}
                disabled={statusMutation.isPending}
                onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
              />
              {statusMutation.isPending && (
                <p style={{ fontSize: 12, color: 'var(--c-text-subtle)', marginTop: 4 }}>Saving…</p>
              )}
            </SidebarSection>
          </div>

          {/* Assignee info */}
          <div className="card" style={{ padding: 20 }}>
            <SidebarSection label="Assignee">
              {ticket.assignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar email={ticket.assignee.email} size={32} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{ticket.assignee.email.split('@')[0]}</p>
                    <p style={{ fontSize: 11, color: 'var(--c-text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>
                      {ticket.assignee.role}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--c-text-subtle)', fontStyle: 'italic' }}>Unassigned</p>
              )}
            </SidebarSection>

            {/* Reassign — admin only */}
            {user?.role === 'admin' && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--c-border)' }}>
                <SidebarSection label="Reassign Ticket">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Select
                      label=""
                      options={[
                        { value: '', label: 'Select an agent...' },
                        ...(agents?.map(a => ({ value: a.id, label: `${a.email} (${a.role})` })) || [])
                      ]}
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={assignMutation.isPending}
                      disabled={!assigneeId.trim()}
                      onClick={() => void assignMutation.mutate()}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Assign
                    </Button>
                    {assignMutation.isError && (
                      <p style={{ fontSize: 12, color: 'var(--c-danger)' }}>Failed to assign.</p>
                    )}
                  </div>
                </SidebarSection>
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="card" style={{ padding: 20 }}>
            <SidebarSection label="✨ AI Insights">
              {aiSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.6 }}>
                    {aiSummary.summary}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 600 }}>Suggested Priority:</span>
                    <StatusBadge value={aiSummary.suggestedPriority as TicketPriority} showDot={false} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void summariseMutation.mutate()}
                    loading={summariseMutation.isPending}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  >
                    Regenerate
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--c-text-subtle)' }}>
                    Get an AI-generated summary and priority suggestion.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={summariseMutation.isPending}
                    onClick={() => void summariseMutation.mutate()}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    ✨ Summarise
                  </Button>
                  {summariseMutation.isError && (
                    <p style={{ fontSize: 12, color: 'var(--c-danger)' }}>Failed to summarise.</p>
                  )}
                </div>
              )}
            </SidebarSection>
          </div>

          {/* Meta info */}
          <div className="card" style={{ padding: 20 }}>
            <SidebarSection label="Ticket Info">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MetaRow label="ID">
                  <code style={{ fontSize: 11, fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: 3, wordBreak: 'break-all' }}>
                    {ticket.id}
                  </code>
                </MetaRow>
                <MetaRow label="Status"><StatusBadge value={ticket.status} showDot={false} /></MetaRow>
                <MetaRow label="Priority"><StatusBadge value={ticket.priority} showDot={false} /></MetaRow>
                <MetaRow label="Events">{timeline.length} event{timeline.length !== 1 ? 's' : ''}</MetaRow>
              </div>
            </SidebarSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--c-text)' }}>{children}</p>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13 }}>{children}</span>
    </div>
  );
}

import React from 'react';
