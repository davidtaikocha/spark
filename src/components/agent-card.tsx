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
      <p className="text-xs font-medium uppercase tracking-widest text-muted">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-lg border border-line bg-surface-raised/40 px-2.5 py-1 text-xs text-ink/80"
          >
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
    <article className="glass-card glass-card-hover rounded-2xl p-5 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl tracking-tight text-ink">
            {name}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
        <PortraitStatus status={portraitStatus} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-line">
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={`${name} portrait`}
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center bg-gradient-to-br from-rose/10 via-surface to-accent/5 px-4 py-12">
            <div className="text-center">
              <p className="font-display text-5xl text-rose/30">
                {name.slice(0, 1).toUpperCase()}
              </p>
              <p className="mt-3 text-sm text-muted">
                Portrait will appear here after generation completes.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        <TagRow label="Vibes" tags={vibeTags} />
        <TagRow label="Personality" tags={personalityTags} />
      </div>

      {weirdHook ? (
        <div className="mt-5 rounded-xl border border-line bg-surface-raised/30 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-gold/70">
            Weird hook
          </p>
          <p className="mt-2 text-sm leading-6 text-ink/80">{weirdHook}</p>
        </div>
      ) : null}

      {rerollAction ? (
        <form action={rerollAction} method="post" className="mt-5">
          <button
            type="submit"
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition-all duration-200 hover:border-rose/30 hover:text-rose hover:shadow-[0_0_16px_rgba(212,105,138,0.1)]"
          >
            Reroll portrait
          </button>
        </form>
      ) : null}
    </article>
  );
}
