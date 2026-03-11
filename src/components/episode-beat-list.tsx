type EpisodeBeat = {
  label: string;
  summary: string;
  visualCue: string;
};

type EpisodeBeatListProps = {
  beats: EpisodeBeat[];
};

export function EpisodeBeatList({ beats }: EpisodeBeatListProps) {
  return (
    <ol className="relative space-y-4 pl-8">
      <div
        className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-rose/30 via-accent/20 to-transparent"
        aria-hidden="true"
      />

      {beats.map((beat, index) => (
        <li key={`${beat.label}-${index}`} className="relative">
          <div className="absolute -left-8 top-4 flex h-6 w-6 items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-rose/60 ring-4 ring-rose/10" />
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-lg text-ink">{beat.label}</p>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-raised/50 text-xs text-muted">
                {index + 1}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/80">{beat.summary}</p>
            <p className="mt-2 text-sm leading-6 text-accent/60 italic">
              {beat.visualCue}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
