import { z } from "zod";

export const TagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  sort_order: z.number().int(),
  description: z.string(),
  updated_at: z.string().datetime(),
});

export const CreateTagSchema = TagSchema.extend({
  name: z.string().max(100),
});

export const UpdateTagSchema = z.object({
  name: z.string().min(1).max(100),
  sort_order: z.number().int(),
  description: z.string(),
  updated_at: z.string().datetime(),
});

export const FlagTagSchema = z.object({
  flag: z.string().length(2),
  tag_id: z.string().uuid(),
  updated_at: z.string().datetime(),
});

export const SetFlagTagsSchema = z.object({
  flag: z.string().length(2),
  tag_ids: z.array(z.string().uuid()),
  updated_at: z.string().datetime(),
});

export const ReorderTagsSchema = z.object({
  order: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
    }),
  ),
  updated_at: z.string().datetime(),
});

export type Tag = z.infer<typeof TagSchema>;
export type FlagTag = z.infer<typeof FlagTagSchema>;
