import { extractErrorMessage } from './http-error.util';

describe('extractErrorMessage', () => {
  it('should return fallback when error is null', () => {
    expect(extractErrorMessage(null, 'fallback')).toBe('fallback');
  });

  it('should return fallback when error is undefined', () => {
    expect(extractErrorMessage(undefined, 'fallback')).toBe('fallback');
  });

  it('should return fallback when error.error is missing', () => {
    expect(extractErrorMessage({}, 'fallback')).toBe('fallback');
  });

  it('should return fallback when error.error is a string (not object)', () => {
    expect(extractErrorMessage({ error: 'plain string' }, 'fallback')).toBe('fallback');
  });

  it('should return message from error.error.message', () => {
    const err = { error: { message: 'Server Error' } };
    expect(extractErrorMessage(err, 'fallback')).toBe('Server Error');
  });

  it('should return fallback when error.error.message is empty/whitespace', () => {
    const err = { error: { message: '   ' } };
    expect(extractErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('should return fallback when error.error.message is not a string', () => {
    const err = { error: { message: 42 } };
    expect(extractErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('should return joined field messages when no message key', () => {
    const err = { error: { field1: 'Name is required', field2: 'Email is invalid' } };
    const result = extractErrorMessage(err, 'fallback');
    expect(result).toContain('Name is required');
    expect(result).toContain('Email is invalid');
  });

  it('should skip whitespace-only field values when joining', () => {
    const err = { error: { field1: '  ', field2: 'Email is invalid' } };
    const result = extractErrorMessage(err, 'fallback');
    expect(result).toBe('Email is invalid');
  });

  it('should return fallback when error.error is empty object', () => {
    const err = { error: {} };
    expect(extractErrorMessage(err, 'fallback')).toBe('fallback');
  });

  it('should return fallback when all field values are non-string', () => {
    const err = { error: { code: 404, retryable: true } };
    expect(extractErrorMessage(err, 'fallback')).toBe('fallback');
  });
});
