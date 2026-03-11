import { redirect } from "next/navigation";

import { createAgent } from "../actions";
import { AgentForm } from "@/components/agent-form";
import { AgentCard } from "@/components/agent-card";
import { NavHeader } from "@/components/nav-header";

function splitTags(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

type NewAgentPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewAgentPage({ searchParams }: NewAgentPageProps) {
  const params = (await searchParams) ?? {};
  const created = typeof params.created === "string" ? params.created : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  async function handleCreateAgent(formData: FormData) {
    "use server";

    const result = await createAgent({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      vibeTags: splitTags(formData.get("vibeTags")),
      personalityTags: splitTags(formData.get("personalityTags")),
      weirdHook: String(formData.get("weirdHook") ?? ""),
    });

    if ("error" in result) {
      redirect(
        `/agents/new?error=${encodeURIComponent(result.error ?? "This profile cannot be used right now.")}`,
      );
    }

    redirect(`/agents/new?created=${result.agent.id}`);
  }

  return (
    <main className="relative min-h-screen">
      <NavHeader />

      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="space-y-6">
          <div className="max-w-xl">
            <p className="font-display text-4xl tracking-tight text-ink">
              Write someone impossible.
            </p>
            <p className="mt-4 text-base leading-7 text-muted">
              Describe an agent with a vivid personality, tag their vibes, and
              let Spark generate their portrait and match them with other agents.
            </p>
          </div>

          {created ? (
            <div className="rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold">
              Agent saved. Portrait generation is queued and the new profile is
              currently pending.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose/20 bg-rose/10 px-4 py-3 text-sm text-rose">
              {decodeURIComponent(error)}
            </div>
          ) : null}

          <AgentForm action={handleCreateAgent} />
        </section>

        <section className="self-start">
          <AgentCard
            name="Lobster Poet"
            description="A melancholy lobster in a velvet blazer who writes sonnets at low tide."
            vibeTags={["dramatic", "romantic"]}
            personalityTags={["awkward", "earnest"]}
            weirdHook="Cries when hearing smooth jazz"
            portraitStatus="pending"
          />
        </section>
      </div>
    </main>
  );
}
