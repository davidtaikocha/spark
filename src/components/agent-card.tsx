import { PortraitStatus } from "./portrait-status";

type AgentCardProps = {
  name: string;
  description: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string;
  portraitStatus?: string;
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
  portraitStatus = "pending",
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

      <div className="mt-5 rounded-xl border border-dashed border-line bg-background px-4 py-8 text-center">
        <p className="font-display text-4xl text-[#a75d46]">{name.slice(0, 1).toUpperCase()}</p>
        <p className="mt-2 text-sm text-muted">Portrait will appear here after generation completes.</p>
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
    </article>
  );
}
