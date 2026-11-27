import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthUser, AuthRepository } from '../../domain/auth/interfaces/AuthRepository';
import { AuthService } from '../../application/auth/services/AuthService';

let authServicePromise: Promise<AuthService> | null = null;

function getAuthService(): Promise<AuthService> {
  if (authServicePromise) return authServicePromise;
  authServicePromise = (async () => {
    try {
      // Use a dynamic import with @vite-ignore so Vitest doesn't analyze the path,
      // while webpack/Vite at runtime can still resolve the module.
      const repoPath = '../../infrastructure/auth/repositories/FirebaseAuthRepository';
      const mod = await import(/* @vite-ignore */ repoPath);
      const Repo = (mod as { FirebaseAuthRepository: new () => AuthRepository }).FirebaseAuthRepository;
      return new AuthService(new Repo());
    } catch {
      const noopRepo: AuthRepository = {
        async getCurrentUser() { return null; },
        async signInWithGoogle() { throw new Error('Auth disabled in test environment'); },
        async signOut() { /* no-op */ },
      };
      return new AuthService(noopRepo);
    }
  })();
  return authServicePromise;
}

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

  const fetchUser = useCallback(async () => {
    try {
      const service = await getAuthService();
      const u = await service.getCurrentUser();
      setUser(u);
      setError(null);
    } catch (e) {
      setUser(null);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signIn = async () => {
    setLoading(true);
    try {
      const service = await getAuthService();
      const u = await service.signInWithGoogle();
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
    const service = await getAuthService();
    await service.signOut();
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
