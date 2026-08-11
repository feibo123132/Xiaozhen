import { z } from 'zod';
import { isBundledAvatar } from './avatar-catalog';
const schema = z.object({ pseudonym: z.string().trim().min(2).max(40), bio: z.string().trim().max(240), avatarKey: z.string().refine(isBundledAvatar) });
export const parseTravelerProfile = (input: unknown) => schema.parse(input);
