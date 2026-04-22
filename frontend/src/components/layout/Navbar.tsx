import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const {  setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        background: 'var(--c-glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--c-border)',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        transition: 'background var(--transition), border-color var(--transition)',
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          textDecoration: 'none', flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--c-primary), #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: 'var(--shadow-sm)',
          }}
        >
          🎟
        </span>
        <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--c-text)', letterSpacing: '-.02em' }}>
          helpdesk
        </span>
      </Link>

      {/* Desktop nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavItem to="/">Submit Ticket</NavItem>
        <NavItem to="/status">Check Status</NavItem>
        {isAuthenticated && <NavItem to="/dashboard">Dashboard</NavItem>}
      </nav>

      {/* Auth area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {isAuthenticated ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                }}
              >
                {user?.email[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>
                  {user?.email.split('@')[0]}
                </span>
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '.04em',
                    color: 'var(--c-primary)', textTransform: 'uppercase',
                  }}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                borderRadius: 'var(--radius-full)', cursor: 'pointer',
                color: 'var(--c-text-muted)', fontFamily: 'inherit',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-danger)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-danger)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-muted)'; }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              padding: '7px 16px', fontSize: 13, fontWeight: 600,
              background: 'var(--c-primary)', color: '#fff',
              borderRadius: 'var(--radius-full)', textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)', transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--c-primary-h)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--c-primary)'; }}
          >
            Agent Login
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--c-text-muted)', transition: 'all var(--transition)',
            marginLeft: 8
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-border)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>

      <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none' }}>☰</button>
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        padding: '6px 12px',
        fontSize: 14,
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        textDecoration: 'none',
        color: isActive ? 'var(--c-primary)' : 'var(--c-text-muted)',
        background: isActive ? 'var(--c-primary-light)' : 'transparent',
        transition: 'all var(--transition)',
      })}
    >
      {children}
    </NavLink>
  );
}

import React from 'react';
