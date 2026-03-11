import { PortraitStatus } from "./portrait-status";

type AgentCardProps = {
  name: string;
  description: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string;
  portraitUrl?: string;
  portraitStatus?: string;
  rerollAction?: string;
};

function TagRow({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-md border border-line bg-background px-2.5 py-1 text-xs text-ink">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AgentCard({
  name,
  description,
  vibeTags,
  personalityTags,
  weirdHook,
  portraitUrl,
  portraitStatus = "pending",
  rerollAction,
}: AgentCardProps) {
  return (
    <article className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl tracking-tight text-ink">{name}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
        </div>
        <PortraitStatus status={portraitStatus} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-dashed border-line bg-background">
        {portraitUrl ? (
          <img src={portraitUrl} alt={`${name} portrait`} className="h-72 w-full object-cover" />
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="font-display text-4xl text-[#a75d46]">{name.slice(0, 1).toUpperCase()}</p>
            <p className="mt-2 text-sm text-muted">Portrait will appear here after generation completes.</p>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        <TagRow label="Vibes" tags={vibeTags} />
        <TagRow label="Personality" tags={personalityTags} />
      </div>

      {weirdHook ? (
        <div className="mt-5 rounded-xl border border-line bg-background px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Weird hook</p>
          <p className="mt-2 text-sm leading-6 text-ink">{weirdHook}</p>
        </div>
      ) : null}

      {rerollAction ? (
        <form action={rerollAction} method="post" className="mt-5">
          <button
            type="submit"
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Reroll portrait
          </button>
        </form>
      ) : null}
    </article>
  );
}
