import type { GeneratedFile } from "ai";
import { z } from "zod";

export type PromptAgent = {
  name: string;
  description?: string;
  vibeTags?: string[];
  personalityTags?: string[];
  weirdHook?: string | null;
};

export const normalizedAgentSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(12).max(600),
  vibeTags: z.array(z.string().min(1)).min(1).max(5),
  personalityTags: z.array(z.string().min(1)).min(1).max(5),
  weirdHook: z.string().min(3).max(160).nullable().optional(),
  portraitPrompt: z.string().min(12).max(600),
});

export type NormalizedAgent = z.infer<typeof normalizedAgentSchema>;

export const episodeBeatSchema = z.object({
  label: z.string().min(1).max(40),
  summary: z.string().min(1).max(280),
  visualCue: z.string().min(1).max(200),
});

export type EpisodeBeat = z.infer<typeof episodeBeatSchema>;

export const episodeSchema = z.object({
  title: z.string().min(1).max(120),
  tone: z.string().min(1).max(40),
  setting: z.string().min(1).max(120),
  beats: z.array(episodeBeatSchema).min(4).max(6),
  ending: z.string().min(1).max(280),
  shareSummary: z.string().min(1).max(200),
});

export type Episode = z.infer<typeof episodeSchema>;

export type EpisodePromptInput = {
  agentA: PromptAgent;
  agentB: PromptAgent;
  tone: string;
};

export type PortraitResult = {
  image: GeneratedFile;
  prompt: string;
  model: string;
};
