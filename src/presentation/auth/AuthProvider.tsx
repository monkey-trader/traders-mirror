import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '@/domain/auth/interfaces/AuthRepository';
import { AuthService } from '@/application/auth/services/AuthService';
import { FirebaseAuthRepository } from '@/infrastructure/auth/repositories/FirebaseAuthRepository';
import { InMemoryAuthRepository } from '@/infrastructure/auth/repositories/InMemoryAuthRepository';

const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  // Vitest provides import.meta.env.MODE === 'test'
  (typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env?.MODE === 'test');

const selectedRepo = isTestEnv ? new InMemoryAuthRepository() : new FirebaseAuthRepository();
const authService = new AuthService(selectedRepo);

export type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  error?: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = authService.onAuthStateChanged((u) => {
      setUser(u);
      setError(null);
      setLoading(false);
    });
    return () => {
      try {
        unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      const u = await authService.signInWithGoogle();
      setUser(u);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setError(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signIn, signOut, clearError: () => setError(null) }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
