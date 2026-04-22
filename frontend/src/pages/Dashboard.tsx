import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listTickets, ListTicketsParams } from '@/api/tickets';
import { useAuth } from '@/context/AuthContext';
import { Ticket, TicketPriority, TicketStatus } from '@/types';
import { Table, Column } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const STATUS_OPTIONS:   { value: string; label: string }[] = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed',      label: 'Closed' },
];
const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="card"
      style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4, borderLeft: `4px solid ${color}` }}
    >
      <span style={{ fontSize: 26, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}
      </span>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [filters, setFilters] = useState<ListTicketsParams>({ page: 1, limit: 20 });
  const [search,  setSearch]  = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => listTickets(filters),
  });

  // Quick-stats queries
  const { data: openData }   = useQuery({ queryKey: ['tickets', { status: 'open',        limit: 1 }], queryFn: () => listTickets({ status: 'open',        limit: 1 }) });
  const { data: ipData }     = useQuery({ queryKey: ['tickets', { status: 'in_progress', limit: 1 }], queryFn: () => listTickets({ status: 'in_progress', limit: 1 }) });
  const { data: closedData } = useQuery({ queryKey: ['tickets', { status: 'closed',      limit: 1 }], queryFn: () => listTickets({ status: 'closed',      limit: 1 }) });

  const set = <K extends keyof ListTicketsParams>(k: K, v: ListTicketsParams[K]) =>
    setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    set('search', search.trim() || undefined);
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 });
    setSearch('');
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'subject',
      header: 'Subject',
      render: (t) => (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--c-text)', marginBottom: 2 }}>{t.subject}</p>
          <p style={{ fontSize: 12, color: 'var(--c-text-subtle)' }}>
            {t.name} · {t.email}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (t) => <StatusBadge value={t.status} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      width: 110,
      render: (t) => <StatusBadge value={t.priority} />,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      width: 160,
      render: (t) => t.assignee
        ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--c-primary)', flexShrink: 0 }}>
              {t.assignee.email[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 13 }}>{t.assignee.email.split('@')[0]}</span>
          </div>
        )
        : <span style={{ fontSize: 12, color: 'var(--c-text-subtle)', fontStyle: 'italic' }}>Unassigned</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      width: 110,
      render: (t) => <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{fmt(t.createdAt)}</span>,
    },
  ];

  return (
    <div className="fade-in">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
          {user?.role === 'admin' ? 'Admin View' : 'Agent View'}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em' }}>
          {user?.role === 'admin' ? 'All Tickets' : 'My Assigned Tickets'}
        </h1>
      </div>

      {/* Stats row */}
      {user?.role === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Open"        value={openData?.total   ?? 0} color="#3b82f6" />
          <StatCard label="In Progress" value={ipData?.total     ?? 0} color="#eab308" />
          <StatCard label="Closed"      value={closedData?.total ?? 0} color="#22c55e" />
          <StatCard label="Total"       value={(openData?.total ?? 0) + (ipData?.total ?? 0) + (closedData?.total ?? 0)} color="var(--c-primary)" />
        </div>
      )}

      {/* Filter bar */}
      <div
        className="card"
        style={{
          padding: '14px 20px', marginBottom: 18,
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end',
        }}
      >
        <div style={{ minWidth: 140 }}>
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={(filters.status as string) ?? ''}
            onChange={(e) => set('status', (e.target.value as TicketStatus) || undefined)}
          />
        </div>
        <div style={{ minWidth: 130 }}>
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            placeholder="All priorities"
            value={(filters.priority as string) ?? ''}
            onChange={(e) => set('priority', (e.target.value as TicketPriority) || undefined)}
          />
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flex: 1, minWidth: 220 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '.01em' }}>
              Search
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Search subject or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="secondary">Search</Button>
            </div>
          </div>
        </form>
        <Button variant="ghost" size="sm" onClick={clearFilters} style={{ alignSelf: 'flex-end', paddingBottom: 9 }}>
          Clear
        </Button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading && <Loader text="Fetching tickets…" />}
        {isError   && <ErrorState error={error} onRetry={() => void refetch()} />}
        {data && data.items.length === 0 && (
          <EmptyState
            emoji="🔍"
            title="No tickets found"
            description="Try adjusting your filters or search query."
            action={<Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>}
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <Table
              columns={columns}
              data={data.items}
              rowKey={(t) => t.id}
              onRowClick={(t) => navigate(`/tickets/${t.id}`)}
            />
            {/* Table footer */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--c-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--c-surface-2)',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                Showing {(((filters.page ?? 1) - 1) * 20) + 1}–
                {Math.min((filters.page ?? 1) * 20, data.total)} of {data.total} tickets
              </span>
              {data.totalPages > 1 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button
                    variant="secondary" size="sm"
                    disabled={filters.page === 1}
                    onClick={() => set('page', (filters.page ?? 1) - 1)}
                  >
                    ← Prev
                  </Button>
                  <span style={{ fontSize: 13, color: 'var(--c-text-muted)', padding: '0 4px' }}>
                    {filters.page} / {data.totalPages}
                  </span>
                  <Button
                    variant="secondary" size="sm"
                    disabled={filters.page === data.totalPages}
                    onClick={() => set('page', (filters.page ?? 1) + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React from 'react';
