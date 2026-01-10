import { AuthUserFactory } from './AuthUserFactory';

describe('AuthUserFactory', () => {
  it('should create AuthUser from valid input', () => {
    const input = { id: 'abc123', displayName: 'Max', email: 'max@example.com', photoURL: 'url' };
    const user = AuthUserFactory.create(input);
    expect(user.id).toBe('abc123');
    expect(user.displayName).toBe('Max');
    expect(user.email).toBe('max@example.com');
    expect(user.photoURL).toBe('url');
  });

  it('should accept uid as id', () => {
    const input = { uid: 'u42', displayName: null, email: null, photoURL: null };
    const user = AuthUserFactory.create(input);
    expect(user.id).toBe('u42');
  });

  it('should throw for missing id/uid', () => {
    expect(() => AuthUserFactory.create({})).toThrow();
  });
});
