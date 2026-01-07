// Domain Error: AuthError
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthNotAuthenticatedError extends AuthError {
  constructor() {
    super('User is not authenticated');
    this.name = 'AuthNotAuthenticatedError';
  }
}

export class AuthProviderError extends AuthError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthProviderError';
  }
}
