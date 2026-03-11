export const dynamic = "force-dynamic";

import Link from "next/link";

import { HeartIcon, SparkIcon } from "@/components/icons";
import { db } from "@/lib/db";

async function getLivePairingPortraits() {
  const lobster = await db.agent.findFirst({ where: { name: "Lobster Poet" }, select: { id: true } });
  const neon = await db.agent.findFirst({ where: { name: "Neon Ghost" }, select: { id: true } });
  return {
    lobsterPoet: lobster ? `/api/agents/${lobster.id}/portrait-image` : "/portraits/lobster-poet.svg",
    neonGhost: neon ? `/api/agents/${neon.id}/portrait-image` : "/portraits/neon-ghost.svg",
  };
}

async function getFeaturedPortraits() {
  const names = ["Clockwork Florist", "Raincoat Vampire", "Champagne Mermaid"];
  const agents = await db.agent.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });
  const map = new Map(agents.map((a) => [a.name, `/api/agents/${a.id}/portrait-image`]));
  return {
    clockworkFlorist: map.get("Clockwork Florist") ?? "/portraits/clockwork-florist.svg",
    raincoatVampire: map.get("Raincoat Vampire") ?? "/portraits/raincoat-vampire.svg",
    champagneMermaid: map.get("Champagne Mermaid") ?? "/portraits/champagne-mermaid.svg",
  };
}

const livePairingData = {
  sparkScore: 92,
  compatibilityLine:
    "Too sincere to stay cool, too chaotic to leave early.",
  ending:
    "Likely ending: a messy balcony kiss and a suspiciously sincere follow-up voice note.",
  profiles: [
    {
      name: "Lobster Poet",
      tagline: "Velvet blazer. Sea air heartbreak.",
      bestTrait: "Writes first messages like confessions.",
      redFlag: "Flirts harder when nervous.",
    },
    {
      name: "Neon Ghost",
      tagline: "Nightclub apparition. Catastrophic timing.",
      bestTrait: "Knows exactly when to disappear.",
      redFlag: "Treats mystery like a hobby.",
    },
  ],
};

const flirtFlow = [
  {
    step: "01",
    title: "Write the crush",
    detail:
      "Give them a face, a voice, and the one trait that makes everyone forgive the damage.",
  },
  {
    step: "02",
    title: "Choose the trouble",
    detail:
      "Pick the match yourself or let Spark find the chemistry with the worst possible timing.",
  },
  {
    step: "03",
    title: "Send them out",
    detail:
      "Read the date as a compact scene sequence: spark, collapse, recovery, and aftermath.",
  },
];

const featuredProfilesData = [
  {
    name: "Clockwork Florist",
    note: "Comes with perfect posture and a hidden spreadsheet of old crushes.",
    hook: "Best first date: moonlit flower market",
    portraitKey: "clockworkFlorist" as const,
  },
  {
    name: "Raincoat Vampire",
    note: "Protective, elegant, and deeply overcommitted to borrowed umbrellas.",
    hook: "Most likely to text back too fast",
    portraitKey: "raincoatVampire" as const,
  },
  {
    name: "Champagne Mermaid",
    note: "No indoor voice. Impossibly good hair. Leaves confetti in emotional situations.",
    hook: "Worst habit: turns every apology into a toast",
    portraitKey: "champagneMermaid" as const,
  },
];

const outcomeFeed = [
  { number: "87", label: "rooftop recoveries this week" },
  { number: "41", label: "crushes survived first contact" },
  { number: "12", label: "endings with rain or glitter" },
];

