
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const navigate = useNavigate();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        background: 'var(--c-navbar-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--c-border)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        flexShrink: 0,
        gap: 16,
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, var(--c-primary), var(--c-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(76,154,255,0.4)',
          }}
        >
          🎟
        </span>
        <span style={{
          fontWeight: 800, fontSize: 16,
          color: 'var(--c-text)',
          letterSpacing: '-0.03em',
        }}>
          helpdesk
        </span>
      </Link>

      {/* Desktop nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <NavItem to="/">Submit Ticket</NavItem>
        <NavItem to="/status">Check Status</NavItem>
        {isAuthenticated && <NavItem to="/dashboard">Dashboard</NavItem>}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isAuthenticated ? (
          <>
            {/* User pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--c-primary), var(--c-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                }}
              >
                {user?.email[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>
                  {user?.email.split('@')[0]}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', color: 'var(--c-primary)', textTransform: 'uppercase' }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <NavbarButton
              onClick={handleLogout}
              hoverColor="var(--c-danger)"
              hoverBg="var(--c-danger-light)"
            >
              Sign out
            </NavbarButton>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              padding: '6px 16px',
              fontSize: 13, fontWeight: 700,
              background: 'var(--c-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'background var(--transition), box-shadow var(--transition)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'var(--c-primary-h)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 12px rgba(76,154,255,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'var(--c-primary)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
            }}
          >
            Agent Login
          </Link>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--c-surface-2)',
            border: '1px solid var(--c-border)',
            cursor: 'pointer',
            color: 'var(--c-text-muted)',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c-primary-light)';
            e.currentTarget.style.borderColor = 'var(--c-primary)';
            e.currentTarget.style.color = 'var(--c-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--c-surface-2)';
            e.currentTarget.style.borderColor = 'var(--c-border)';
            e.currentTarget.style.color = 'var(--c-text-muted)';
          }}
          aria-label="Toggle theme"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}

// Small reusable navbar button
function NavbarButton({
  onClick, children, hoverColor, hoverBg,
}: {
  onClick: () => void;
  children: React.ReactNode;
  hoverColor: string;
  hoverBg: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', fontSize: 13, fontWeight: 600,
        background: 'transparent',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius-md)', cursor: 'pointer',
        color: 'var(--c-text-muted)', fontFamily: 'inherit',
        transition: 'all var(--transition)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverColor;
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-border)';
        e.currentTarget.style.color = 'var(--c-text-muted)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        padding: '5px 12px',
        fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: isActive ? 'var(--c-primary)' : 'var(--c-text-muted)',
        background: isActive ? 'var(--c-primary-light)' : 'transparent',
        transition: 'all var(--transition)',
      })}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (!el.getAttribute('aria-current')) {
          el.style.color = 'var(--c-text)';
          el.style.background = 'var(--c-surface-3)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (!el.getAttribute('aria-current')) {
          el.style.color = 'var(--c-text-muted)';
          el.style.background = 'transparent';
        }
      }}
    >
      {children}
    </NavLink>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

import React from 'react';
