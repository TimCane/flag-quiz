import { z } from "zod";

export const CollectionIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);

export type CollectionId = z.infer<typeof CollectionIdSchema>;

const FlagCodeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);

export { FlagCodeSchema };