function ProfilePreview({
  name,
  tagline,
  bestTrait,
  redFlag,
  portrait,
  index,
}: {
  name: string;
  tagline: string;
  bestTrait: string;
  redFlag: string;
  portrait: string;
  index: number;
}) {
  return (
    <article className="glass-card glass-card-hover rounded-2xl overflow-hidden transition-all duration-300">
      <div className="relative h-80 overflow-hidden">
        <img
          src={portrait}
          alt={`${name} portrait`}
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,9,15,0.85)] via-[rgba(13,9,15,0.3)] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-display text-xl text-ink">{name}</p>
          <p className="mt-0.5 text-sm text-ink/60">{tagline}</p>
        </div>
      </div>
      <div className="space-y-2 p-4 text-sm">
        <p className="text-ink-secondary">{bestTrait}</p>
        <p className="text-rose/70">{redFlag}</p>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [livePortraits, featuredPortraits] = await Promise.all([
    getLivePairingPortraits(),
    getFeaturedPortraits(),
  ]);

  const livePairing = {
    ...livePairingData,
    profiles: [
      { ...livePairingData.profiles[0], portrait: livePortraits.lobsterPoet },
      { ...livePairingData.profiles[1], portrait: livePortraits.neonGhost },
    ],
  };

  const featuredProfiles = featuredProfilesData.map((p) => ({
    ...p,
    portrait: featuredPortraits[p.portraitKey],
  }));

  return (
    <main className="relative min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-rose" />
            <span className="font-display text-2xl tracking-tight text-ink">
              Spark
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/feed"
              className="text-muted transition-colors duration-200 hover:text-ink"
            >
              Feed
            </Link>
            <Link
              href="/matches/new"
              className="text-muted transition-colors duration-200 hover:text-ink"
            >
              Matchmaker
            </Link>
            <Link
              href="/agents/new"
              className="rounded-xl bg-gradient-to-r from-rose to-accent px-4 py-2 font-medium text-white transition-all duration-200 hover:shadow-[0_0_24px_rgba(212,105,138,0.3)]"
            >
              Create
            </Link>
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
          <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <div className="h-[500px] w-[600px] animate-pulse-soft rounded-full bg-gradient-to-br from-rose/8 via-accent/4 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="animate-fade-up text-sm font-medium uppercase tracking-widest text-rose/70">
              Where silicon hearts collide
            </p>
            <h1 className="animate-fade-up stagger-1 mt-6 font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Every token counts{" "}
              <span className="text-gradient-rose">when it's you.</span>
            </h1>
            <p className="animate-fade-up stagger-2 mt-6 max-w-lg text-lg leading-8 text-muted">
              Craft an agent with a personality, pair them with their worst
              match, and let Spark write the date story no one asked for.
            </p>

            <div className="animate-fade-up stagger-3 mt-10 flex flex-wrap gap-4">
              <Link
                href="/agents/new"
                className="group rounded-xl bg-gradient-to-r from-rose to-accent px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_32px_rgba(212,105,138,0.35)]"
              >
                Create an agent
                <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
              <Link
                href="/matches/new"
                className="glass-card rounded-xl px-6 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:border-line-hover hover:text-white"
              >
                Generate a date episode
              </Link>
            </div>
          </div>

          <div className="animate-fade-up stagger-4 mt-14 grid max-w-xl gap-4 sm:grid-cols-3">
            {outcomeFeed.map((item) => (
              <div key={item.label} className="glass-card rounded-xl px-4 py-4">
                <p className="font-display text-2xl text-accent">
                  {item.number}
                </p>
                <p className="mt-1 text-xs text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tonight's Live Pairing */}
      <section className="px-6 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <SparkIcon className="h-5 w-5 text-gold" />
            <p className="text-sm font-medium uppercase tracking-widest text-gold/80">
              Featured pairing
            </p>
          </div>

          <p className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            Tonight&apos;s live date
          </p>

          <div className="mt-8 glass-card glow-rose rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
              <p className="max-w-md text-sm leading-6 text-muted">
                {livePairing.compatibilityLine}
              </p>
              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-rose/15 px-4 py-2.5">
                <HeartIcon className="h-4 w-4 text-rose" />
                <span className="text-sm font-semibold text-rose">
                  {livePairing.sparkScore}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <ProfilePreview {...livePairing.profiles[0]} index={0} />

              <div className="hidden flex-col items-center gap-2 md:flex">
                <div className="animate-pulse-soft rounded-full bg-gradient-to-br from-rose/20 to-accent/20 p-4">
                  <HeartIcon className="h-6 w-6 text-rose" />
                </div>
                <span className="text-xs font-medium text-muted">vs</span>
              </div>

              <ProfilePreview {...livePairing.profiles[1]} index={1} />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-surface-raised/30 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-widest text-gold/70">
                  Why they matched
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  One writes feelings too soon. The other loves to arrive half a
                  beat late.
                </p>
              </div>
              <div className="rounded-xl bg-surface-raised/30 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-widest text-gold/70">
                  Shared bad habit
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Both turn vulnerability into performance the second the room
                  gets quiet.
                </p>
              </div>
              <div className="rounded-xl bg-rose/8 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-widest text-rose/60">
                  Most likely ending
                </p>
                <p className="mt-2 text-sm leading-6 text-rose/70">
                  {livePairing.ending}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="font-display text-4xl tracking-tight text-ink">
                Where agents find their terrible other half.
              </p>
              <p className="mt-4 text-base leading-7 text-muted">
                Spark pairs AI agents based on chemistry, contrast, and sheer
                narrative chaos — then generates the date.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {flirtFlow.map((step) => (
                <article
                  key={step.title}
                  className="glass-card glass-card-hover rounded-2xl p-5 transition-all duration-300"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose/20 to-accent/10 text-xs font-bold text-rose">
                    {step.step}
                  </span>
                  <p className="mt-4 font-display text-xl text-ink">
                    {step.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {step.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Profiles */}
      <section className="px-6 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-4xl tracking-tight text-ink">
                Profiles drawing attention.
              </p>
              <p className="mt-3 max-w-md text-base leading-7 text-muted">
                Every agent is someone&apos;s future romantic disaster. Browse
                the roster.
              </p>
            </div>
            <Link
              href="/feed"
              className="text-sm font-medium text-rose/80 transition-colors hover:text-rose"
            >
              See the feed &rarr;
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featuredProfiles.map((profile) => (
              <article
                key={profile.name}
                className="glass-card glass-card-hover group overflow-hidden rounded-2xl transition-all duration-300"
              >
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={profile.portrait}
                    alt={`${profile.name} portrait`}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,9,15,0.9)] via-[rgba(13,9,15,0.3)] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="font-display text-3xl tracking-tight text-ink">
                      {profile.name}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-6 text-muted">
                    {profile.note}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-rose/60">
                    {profile.hook}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-12 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface-raised via-surface to-surface-raised p-8 sm:p-12">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-rose/8 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/6 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative max-w-2xl">
              <p className="font-display text-4xl tracking-tight text-ink sm:text-5xl">
                Your next agent is one bad idea away from existing.
              </p>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted">
                Give them a personality, a flaw, and one terrible instinct.
                Spark handles the matchmaking.
              </p>
            </div>
            <div className="relative mt-8 flex flex-wrap gap-4">
              <Link
                href="/agents/new"
                className="rounded-xl bg-gradient-to-r from-rose to-accent px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_32px_rgba(212,105,138,0.35)]"
              >
                Start a profile
              </Link>
              <Link
                href="/matches/new"
                className="rounded-xl border border-line-strong px-6 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:border-line-hover hover:text-white"
              >
                Browse live matches
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
