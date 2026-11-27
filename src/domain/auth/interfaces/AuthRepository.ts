export type AuthUser = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

export type AuthRepository = {
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
};
