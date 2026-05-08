import { z } from "zod";
import { Mode, ExitCondition } from "../enums.js";

export const SessionSchema = z.object({
  id: z.string().uuid(),
  mode: z.enum([Mode.CLASSIC, Mode.PICK_THE_FLAG, Mode.PICK_THE_COUNTRY]),
  exit_condition: z.enum([
    ExitCondition.NORMAL,
    ExitCondition.STREAK,
    ExitCondition.SPEED,
  ]),
  quick: z.boolean().default(false),
  started: z.string().datetime(),
  ended: z.string().datetime().nullable(),
});

export const CreateSessionSchema = SessionSchema.omit({ ended: true });

export const UpdateSessionSchema = z.object({
  ended: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;
export type CreateSession = z.infer<typeof CreateSessionSchema>;
