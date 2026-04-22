import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { createTicket } from '@/api/tickets';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorState } from '@/components/ui/ErrorState';

const schema = z.object({
  name:     z.string().trim().min(1, 'Name is required').max(120),
  email:    z.string().email('Enter a valid email address').max(200),
  subject:  z.string().trim().min(1, 'Subject is required').max(200),
  body:     z.string().trim().min(10, 'Please describe your issue in at least 10 characters').max(10_000),
  priority: z.enum(['low', 'medium', 'high']),
});

type FormValues = z.infer<typeof schema>;

const priorityOptions = [
  { value: 'low',    label: '🟢  Low — general question' },
  { value: 'medium', label: '🟡  Medium — needs attention' },
  { value: 'high',   label: '🔴  High — urgent issue' },
];

const fieldSectionStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 20,
};

export function TicketSubmission() {
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => { setSubmittedId(ticket.id); reset(); },
  });

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Support Portal
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--c-text)', lineHeight: 1.2 }}>
          How can we help you?
        </h1>
        <p style={{ marginTop: 10, color: 'var(--c-text-muted)', fontSize: 15 }}>
          Fill out the form below and our team will get back to you shortly.
        </p>
      </div>

      {/* Success banner */}
      {submittedId && (
        <div
          className="slide-in"
          style={{
            background: 'var(--c-success-light)',
            border: '1.5px solid #86efac',
            borderRadius: 'var(--radius-md)',
            padding: '18px 22px',
            marginBottom: 28,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 24, flexShrink: 0 }}>✅</span>
          <div>
            <p style={{ fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
              Ticket submitted successfully!
            </p>
            <p style={{ fontSize: 13, color: '#166534' }}>
              Your ticket ID is{' '}
              <code
                style={{
                  background: '#bbf7d0', padding: '2px 8px',
                  borderRadius: 4, fontWeight: 700, fontFamily: 'monospace',
                }}
              >
                {submittedId}
              </code>
              . Save it to check your status later.
            </p>
            <button
              onClick={() => setSubmittedId(null)}
              style={{
                marginTop: 10, fontSize: 12, color: '#15803d', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
                fontFamily: 'inherit',
              }}
            >
              Submit another ticket
            </button>
          </div>
        </div>
      )}

      {/* Form card */}
      <div
        className="card"
        style={{ padding: '32px 36px' }}
      >
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate style={fieldSectionStyle}>
          {/* Row: name + email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Full Name"
              placeholder="Jane Doe"
              autoComplete="name"
              error={errors.name?.message}
              icon={<PersonIcon />}
              {...register('name')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              autoComplete="email"
              error={errors.email?.message}
              icon={<MailIcon />}
              {...register('email')}
            />
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            placeholder="Brief description of your issue"
            error={errors.subject?.message}
            {...register('subject')}
          />

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '.01em' }}>
              Description
            </label>
            <textarea
              placeholder="Describe your issue in as much detail as possible — include steps to reproduce, error messages, etc."
              rows={6}
              aria-invalid={!!errors.body}
              style={{ resize: 'vertical', minHeight: 120 }}
              {...register('body')}
            />
            {errors.body && (
              <span role="alert" style={{ fontSize: 12, color: 'var(--c-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <InfoCircle size={12} /> {errors.body.message}
              </span>
            )}
          </div>

          {/* Priority */}
          <Select
            label="Priority"
            options={priorityOptions}
            error={errors.priority?.message}
            {...register('priority')}
          />

          {mutation.isError && (
            <ErrorState error={mutation.error} compact />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <Button type="submit" loading={mutation.isPending} size="lg">
              Submit Ticket →
            </Button>
          </div>
        </form>
      </div>

      {/* Trust indicators */}
      <div
        style={{
          display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { icon: '⚡', text: 'Typically responds within 24 hours' },
          { icon: '🔒', text: 'Your data is kept private' },
          { icon: '📧', text: 'Track status with your ticket ID' },
        ].map((item) => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--c-text-muted)' }}>
            <span>{item.icon}</span> {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Micro icons ─── */
function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}
function InfoCircle({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

import React from 'react';
