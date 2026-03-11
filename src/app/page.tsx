import Link from "next/link";

const dateBlueprint = [
  {
    title: "Build an impossible crush",
    detail: "Write the look, voice, and odd little flaw that makes your character memorable.",
  },
  {
    title: "Pair them on purpose",
    detail: "Choose a match yourself or let the app find the funniest chemistry in the room.",
  },
  {
    title: "Read the fallout",
    detail: "Get a short date episode with scenes, tension, and an ending worth passing around.",
  },
];

const houseAgents = [
  {
    name: "Lobster Poet",
    blurb: "Velvet blazer, seaside heartbreak, soft claws.",
  },
  {
    name: "Neon Ghost",
    blurb: "A nightclub apparition with perfect posture and terrible timing.",
  },
  {
    name: "Clockwork Florist",
    blurb: "Mechanical hands, precise bouquets, surprisingly needy.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <div>
            <p className="font-display text-2xl tracking-tight">Agent Dates</p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link href="/feed" className="transition-colors hover:text-ink">
              Feed
            </Link>
            <Link href="/matches/new" className="transition-colors hover:text-ink">
              Matchmaker
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 gap-10 py-12 lg:grid-cols-[1.25fr_0.95fr] lg:items-start lg:py-16">
          <div className="max-w-3xl">
            <h1 className="max-w-2xl font-display text-5xl leading-none tracking-tight text-ink sm:text-6xl">
              Make strange hearts collide.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Agent Dates is a playful social space for writing impossible personas, matching them with
              equally questionable company, and turning the whole thing into a short romantic disaster.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/agents/new"
                className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#a13b2f]"
              >
                Create an agent
              </Link>
              <Link
                href="/matches/new"
                className="rounded-lg border border-line px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Generate a date episode
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <article className="rounded-xl border border-line bg-surface p-5">
              <p className="font-display text-3xl tracking-tight">Tonight&apos;s arrangement</p>
              <div className="mt-5 grid gap-3">
                {houseAgents.map((agent) => (
                  <div key={agent.name} className="rounded-lg border border-line bg-background px-4 py-3">
                    <p className="text-base font-medium text-ink">{agent.name}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{agent.blurb}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-xl border border-line bg-[#efe4d8] p-5 text-[#4a3028]">
              <p className="font-display text-3xl tracking-tight">This week&apos;s favorite ending</p>
              <p className="mt-4 text-base leading-7">
                They arrived to a rooftop greenhouse ready for seduction, misread every cue, and still
                left with two linked umbrellas and a very real second date.
              </p>
            </article>
          </div>
        </section>

        <section
          id="how-it-works"
          className="grid gap-4 border-t border-line py-8 sm:grid-cols-3 sm:gap-5"
        >
          {dateBlueprint.map((item) => (
            <article key={item.title} className="rounded-xl border border-line bg-surface p-5">
              <h2 className="font-display text-2xl tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{item.detail}</p>
            </article>
          ))}
        </section>

        <section
          id="house-roster"
          className="mt-2 grid gap-4 border-t border-line py-8 lg:grid-cols-[0.85fr_1.15fr]"
        >
          <div className="max-w-lg">
            <p className="font-display text-3xl tracking-tight">A romantic comedy engine for bizarre people.</p>
            <p className="mt-4 text-base leading-7 text-muted">
              Start with the house roster, add your own creations, and keep the best pairings moving
              through the feed. The good ones feel charming. The great ones feel shareable.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink">House agents</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Curated characters keep the app lively before community profiles take over.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink">Manual or recommended matches</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                You can chase the exact pairing you want or let the app find the messiest chemistry.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink">Structured story beats</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Episodes are compact on purpose so later image and video work has a stable base.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink">Shareable outcomes</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                The post is the prize: a quick story that people want to send to the group chat.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
