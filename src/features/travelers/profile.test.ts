import { expect, it } from 'vitest';
import { parseTravelerProfile } from './profile';
it('accepts a pseudonym, short bio and bundled avatar only', () => { expect(parseTravelerProfile({ pseudonym: '晚风', bio: '认真想一会儿。', avatarKey: 'fox' }).avatarKey).toBe('fox'); expect(() => parseTravelerProfile({ pseudonym: '晚风', bio: '', avatarKey: 'upload' })).toThrow(); });
