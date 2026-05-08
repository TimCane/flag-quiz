import { z } from "zod";

const BaseAttemptSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  flag: z.string().length(2),
  correct: z.boolean(),
  confidence: z.number().int().min(1).max(4),
  reaction_time_ms: z.number().int().min(0),
  ts: z.string().datetime(),
});

export const ClassicAttemptSchema = BaseAttemptSchema.extend({
  guess: z.string().length(2).nullable(),
  forgotten: z.boolean(),
});

export const PickFlagAttemptSchema = BaseAttemptSchema.extend({
  guess: z.string().length(2),
  options: z.array(z.string().length(2)),
});

export const PickCountryAttemptSchema = BaseAttemptSchema.extend({
  guess: z.string().length(2),
  options: z.array(z.string().length(2)),
});

export type BaseAttempt = z.infer<typeof BaseAttemptSchema>;
export type ClassicAttempt = z.infer<typeof ClassicAttemptSchema>;
export type PickFlagAttempt = z.infer<typeof PickFlagAttemptSchema>;
export type PickCountryAttempt = z.infer<typeof PickCountryAttemptSchema>;
