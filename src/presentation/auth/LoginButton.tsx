import React from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/presentation/shared/components/Button/Button';

export const LoginButton: React.FC = () => {
  const { signIn, loading, error, clearError } = useAuth();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <Button
        onClick={() => {
          clearError();
          void signIn();
        }}
        disabled={loading}
        variant="primary"
      >
        {loading ? 'Loading...' : 'Login mit Google'}
      </Button>
      {error ? (
        <div
          role="alert"
          style={{ color: '#c62828', fontSize: 14, maxWidth: 420, textAlign: 'center' }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
};
