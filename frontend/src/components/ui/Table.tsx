import { ReactNode, useState } from 'react';

export interface Column<T> {
  key:      string;
  header:   string;
  render:   (row: T) => ReactNode;
  width?:   string | number;
  align?:   'left' | 'right' | 'center';
}

interface TableProps<T> {
  columns:    Column<T>[];
  data:       T[];
  rowKey:     (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({ columns, data, rowKey, onRowClick }: TableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--c-thead-bg)', borderBottom: '1px solid var(--c-border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '12px 16px',
                  textAlign: col.align ?? 'left',
                  fontWeight: 600,
                  color: 'var(--c-text-muted)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const key = rowKey(row);
            const isHovered = hoveredRow === key;
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onMouseEnter={() => setHoveredRow(key)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  borderBottom: '1px solid var(--c-border)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  background: isHovered ? 'var(--c-row-hover)' : 'transparent',
                  transition: 'background var(--transition)',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '13px 16px',
                      color: 'var(--c-text)',
                      textAlign: col.align ?? 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
