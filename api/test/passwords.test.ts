import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/identity/utils/passwords.ts';
import { signUpBody } from '../src/identity/services/signUp.ts';

describe('passwords', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(await verifyPassword(hash, 'correct horse battery')).toBe(true);
    expect(await verifyPassword(hash, 'correct horse battery!')).toBe(false);
  });

  it('refuses a password bcrypt would truncate (over 72 bytes)', () => {
    const base = { email: 'a@example.test', displayName: 'A' };
    expect(signUpBody.safeParse({ ...base, password: 'x'.repeat(72) }).success).toBe(true);
    expect(signUpBody.safeParse({ ...base, password: 'x'.repeat(73) }).success).toBe(false);
    // 24 three-byte characters is 72 bytes; one more is over, though only 25 characters.
    expect(signUpBody.safeParse({ ...base, password: '€'.repeat(25) }).success).toBe(false);
  });
});
