import { z } from 'zod';

export const healthResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), database: z.literal('ok') }),
  z.object({ status: z.literal('error'), database: z.literal('unavailable') }),
]);

export type HealthResponse = z.infer<typeof healthResponseSchema>;
