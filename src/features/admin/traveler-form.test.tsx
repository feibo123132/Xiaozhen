import { expect, it } from 'vitest';

import { isBundledAvatar } from '@/features/travelers/avatar-catalog';

it('accepts only bundled virtual avatar keys', () => {
  expect(isBundledAvatar('fox')).toBe(true);
  expect(isBundledAvatar('https://upload.example/me.png')).toBe(false);
});
