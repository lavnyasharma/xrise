import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        className="fade-in"
        style={{
          flex: 1,
          maxWidth: 1140,
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        <Outlet />
      </main>
      <footer
        style={{
          textAlign: 'center',
          padding: '18px 24px',
          borderTop: '1px solid var(--c-border)',
          fontSize: 12,
          color: 'var(--c-text-subtle)',
          background: 'var(--c-surface)',
        }}
      >
        Mini Helpdesk · Support portal
      </footer>
    </div>
  );
}
