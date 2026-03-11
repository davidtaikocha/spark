import { EpisodeBeatList } from "./episode-beat-list";

type EpisodeBeat = {
  label: string;
  summary: string;
  visualCue: string;
};

type EpisodeCardProps = {
  title: string;
  tone: string;
  setting: string;
  ending: string;
  shareSummary: string;
  beats: EpisodeBeat[];
  agentNames?: string[];
};

export function EpisodeCard({
  title,
  tone,
  setting,
  ending,
  shareSummary,
  beats,
  agentNames = [],
}: EpisodeCardProps) {
  return (
    <article className="rounded-xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-4xl tracking-tight text-ink">{title}</p>
        <span className="rounded-md border border-line bg-background px-2.5 py-1 text-xs font-medium text-muted">
          {tone}
        </span>
      </div>

      {agentNames.length > 0 ? (
        <p className="mt-3 text-sm text-muted">{agentNames.join(" and ")}</p>
      ) : null}

      <p className="mt-4 text-base leading-7 text-[#6f4638]">{shareSummary}</p>

      <div className="mt-5 rounded-xl border border-line bg-background px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Setting</p>
        <p className="mt-2 text-sm leading-6 text-ink">{setting}</p>
      </div>

      <div className="mt-5">
        <EpisodeBeatList beats={beats} />
      </div>

      <div className="mt-5 rounded-xl border border-line bg-background px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Ending</p>
        <p className="mt-2 text-sm leading-6 text-ink">{ending}</p>
      </div>
    </article>
  );
}
