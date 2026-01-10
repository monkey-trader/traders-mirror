import { AuthError, AuthNotAuthenticatedError, AuthProviderError } from './AuthError';

describe('AuthError', () => {
  it('should set name and message', () => {
    const err = new AuthError('fail');
    expect(err.name).toBe('AuthError');
    expect(err.message).toBe('fail');
  });
});

describe('AuthNotAuthenticatedError', () => {
  it('should set name and default message', () => {
    const err = new AuthNotAuthenticatedError();
    expect(err.name).toBe('AuthNotAuthenticatedError');
    expect(err.message).toMatch(/not authenticated/i);
  });
});

describe('AuthProviderError', () => {
  it('should set name and custom message', () => {
    const err = new AuthProviderError('provider fail');
    expect(err.name).toBe('AuthProviderError');
    expect(err.message).toBe('provider fail');
  });
});
