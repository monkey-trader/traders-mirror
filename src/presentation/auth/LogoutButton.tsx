import React from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/presentation/shared/components/Button/Button';

export const LogoutButton: React.FC = () => {
  const { signOut, loading } = useAuth();
  return (
    <Button onClick={signOut} disabled={loading} variant="danger">
      {loading ? 'Abmelden...' : 'Logout'}
    </Button>
  );
};
