// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AuthStateProvider({ children }) {
  const [sessionUser, setSessionUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshSession() {
    setIsLoading(true);

    try {
      const res = await fetch('/api/session');

      if (res.status === 401) {
        setSessionUser(null);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load session (${res.status})`);
      }

      const body = await res.json();
      setSessionUser(body.user ?? null);
    } catch (err) {
      console.error('[Auth] Session load failed:', err);
      setSessionUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  const user = useMemo(() => {
    if (!sessionUser) return null;

    return {
      name: sessionUser.name ?? sessionUser.email,
      email: sessionUser.email,
      initials: getInitials(sessionUser.name ?? sessionUser.email),
    };
  }, [sessionUser]);

  function login(returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    const params = new URLSearchParams();
    if (returnTo) params.set('returnTo', returnTo);
    window.location.assign(`/auth/login${params.size ? `?${params.toString()}` : ''}`);
  }

  async function logout() {
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('[Auth] Logout failed:', err);
    } finally {
      setSessionUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthStateProvider');
  return ctx;
}
