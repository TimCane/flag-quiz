import { z } from "zod";

export const FlagProgressSchema = z.object({
  flag: z.string().length(2),
  mnemonic: z.string(),
  stability: z.number().nullable(),
  difficulty: z.number().nullable(),
  state: z.number().int().min(0).max(3),
  last_review: z.string().datetime().nullable(),
  due: z.string().datetime().nullable(),
  updated_at: z.string().datetime(),
});

export const UpsertFlagProgressSchema = FlagProgressSchema;

export type FlagProgress = z.infer<typeof FlagProgressSchema>;
