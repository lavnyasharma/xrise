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
          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid var(--c-border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '11px 18px',
                  textAlign: col.align ?? 'left',
                  fontWeight: 700,
                  color: 'var(--c-text-muted)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
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
                  borderBottom: '1px solid #f1f5f9',
                  cursor: onRowClick ? 'pointer' : 'default',
                  background: isHovered ? '#f8fafc' : 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '14px 18px',
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
