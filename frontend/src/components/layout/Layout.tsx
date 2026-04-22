import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        className={isLogin ? undefined : 'fade-in'}
        style={
          isLogin
            ? {
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
              }
            : {
                flex: 1,
                maxWidth: 1160,
                width: '100%',
                margin: '0 auto',
                padding: '40px 28px 80px',
              }
        }
      >
        <Outlet />
      </main>

      {!isLogin && (
        <footer
          style={{
            textAlign: 'center',
            padding: '16px 24px',
            borderTop: '1px solid var(--c-border)',
            fontSize: 12,
            color: 'var(--c-text-subtle)',
            background: 'var(--c-surface)',
            flexShrink: 0,
          }}
        >
          helpdesk · Support portal
        </footer>
      )}
    </div>
  );
}
