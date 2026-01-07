import { useEffect, useState } from 'react';
import { onUserChanged, signInWithGoogle, signOutUser, getCurrentUser } from '@/infrastructure/firebase/firebaseAuth';
import type { User } from 'firebase/auth';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());

  useEffect(() => {
    const unsub = onUserChanged(setUser);
    return () => unsub();
  }, []);

  return {
    user,
    signIn: signInWithGoogle,
    signOut: signOutUser,
  };
}
