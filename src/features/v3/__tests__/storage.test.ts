// Unit tests for the storage-layer duplicate classifier. The supabase client
// is globally mocked in src/test/setup.ts, so importing storage.ts here pulls
// in the mock — these tests exercise the pure isDuplicateKeyError() helper only,
// with no live database.

import { describe, expect, it } from 'vitest';
import { isDuplicateKeyError, toError } from '../lib/storage';

// supabase-js throws a PostgrestError, which extends Error and carries the raw
// Postgres message in `.message`. Reproduce that shape so the test reflects the
// real swallow-vs-rethrow path in insertAssumptionsIgnoringDuplicates().
class PostgrestErrorLike extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PostgrestError';
  }
}

describe('isDuplicateKeyError', () => {
  it('matches the full Postgres unique-violation message (PostgrestError shape)', () => {
    const e = new PostgrestErrorLike(
      'duplicate key value violates unique constraint "uq_pivotkit_assumptions_spawned_rule"',
    );
    expect(isDuplicateKeyError(e)).toBe(true);
  });

  it('matches either fragment on its own', () => {
    expect(isDuplicateKeyError(new Error('duplicate key'))).toBe(true);
    expect(isDuplicateKeyError(new Error('violates unique constraint foo'))).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isDuplicateKeyError(new Error('DUPLICATE KEY VALUE'))).toBe(true);
    expect(isDuplicateKeyError(new Error('UNIQUE CONSTRAINT'))).toBe(true);
  });

  it('returns false for unrelated errors (these must rethrow, not be swallowed)', () => {
    expect(isDuplicateKeyError(new Error('permission denied for table pivotkit_assumptions'))).toBe(false);
    expect(isDuplicateKeyError(new Error('null value in column violates not-null constraint'))).toBe(false);
    expect(isDuplicateKeyError(new Error('network request failed'))).toBe(false);
  });

  it('classifies a raw string by its content', () => {
    expect(isDuplicateKeyError('duplicate key value')).toBe(true);
    expect(isDuplicateKeyError('some other failure')).toBe(false);
  });

  it('does not match a plain object whose message mentions a duplicate but has no code', () => {
    // Without a Postgres code, only Error.message and raw strings are inspected;
    // a bare object stringifies to "[object Object]" and is not an Error.
    expect(isDuplicateKeyError({ message: 'duplicate key' })).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
    expect(isDuplicateKeyError(undefined)).toBe(false);
  });

  it('matches the real production shape: a plain PostgrestError object with code 23505', () => {
    // In production supabase-js surfaces `error` as a PLAIN object (not an Error),
    // so String(e) === "[object Object]" and the message regex never fires — the
    // reason a promoted duplicate escaped as an unhandled rejection. The SQLSTATE
    // code is the reliable signal.
    const e = { code: '23505', details: 'Key (…) already exists.', hint: null, message: '' };
    expect(isDuplicateKeyError(e)).toBe(true);
  });

  it('returns false for a plain PostgrestError object with a non-duplicate code', () => {
    expect(isDuplicateKeyError({ code: '42501', message: 'permission denied' })).toBe(false);
  });
});

describe('toError', () => {
  it('wraps a plain PostgrestError object into a real Error, preserving message + code', () => {
    const raw = { code: '23505', details: 'dup', hint: 'h', message: 'duplicate key value' };
    const err = toError(raw) as Error & { code?: string; details?: string; hint?: string };
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('duplicate key value');
    expect(err.code).toBe('23505');
    expect(err.details).toBe('dup');
    expect(err.hint).toBe('h');
  });

  it('passes Error instances through unchanged', () => {
    const original = new Error('boom');
    expect(toError(original)).toBe(original);
  });

  it('falls back to a generic message when the object has no message', () => {
    expect(toError({ code: '500' }).message).toBe('Supabase request failed');
    expect(toError('some string').message).toBe('some string');
  });
});
