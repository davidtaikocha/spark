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
    <ol className="grid gap-3">
      {beats.map((beat, index) => (
        <li key={`${beat.label}-${index}`} className="rounded-xl border border-line bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-2xl tracking-tight text-ink">{beat.label}</p>
            <span className="text-sm text-muted">{index + 1}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink">{beat.summary}</p>
          <p className="mt-3 text-sm leading-6 text-[#7f5a47]">{beat.visualCue}</p>
        </li>
      ))}
    </ol>
  );
}
