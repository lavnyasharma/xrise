import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { getPublicStatus } from '@/api/tickets';
import { PublicTicketStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorState } from '@/components/ui/ErrorState';

const schema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  email:    z.string().email('Enter the email used when submitting'),
});
type FormValues = z.infer<typeof schema>;

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function ProgressBar({ status }: { status: PublicTicketStatus['status'] }) {
  const steps = ['open', 'in_progress', 'closed'] as const;
  const idx   = steps.indexOf(status);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        {steps.map((s, i) => (
          <span
            key={s}
            style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
              color: i <= idx ? 'var(--c-primary)' : 'var(--c-text-subtle)',
            }}
          >
            {s.replace('_', ' ')}
          </span>
        ))}
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: status === 'open' ? '15%' : status === 'in_progress' ? '55%' : '100%',
            background: 'linear-gradient(90deg, var(--c-primary), #818cf8)',
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

function StatusCard({ status }: { status: PublicTicketStatus }) {
  return (
    <div className="card slide-in" style={{ padding: 28, marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
            Your ticket
          </p>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.3, maxWidth: 380 }}>
            {status.subject}
          </h2>
        </div>
        <StatusBadge value={status.status} />
      </div>

      <ProgressBar status={status.status} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 16,
          marginTop: 22,
          paddingTop: 20,
          borderTop: '1px solid var(--c-border)',
        }}
      >
        <MetaCell label="Priority">
          <StatusBadge value={status.priority} />
        </MetaCell>
        <MetaCell label="Submitted">{fmt(status.createdAt)}</MetaCell>
        <MetaCell label="Last Updated">{fmt(status.updatedAt)}</MetaCell>
      </div>

      <div
        style={{
          marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--c-text-subtle)', fontWeight: 500 }}>Ticket ID:</span>
        <code
          style={{
            fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
            background: '#f1f5f9', padding: '2px 8px', borderRadius: 4,
            color: 'var(--c-text-muted)',
          }}
        >
          {status.id}
        </code>
      </div>
    </div>
  );
}

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>
        {label}
      </p>
      <div style={{ fontSize: 13, color: 'var(--c-text)', fontWeight: 500 }}>{children}</div>
    </div>
  );
}

export function TicketStatus() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: ({ ticketId, email }: FormValues) => getPublicStatus(ticketId, email),
  });

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Ticket Lookup
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.2 }}>
          Check your ticket status
        </h1>
        <p style={{ marginTop: 10, color: 'var(--c-text-muted)', fontSize: 15 }}>
          Enter the ticket ID from your submission confirmation.
        </p>
      </div>

      {/* Lookup card */}
      <div className="card" style={{ padding: '28px 32px' }}>
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <Input
            label="Ticket ID"
            placeholder="e.g. 66a1b2c3d4e5f6a7b8c9d0e1"
            error={errors.ticketId?.message}
            icon={<HashIcon />}
            {...register('ticketId')}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="The email you submitted the ticket with"
            error={errors.email?.message}
            icon={<MailIcon />}
            {...register('email')}
          />
          {mutation.isError && <ErrorState error={mutation.error} compact />}
          <Button type="submit" loading={mutation.isPending} size="lg">
            Look up ticket
          </Button>
        </form>
      </div>

      {mutation.data && <StatusCard status={mutation.data} />}
    </div>
  );
}

function HashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
}
function MailIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}

import React from 'react';
