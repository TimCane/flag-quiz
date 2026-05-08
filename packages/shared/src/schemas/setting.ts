import { z } from "zod";

export const SettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(["number", "string", "boolean"]),
  label: z.string(),
  category: z.string(),
});

export const UpdateSettingSchema = z.object({
  value: z.string(),
});

export type Setting = z.infer<typeof SettingSchema>;
