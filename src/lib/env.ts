import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./prisma/dev.db'),
  CRISIS_RESOURCE_NOTICE: z.string().min(1).optional(),
});

export function readAppEnv(environment: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(environment);
}
