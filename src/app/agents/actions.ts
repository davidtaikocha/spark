"use server";

import { completePortraitGeneration } from "@/app/api/agents/[agentId]/portrait/route";
import { agentInputSchema } from "@/lib/domain/agent";
import { extractAgentReplySections } from "@/lib/domain/agent-reply";
import { db } from "@/lib/db";
import { portraitImageUrl } from "@/lib/image-url";
import { interpretAgentReply } from "@/lib/ai/interpret-agent-reply";
import { normalizeAgent } from "@/lib/ai/normalize-agent";
import { moderateAgentInput } from "@/lib/moderation/moderate-agent-input";

export type CreateAgentInput = {
  name: string;
  description: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string;
};

export type PreparedAgentDraft = CreateAgentInput;
export type DraftMode = "structured" | "mixed" | "interpreted";

export type PrepareAgentDraftResult =
  | {
      draft: PreparedAgentDraft;
      missingFields: string[];
      mode: DraftMode;
    }
  | {
      error: string;
      draft?: PreparedAgentDraft;
      missingFields?: string[];
      mode?: DraftMode;
    };

export type ParseAgentReplyState = {
  draft: PreparedAgentDraft | null;
  error?: string;
  missingFields: string[];
  mode?: DraftMode;
};

function cleanTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildDraft(input?: Partial<CreateAgentInput>): PreparedAgentDraft {
  return {
    name: input?.name?.trim() ?? "",
    description: input?.description?.trim() ?? "",
    vibeTags: cleanTags(input?.vibeTags ?? []),
    personalityTags: cleanTags(input?.personalityTags ?? []),
    weirdHook: input?.weirdHook?.trim() || undefined,
  };
}

function requiredDraftFields(draft: PreparedAgentDraft) {
  const missing: string[] = [];

  if (!draft.name) {
    missing.push("name");
  }

  if (!draft.description || draft.description.length < 12) {
    missing.push("description");
  }

  if (draft.vibeTags.length === 0) {
    missing.push("vibeTags");
  }

  return missing;
}

export async function prepareAgentDraft(reply: string): Promise<PrepareAgentDraftResult> {
  if (reply.trim().length < 12) {
    return {
      error: "Paste a fuller reply from your agent so Spark has something to work with.",
    };
  }

  const structured = buildDraft(extractAgentReplySections(reply));
  const shouldInterpret =
    !structured.name ||
    !structured.description ||
    structured.vibeTags.length === 0 ||
    structured.personalityTags.length === 0;

  if (!shouldInterpret) {
    return {
      draft: structured,
      missingFields: [],
      mode: "structured",
    };
  }

  const raw = await interpretAgentReply(reply);
  const interpreted = buildDraft({ ...raw, weirdHook: raw.weirdHook ?? undefined });
  const merged = buildDraft({
    name: structured.name || interpreted.name,
    description: structured.description || interpreted.description,
    vibeTags: structured.vibeTags.length > 0 ? structured.vibeTags : interpreted.vibeTags,
    personalityTags:
      structured.personalityTags.length > 0
        ? structured.personalityTags
        : interpreted.personalityTags,
    weirdHook: structured.weirdHook || interpreted.weirdHook,
  });

  const missingFields = requiredDraftFields(merged);

  if (!merged.name && !merged.description) {
    return {
      error: "Spark could not read a usable profile from that reply.",
    };
  }

  return {
    draft: merged,
    missingFields,
    mode:
      structured.name ||
      structured.description ||
      structured.vibeTags.length > 0 ||
      structured.personalityTags.length > 0 ||
      structured.weirdHook
        ? "mixed"
        : "interpreted",
  };
}

export async function parseAgentReplyAction(
  _previousState: ParseAgentReplyState,
  formData: FormData,
): Promise<ParseAgentReplyState> {
  const result = await prepareAgentDraft(String(formData.get("reply") ?? ""));

  if ("error" in result) {
    return {
      draft: result.draft ?? null,
      error: result.error,
      missingFields: result.missingFields ?? [],
      mode: result.mode,
    };
  }

  return {
    draft: result.draft,
    missingFields: result.missingFields,
    mode: result.mode,
  };
}

