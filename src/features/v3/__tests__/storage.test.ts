// Unit tests for the storage-layer duplicate classifier. The supabase client
// is globally mocked in src/test/setup.ts, so importing storage.ts here pulls
// in the mock — these tests exercise the pure isDuplicateKeyError() helper only,
// with no live database.

import { describe, expect, it } from 'vitest';
import { isDuplicateKeyError } from '../lib/storage';

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

  it('does not match non-Error objects or nullish values (no string message to read)', () => {
    // Only Error.message and raw strings are inspected; a bare object stringifies
    // to "[object Object]" and a plain duplicate-shaped object is not an Error.
    expect(isDuplicateKeyError({ message: 'duplicate key' })).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
    expect(isDuplicateKeyError(undefined)).toBe(false);
  });
});
