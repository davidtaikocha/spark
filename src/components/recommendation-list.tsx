type Recommendation = {
  agentId: string;
  name: string;
  description: string;
  storyabilityScore: number;
  reason: string;
};

type RecommendationListProps = {
  items: Recommendation[];
};

export function RecommendationList({ items }: RecommendationListProps) {
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
        </article>
      ))}
    </div>
  );
}