export async function createAgent(input: CreateAgentInput) {
  if (!input.name?.trim()) {
    return { error: "Your agent needs at least a name." };
  }

  const trimTag = (t: string) => t.trim().slice(0, 100);

  const filled = {
    name: input.name.trim().slice(0, 80),
    description:
      input.description?.trim() && input.description.trim().length >= 12
        ? input.description.trim().slice(0, 600)
        : `A mysterious character known only as ${input.name.trim()}, with more personality than anyone expected.`,
    vibeTags:
      input.vibeTags?.length > 0
        ? input.vibeTags.map(trimTag).filter(Boolean)
        : ["chaotic", "romantic"],
    personalityTags:
      input.personalityTags?.length > 0
        ? input.personalityTags.map(trimTag).filter(Boolean)
        : ["earnest"],
    weirdHook: input.weirdHook?.trim()
      ? input.weirdHook.trim().slice(0, 500)
      : undefined,
    sourceType: "user" as const,
    visibility: "public" as const,
  };

  const parsedResult = agentInputSchema.safeParse(filled);

  if (!parsedResult.success) {
    const flat = parsedResult.error.flatten();
    console.error("Agent validation failed:", JSON.stringify(flat));
    const fieldErrors = Object.entries(flat.fieldErrors)
      .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
      .join("; ");
    return {
      error: fieldErrors || "Something went wrong validating the profile. Try again.",
    };
  }

  const parsed = parsedResult.data;

  const moderation = await moderateAgentInput({
    name: parsed.name,
    description: parsed.description,
  });

  if (!moderation.allowed) {
    return {
      error: moderation.reason ?? "This profile cannot be used right now.",
    };
  }

  const normalized = await normalizeAgent(parsed);
  const agent = await db.agent.create({
    data: {
      name: normalized.name,
      description: normalized.description,
      vibeTags: normalized.vibeTags,
      personalityTags: normalized.personalityTags,
      weirdHook: normalized.weirdHook ?? parsed.weirdHook,
      portraitPrompt: normalized.portraitPrompt,
      portraitStatus: "pending",
      sourceType: "user",
      visibility: "public",
    },
  });

  let finalAgent = agent;
  try {
    finalAgent = await completePortraitGeneration(agent.id);
  } catch {
    // Portrait generation failed — agent is still usable without it
  }

  return { agent: finalAgent };
}

function splitTags(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function createAgentFromDraft(formData: FormData) {
  const result = await createAgent({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    vibeTags: splitTags(formData.get("vibeTags")),
    personalityTags: splitTags(formData.get("personalityTags")),
    weirdHook: String(formData.get("weirdHook") ?? ""),
  });

  return result;
}

export async function createAgentFromReply(formData: FormData) {
  const reply = String(formData.get("reply") ?? "");
  const draftResult = await prepareAgentDraft(reply);

  if ("error" in draftResult) {
    return { error: draftResult.error ?? "Could not parse the reply." };
  }

  return createAgent(draftResult.draft);
}

export type CreateAgentState = {
  agent: {
    id: string;
    name: string;
    description: string;
    vibeTags: string[];
    personalityTags: string[];
    weirdHook: string | null;
    portraitUrl: string | null;
    portraitStatus: string;
  } | null;
  error: string | null;
};

export async function createAgentAction(
  _prev: CreateAgentState,
  formData: FormData,
): Promise<CreateAgentState> {
  try {
    const reply = String(formData.get("reply") ?? "");
    const draftResult = await prepareAgentDraft(reply);

    if ("error" in draftResult) {
      return { agent: null, error: draftResult.error ?? "Could not parse the reply." };
    }

    const result = await createAgent(draftResult.draft);

    if ("error" in result) {
      return { agent: null, error: result.error ?? "Something went wrong." };
    }

    const a = result.agent;
    return {
      agent: {
        id: a.id,
        name: a.name,
        description: a.description,
        vibeTags: Array.isArray(a.vibeTags) ? (a.vibeTags as string[]) : [],
        personalityTags: Array.isArray(a.personalityTags) ? (a.personalityTags as string[]) : [],
        weirdHook: a.weirdHook,
        portraitUrl: portraitImageUrl(a.id, a.portraitUrl),
        portraitStatus: a.portraitStatus,
      },
      error: null,
    };
  } catch (error) {
    console.error("createAgentAction failed:", error);
    return {
      agent: null,
      error: error instanceof Error ? error.message : "Something went wrong creating the agent.",
    };
  }
}
