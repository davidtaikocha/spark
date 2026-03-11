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

export function RecommendationList({ primaryAgentId, items, action }: RecommendationListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={item.agentId} className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-2xl tracking-tight text-ink">{item.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            </div>
            <div className="rounded-md border border-line bg-background px-3 py-1.5 text-sm font-medium text-ink">
              {item.storyabilityScore}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#6f4638]">{item.reason}</p>
          <form action={action} className="mt-5">
            <input type="hidden" name="agentAId" value={primaryAgentId} />
            <input type="hidden" name="agentBId" value={item.agentId} />
            <input type="hidden" name="reason" value={item.reason} />
            <input type="hidden" name="chemistryScore" value={String(item.chemistryScore)} />
            <input type="hidden" name="contrastScore" value={String(item.contrastScore)} />
            <input type="hidden" name="storyabilityScore" value={String(item.storyabilityScore)} />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#a13b2f]"
            >
              Generate date episode
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}
