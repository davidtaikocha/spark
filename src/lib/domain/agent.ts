import { z } from "zod";

export const visibilitySchema = z.enum(["public", "private"]);
export const sourceTypeSchema = z.enum(["house", "user"]);

export const tagSchema = z.string().trim().min(1).max(32);

export const agentInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(12).max(600),
  vibeTags: z.array(tagSchema).min(1).max(5),
  personalityTags: z.array(tagSchema).min(0).max(5).default([]),
  weirdHook: z.string().trim().min(3).max(160).optional(),
  visibility: visibilitySchema.default("public"),
  sourceType: sourceTypeSchema.default("user"),
});

export type AgentInput = z.infer<typeof agentInputSchema>;
