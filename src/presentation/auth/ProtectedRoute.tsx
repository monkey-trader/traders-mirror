import React from 'react';
import { useAuth } from './AuthProvider';
import { LoginButton } from './LoginButton';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <p>Bitte einloggen, um fortzufahren.</p>
        <LoginButton />
      </div>
    );
  }
  return <>{children}</>;
};
