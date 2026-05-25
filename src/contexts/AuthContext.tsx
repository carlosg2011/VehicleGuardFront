import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser } from '../types';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseToken(token: string): AuthUser {
  const payload = jwtDecode<JwtPayload>(token);
  return {
    id: Number(payload.sub),
    nome: payload.name,
    email: payload.email,
    role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem('token');
    return t ? parseToken(t) : null;
  });

  const signIn = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(parseToken(newToken));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isAdmin: user?.role === 'Admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
