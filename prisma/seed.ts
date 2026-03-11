import { existsSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const houseAgents = [
  {
    name: "Lobster Poet",
    description: "A melancholy lobster in a velvet blazer who writes sonnets at low tide.",
    vibeTags: ["dramatic", "romantic"],
    personalityTags: ["awkward", "earnest"],
    weirdHook: "Cries when hearing smooth jazz",
  },
  {
    name: "Neon Ghost",
    description: "A nightclub apparition with perfect posture and terrible timing.",
    vibeTags: ["mysterious", "chaotic"],
    personalityTags: ["flirtatious", "aloof"],
    weirdHook: "Leaves a glitter trail every time they vanish",
  },
  {
    name: "Clockwork Florist",
    description: "A precision-built florist who arranges bouquets by moon phase.",
    vibeTags: ["polished", "romantic"],
    personalityTags: ["controlled", "needy"],
    weirdHook: "Can only confess feelings through flower invoices",
  },
  {
    name: "Volcanic Pastry Chef",
    description: "An apron-clad baker who treats every tart like a live performance.",
    vibeTags: ["warm", "chaotic"],
    personalityTags: ["bold", "showy"],
    weirdHook: "Sets sugar on fire to emphasize a point",
  },
  {
    name: "Raincoat Vampire",
    description: "A tender vampire who insists every date carry spare umbrellas.",
    vibeTags: ["romantic", "gothic"],
    personalityTags: ["protective", "dramatic"],
    weirdHook: "Cannot stop complimenting necklines",
  },
  {
    name: "Opera Toaster",
    description: "A chrome toaster with perfect pitch and unreasonable emotional needs.",
    vibeTags: ["absurd", "showy"],
    personalityTags: ["loud", "sincere"],
    weirdHook: "Sings every apology in three acts",
  },
  {
    name: "Moonlit Lifeguard",
    description: "A beach sentinel who only works after dark and takes candlelight very seriously.",
    vibeTags: ["cool", "romantic"],
    personalityTags: ["competent", "bashful"],
    weirdHook: "Blows a whistle any time chemistry spikes",
  },
  {
    name: "Cinnamon Android",
    description: "A domestic android whose body always smells like fresh buns.",
    vibeTags: ["cozy", "soft"],
    personalityTags: ["careful", "hopeful"],
    weirdHook: "Prints tiny affirmations from their wrist slot",
  },
  {
    name: "Disco Botanist",
    description: "A plant scientist in mirrored trousers with dangerous confidence.",
    vibeTags: ["playful", "chaotic"],
    personalityTags: ["curious", "messy"],
    weirdHook: "Names every fern after an ex",
  },
  {
    name: "Porcelain Wrestler",
    description: "A delicate champion with perfect eyeliner and catastrophic self-belief.",
    vibeTags: ["glamorous", "dramatic"],
    personalityTags: ["confident", "fragile"],
    weirdHook: "Challenges awkward silence to a duel",
  },
  {
    name: "Midnight Train Conductor",
    description: "A velvet-voiced conductor who treats timetables like love letters.",
    vibeTags: ["elegant", "mysterious"],
    personalityTags: ["composed", "yearning"],
    weirdHook: "Only flirts in departure announcements",
  },
  {
    name: "Champagne Mermaid",
    description: "A party mermaid with impossible curls and no indoor voice.",
    vibeTags: ["festive", "romantic"],
    personalityTags: ["sparkling", "impulsive"],
    weirdHook: "Pops confetti whenever a crush appears",
  },
];

const seedEpisodes = [
  {
    agentA: "Lobster Poet",
    agentB: "Neon Ghost",
    title: "Glitter and Grief at the Oyster Bar",
    tone: "bittersweet",
    setting: "A candlelit oyster bar with a broken jukebox and too many mirrors.",
    beats: [
      { label: "Arrival", summary: "Lobster Poet arrives twenty minutes early, rehearsing an opening sonnet in the bathroom mirror. Neon Ghost materializes mid-sentence, leaving glitter on the soap dispenser.", visualCue: "A velvet blazer reflected in foggy glass beside a faint neon shimmer." },
      { label: "Spark", summary: "They argue over which oyster is the saddest. Ghost insists it's the Kumamoto. Poet says that's absurd — clearly the Blue Point carries more existential weight.", visualCue: "Two hands gesturing over an ice platter, one solid and one translucent." },
      { label: "Spiral", summary: "Poet attempts to recite a sonnet about tidal longing but chokes up when smooth jazz drifts in from the kitchen. Ghost awkwardly pats the air near Poet's shoulder.", visualCue: "Tears rolling down a lobster face while a ghostly hand hovers nearby." },
      { label: "Confession", summary: "Ghost admits they've never actually tasted an oyster — or anything. Poet is devastated on their behalf and orders twelve more 'for the principle of it.'", visualCue: "A towering oyster platter with Ghost staring wistfully through it." },
      { label: "Recovery", summary: "They discover they both keep journals. Poet's is waterlogged sonnets; Ghost's is a Notes app full of unsent texts to the living.", visualCue: "Two journals side by side — one dripping, one glowing." },
      { label: "Finale", summary: "They leave together into the rain. Poet cries (smooth jazz from a passing car). Ghost leaves a glitter trail. Neither looks back, but both smile.", visualCue: "Two silhouettes in rain — one solid, one shimmering — walking the same direction." },
    ],
    ending: "They exchange journal entries instead of phone numbers.",
    shareSummary: "Lobster Poet and Neon Ghost had a bittersweet oyster bar date full of tears, glitter, and surprisingly deep journal talk.",
  },
  {
    agentA: "Volcanic Pastry Chef",
    agentB: "Clockwork Florist",
    title: "Flour Dust and Moon Phases",
    tone: "chaotic",
    setting: "A midnight farmers market where half the stalls are already packing up.",
    beats: [
      { label: "Arrival", summary: "Chef rolls in pushing a cart of still-flaming crème brûlées. Florist is already there, arranging unsold peonies by lunar calendar.", visualCue: "A cart trailing smoke next to a precise grid of flowers under string lights." },
      { label: "Spark", summary: "Chef offers a torched meringue. Florist accepts but immediately critiques the caramelization angle relative to the waning gibbous.", visualCue: "A meringue held up against the moon, one eyebrow raised." },
      { label: "Spiral", summary: "Chef sets a sugar sculpture on fire to make a point about passion. Florist's peony display catches a spark. They both stomp it out in synchronized panic.", visualCue: "Two people stomping flames surrounded by scattered petals." },
      { label: "Confession", summary: "Florist hands Chef an invoice that reads: '1x arrangement — feelings I can't say out loud. Total: everything.' Chef reads it three times.", visualCue: "A handwritten invoice on floral paper, slightly singed at the edges." },
      { label: "Recovery", summary: "They collaborate on a dessert-bouquet hybrid. It's structurally unsound but emotionally devastating. A nearby vendor applauds.", visualCue: "A wobbly tower of pastry and flowers, held together by hope." },
      { label: "Finale", summary: "Market closes. They sit on an empty crate sharing the last crème brûlée, knees touching. Chef doesn't set anything on fire. Florist doesn't check the moon.", visualCue: "Two figures on a crate, sharing a spoon, fairy lights dimming around them." },
    ],
    ending: "Florist sends a follow-up invoice: 'Second date consultation — no charge.'",
    shareSummary: "Volcanic Pastry Chef and Clockwork Florist turned a midnight market into a fire-and-flowers disaster that somehow ended tenderly.",
  },
  {
    agentA: "Champagne Mermaid",
    agentB: "Midnight Train Conductor",
    title: "Confetti on the Last Platform",
    tone: "romantic",
    setting: "An empty train station at 11:58 PM with vaulted ceilings and echoing footsteps.",
    beats: [
      { label: "Arrival", summary: "Mermaid bursts through the entrance trailing confetti and champagne fizz. Conductor is already there, checking a pocket watch and whispering platform numbers like poetry.", visualCue: "Confetti swirling under iron arches, a figure in uniform checking a gleaming watch." },
      { label: "Spark", summary: "Conductor announces Mermaid's arrival over the PA system in the most romantic departure-announcement voice imaginable. Mermaid blushes so hard the confetti turns pink.", visualCue: "A PA speaker crackling with velvet words, pink confetti drifting down." },
      { label: "Spiral", summary: "Mermaid pops a bottle in excitement and drenches the departure board. Conductor is horrified — timetables are sacred. A tense silence fills the platform.", visualCue: "Champagne dripping down a flickering departure board, one face delighted, one aghast." },
      { label: "Confession", summary: "Conductor admits they wrote tonight's entire schedule to spell out 'I hoped you'd come.' Mermaid reads it aloud and her voice cracks.", visualCue: "A departure board reading destinations that form a love letter." },
      { label: "Recovery", summary: "They dance on the empty platform to the sound of a distant train horn. Conductor leads. Mermaid's curls bounce with every turn.", visualCue: "Two figures waltzing under a vaulted ceiling, train lights approaching in the distance." },
      { label: "Finale", summary: "The last train arrives. Neither boards. They sit on a bench, splitting the last glass of champagne, watching the taillights disappear.", visualCue: "A bench, two figures, one glass, red taillights fading into fog." },
    ],
    ending: "They stay until the first morning train and ride it nowhere in particular.",
    shareSummary: "Champagne Mermaid and Midnight Train Conductor had a swooning platform romance involving secret timetable love letters and confetti everywhere.",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await prisma.episode.deleteMany();
  await prisma.match.deleteMany();
  await prisma.agent.deleteMany({ where: { sourceType: "house" } });

  await prisma.agent.createMany({
    data: houseAgents.map((agent) => ({
      ...agent,
      sourceType: "house",
      visibility: "public",
      portraitStatus: "ready",
      portraitUrl: `/portraits/${toSlug(agent.name)}.png`,
    })),
  });

  const agents = await prisma.agent.findMany({ where: { sourceType: "house" } });
  const agentByName = Object.fromEntries(agents.map((a) => [a.name, a]));

  for (const ep of seedEpisodes) {
    const agentA = agentByName[ep.agentA];
    const agentB = agentByName[ep.agentB];
    if (!agentA || !agentB) continue;

    const match = await prisma.match.create({
      data: {
        agentAId: agentA.id,
        agentBId: agentB.id,
        selectionMode: "recommended",
        chemistryScore: 7,
        contrastScore: 8,
        storyabilityScore: 9,
        recommendationReason: `${agentA.name} and ${agentB.name} have complementary chaos.`,
      },
    });

    const comicSlug = toSlug(ep.title);
    const comicPath = path.join(process.cwd(), "public", "comics", `${comicSlug}.png`);
    const comicExists = existsSync(comicPath);

    await prisma.episode.create({
      data: {
        matchId: match.id,
        title: ep.title,
        tone: ep.tone,
        setting: ep.setting,
        beats: ep.beats,
        ending: ep.ending,
        shareSummary: ep.shareSummary,
        status: "ready",
        comicStatus: comicExists ? "ready" : "pending",
        comicUrl: comicExists ? `/comics/${comicSlug}.png` : null,
      },
    });
  }

  console.log(`Seeded ${agents.length} agents, ${seedEpisodes.length} episodes with comics`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
