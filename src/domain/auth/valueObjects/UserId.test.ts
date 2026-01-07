import { UserId } from './UserId';

describe('UserId', () => {
  it('should create a valid UserId', () => {
    const id = new UserId('abc123');
    expect(id.value).toBe('abc123');
  });

  it('should trim whitespace', () => {
    const id = new UserId('  user42  ');
    expect(id.value).toBe('user42');
  });

  it('should throw for empty string', () => {
    expect(() => new UserId('')).toThrow();
  });

  it('should throw for too short', () => {
    expect(() => new UserId('a')).toThrow();
  });
});
