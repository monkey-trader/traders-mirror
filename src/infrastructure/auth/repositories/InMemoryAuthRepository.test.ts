import { describe, it, expect } from 'vitest';
import { InMemoryAuthRepository } from './InMemoryAuthRepository';

describe('InMemoryAuthRepository', () => {
  it('signInWithGoogle sets deterministic user and onAuthStateChanged notifies', async () => {
    const repo = new InMemoryAuthRepository();
    let seen = null as unknown;
    repo.onAuthStateChanged((u) => (seen = u));
    expect(seen).toBeNull();
    const user = await repo.signInWithGoogle();
    expect(user.displayName).toBe('Test User');
    let after: unknown = null;
    repo.onAuthStateChanged((u) => (after = u));
    expect((after as { displayName: string } | null)?.displayName).toBe('Test User');
  });

  it('signOut clears current user', async () => {
    const repo = new InMemoryAuthRepository();
    await repo.signInWithGoogle();
    await repo.signOut();
    const u = await repo.getCurrentUser();
    expect(u).toBeNull();
  });
});
