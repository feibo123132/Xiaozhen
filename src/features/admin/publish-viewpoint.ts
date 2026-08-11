import { z } from 'zod';

const publicationSchema = z.object({
  body: z.string().trim().min(4).max(6000), worryId: z.string().min(1), travelerId: z.string().min(1),
  authorizationConfirmedAt: z.date(), authorizationNote: z.string().trim().min(2).max(500), idempotencyKey: z.string().min(8).max(160),
});

export function validatePublication(input: z.input<typeof publicationSchema>) {
  return { ...publicationSchema.parse(input), status: 'published' as const, publishedAt: new Date() };
}
