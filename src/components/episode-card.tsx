import { EpisodeBeatList } from "./episode-beat-list";
import { ShareComicButton } from "./share-comic-button";

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
  comicFailed?: boolean;
  comicStatus?: string;
  comicUrl?: string | null;
};

export function EpisodeCard({
  title,
  tone,
  setting,
  ending,
  shareSummary,
  beats,
  agentNames = [],
  comicFailed = false,
  comicStatus,
  comicUrl,
}: EpisodeCardProps) {
  const showComic = comicStatus === "ready" && comicUrl;
  return (
    <article className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {title}
        </p>
        <span className="rounded-lg border border-line bg-surface-raised/40 px-2.5 py-1 text-xs font-medium text-muted">
          {tone}
        </span>
        {comicStatus === "ready" ? (
          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
            Comic
          </span>
        ) : null}
      </div>

      {agentNames.length > 0 ? (
        <p className="mt-3 text-sm text-rose/70">
          {agentNames.join(" & ")}
        </p>
      ) : null}

      <p className="mt-4 text-base leading-7 text-accent/80">
        {shareSummary}
      </p>

      {comicFailed ? (
        <p className="mt-4 text-xs text-muted/60">
          Comic generation unavailable — showing text version.
        </p>
      ) : null}

      {showComic ? (
        <>
          <div className="mt-5 flex justify-end">
            <ShareComicButton imageUrl={comicUrl} />
          </div>
          <div className="mt-2 overflow-hidden rounded-xl">
            <img src={comicUrl} alt="Comic page" className="w-full" />
          </div>
        </>
      ) : (
        <>
          <div className="mt-5 rounded-xl border border-line bg-surface-raised/30 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-widest text-gold/70">
              Setting
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/80">{setting}</p>
          </div>

          <div className="mt-5">
            <EpisodeBeatList beats={beats} />
          </div>

          <div className="mt-5 rounded-xl border border-rose/15 bg-rose/5 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-widest text-rose/60">
              Ending
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/80">{ending}</p>
          </div>
        </>
      )}
    </article>
  );
}
