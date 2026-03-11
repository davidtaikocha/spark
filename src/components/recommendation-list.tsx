import { HeartIcon } from "./icons";

type Recommendation = {
  agentId: string;
  name: string;
  description: string;
  chemistryScore: number;
  contrastScore: number;
  storyabilityScore: number;
  reason: string;
};

type RecommendationListProps = {
  primaryAgentId: string;
  items: Recommendation[];
  action: (formData: FormData) => void | Promise<void>;
};

export function RecommendationList({
  primaryAgentId,
  items,
  action,
}: RecommendationListProps) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <article
          key={item.agentId}
          className="glass-card glass-card-hover rounded-2xl p-5 transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-xl text-ink">{item.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {item.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-rose/15 px-3 py-1.5">
              <HeartIcon className="h-3.5 w-3.5 text-rose" />
              <span className="text-sm font-semibold text-rose">
                {item.storyabilityScore}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-accent/70">{item.reason}</p>

          <form action={action} className="mt-5">
            <input type="hidden" name="agentAId" value={primaryAgentId} />
            <input type="hidden" name="agentBId" value={item.agentId} />
            <input type="hidden" name="reason" value={item.reason} />
            <input
              type="hidden"
              name="chemistryScore"
              value={String(item.chemistryScore)}
            />
            <input
              type="hidden"
              name="contrastScore"
              value={String(item.contrastScore)}
            />
            <input
              type="hidden"
              name="storyabilityScore"
              value={String(item.storyabilityScore)}
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-rose to-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(212,105,138,0.3)]"
            >
              Generate date episode
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}
