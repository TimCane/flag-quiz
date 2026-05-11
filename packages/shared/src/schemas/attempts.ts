import { z } from "zod";
import { FlagCodeSchema } from "./collection.js";

const BaseAttemptSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  flag: FlagCodeSchema,
  correct: z.boolean(),
  confidence: z.number().int().min(1).max(4),
  reaction_time_ms: z.number().int().min(0),
  ts: z.string().datetime(),
});

export const ClassicAttemptSchema = BaseAttemptSchema.extend({
  guess: FlagCodeSchema.nullable(),
  forgotten: z.boolean(),
  accidental: z.boolean().optional().default(false),
});

export const PickAttemptSchema = BaseAttemptSchema.extend({
  guess: FlagCodeSchema,
  options: z.array(FlagCodeSchema),
  accidental: z.boolean().optional().default(false),
});

/** @deprecated Use PickAttemptSchema — kept for backwards compatibility */
export const PickFlagAttemptSchema = PickAttemptSchema;
/** @deprecated Use PickAttemptSchema — kept for backwards compatibility */
export const PickItemAttemptSchema = PickAttemptSchema;

export type BaseAttempt = z.infer<typeof BaseAttemptSchema>;
export type ClassicAttempt = z.infer<typeof ClassicAttemptSchema>;
export type PickAttempt = z.infer<typeof PickAttemptSchema>;
/** @deprecated Use PickAttempt */
export type PickFlagAttempt = PickAttempt;
/** @deprecated Use PickAttempt */
export type PickItemAttempt = PickAttempt;
