import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthUser } from '@/types';
import { decodeUser, getToken, removeToken, saveToken } from '@/utils/token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getToken();
    return t ? decodeUser(t) : null;
  });

  useEffect(() => {
    // Re-hydrate on mount in case token was saved by another tab
    const t = getToken();
    if (t && !user) {
      const decoded = decodeUser(t);
      if (decoded) {
        setToken(t);
        setUser(decoded);
      } else {
        removeToken();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setAuth = useCallback((newToken: string, newUser: AuthUser) => {
    saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!user, setAuth, logout }),
    [user, token, setAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
