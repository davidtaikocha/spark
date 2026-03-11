import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Comic SVG Builder
// ---------------------------------------------------------------------------

const PAGE_W = 640;
const PAGE_H = 960;
const M = 15;
const CW = PAGE_W - 2 * M;
const GAP = 8;
const HW = Math.floor((CW - GAP) / 2);

const PANELS = [
  { x: M, y: 58, w: CW, h: 175 },
  { x: M, y: 241, w: HW, h: 155 },
  { x: M + HW + GAP, y: 241, w: HW, h: 155 },
  { x: M, y: 404, w: HW, h: 155 },
  { x: M + HW + GAP, y: 404, w: HW, h: 155 },
  { x: M, y: 567, w: CW, h: 175 },
];

function esc(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur.length + w.length + 1 > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function speechBubble(
  text: string,
  cx: number,
  cy: number,
  speaker: "A" | "B" | "narration",
  panelW: number,
) {
  const maxChars = panelW > 400 ? 38 : 24;
  const lines = wrapText(text, maxChars);
  const lineH = 16;
  const pad = 12;
  const bw = Math.min(panelW - 30, maxChars * 7.2 + 2 * pad);
  const bh = lines.length * lineH + 2 * pad;
  const bx = cx - bw / 2;
  const by = cy;
  const textLines = lines
    .map(
      (line, i) =>
        `<text x="${cx}" y="${by + pad + 13 + i * lineH}" text-anchor="middle" fill="${speaker === "narration" ? "#78350f" : "#222"}" font-size="11" font-family="${speaker === "narration" ? "Georgia, serif" : "'Comic Sans MS', 'Chalkboard SE', cursive"}"${speaker === "narration" ? ' font-style="italic"' : ""}>${esc(line)}</text>`,
    )
    .join("\n");

  if (speaker === "narration") {
    return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="#fef3c7" stroke="#92400e" stroke-width="1.2"/>
${textLines}`;
  }

  const tailX = speaker === "A" ? bx + 28 : bx + bw - 28;
  const tailD = speaker === "A" ? -1 : 1;
  return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="14" fill="white" stroke="#333" stroke-width="1.5"/>
<polygon points="${tailX - 5},${by + bh - 1} ${tailX + 5},${by + bh - 1} ${tailX + 10 * tailD},${by + bh + 11}" fill="white" stroke="#333" stroke-width="1.5"/>
<rect x="${tailX - 6}" y="${by + bh - 3}" width="12" height="5" fill="white"/>
${textLines}`;
}

function narrationLabel(label: string, x: number, y: number) {
  const w = label.length * 8.5 + 18;
  return `<rect x="${x}" y="${y}" width="${w}" height="22" rx="2" fill="#fbbf24" stroke="#92400e" stroke-width="1"/>
<text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" fill="#78350f" font-size="10" font-weight="bold" font-family="Georgia, serif">${esc(label.toUpperCase())}</text>`;
}

function sfxText(text: string, x: number, y: number, color: string, rot = 0) {
  const tr = rot ? ` transform="rotate(${rot}, ${x}, ${y})"` : "";
  return `<text x="${x}" y="${y}" fill="${color}" font-size="20" font-weight="bold" font-family="Impact, sans-serif" text-anchor="middle" opacity="0.85"${tr}>${esc(text)}</text>`;
}

type BeatData = {
  label: string;
  dialogue: string;
  speaker: "A" | "B" | "narration";
  sfx?: string;
  sfxColor?: string;
};

type Palette = {
  page: string;
  title: string;
  titleText: string;
  panels: string[];
  accent: string;
};

function buildComicSvg(
  title: string,
  agentA: string,
  agentB: string,
  beats: BeatData[],
  palette: Palette,
) {
  const defs = `<defs>
  <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="3" cy="3" r="0.7" fill="rgba(0,0,0,0.1)"/>
  </pattern>
  <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
  </pattern>
</defs>`;

  const titleBanner = `<rect x="0" y="0" width="${PAGE_W}" height="52" fill="${palette.title}"/>
<rect x="0" y="0" width="${PAGE_W}" height="52" fill="url(#dots)" opacity="0.5"/>
<rect x="0" y="48" width="${PAGE_W}" height="4" fill="rgba(0,0,0,0.3)"/>
<text x="${PAGE_W / 2}" y="34" text-anchor="middle" fill="${palette.titleText}" font-size="19" font-weight="bold" font-family="Impact, 'Arial Black', sans-serif" letter-spacing="2">${esc(title.toUpperCase())}</text>`;

  const panelsSvg = beats.slice(0, 6).map((beat, i) => {
    const p = PANELS[i];
    const bg = palette.panels[i % palette.panels.length];
    const parts: string[] = [];

    // Panel background + border
    parts.push(`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="3" fill="${bg}" stroke="#111" stroke-width="3.5"/>`);
    parts.push(`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="3" fill="url(#dots)" opacity="0.25"/>`);

    // Narration label
    parts.push(narrationLabel(beat.label, p.x + 7, p.y + 8));

    // Speech bubble
    const bubbleCx =
      beat.speaker === "A"
        ? p.x + p.w * 0.4
        : beat.speaker === "B"
          ? p.x + p.w * 0.6
          : p.x + p.w / 2;
    parts.push(speechBubble(beat.dialogue, bubbleCx, p.y + 40, beat.speaker, p.w));

    // Character label
    if (beat.speaker !== "narration") {
      const name = beat.speaker === "A" ? agentA : agentB;
      const lx = beat.speaker === "A" ? p.x + 12 : p.x + p.w - 12;
      const anchor = beat.speaker === "A" ? "start" : "end";
      parts.push(
        `<text x="${lx}" y="${p.y + p.h - 10}" text-anchor="${anchor}" fill="${palette.accent}" font-size="8" font-weight="bold" font-family="'Courier New', monospace" letter-spacing="1.5" opacity="0.8">${esc(name.toUpperCase())}</text>`,
      );
    }

    // SFX
    if (beat.sfx) {
      const sx = beat.speaker === "A" ? p.x + p.w * 0.82 : p.x + p.w * 0.18;
      const sy = p.y + p.h * 0.72;
      parts.push(sfxText(beat.sfx, sx, sy, beat.sfxColor ?? "#ff6b6b", -10));
    }

    return `<g>\n${parts.join("\n")}\n</g>`;
  });

  const footerY = PANELS[5].y + PANELS[5].h + 30;
  const footer = `<text x="${PAGE_W / 2}" y="${footerY}" text-anchor="middle" fill="${palette.accent}" font-size="10" font-family="Georgia, serif" letter-spacing="2.5" opacity="0.7">${esc(agentA.toUpperCase())}  &amp;  ${esc(agentB.toUpperCase())}</text>
<text x="${PAGE_W / 2}" y="${footerY + 32}" text-anchor="middle" fill="rgba(255,255,255,0.18)" font-size="26" font-weight="bold" font-family="Impact, sans-serif" letter-spacing="6">THE END</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
${defs}
<rect width="${PAGE_W}" height="${PAGE_H}" fill="${palette.page}"/>
<rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#scanlines)"/>
${titleBanner}
${panelsSvg.join("\n")}
${footer}
</svg>`;
}

function comicToDataUri(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
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
    dialogue: [
      { label: "Arrival", dialogue: "Mirror, mirror... am I early enough to rehearse twice?", speaker: "A" as const, sfx: "POOF!", sfxColor: "#a78bfa" },
      { label: "Spark", dialogue: "It's obviously the Kumamoto. It carries an oceanic melancholy.", speaker: "B" as const },
      { label: "Spiral", dialogue: "Is that... is that smooth jazz?!", speaker: "A" as const, sfx: "JAZZ", sfxColor: "#60a5fa" },
      { label: "Confession", dialogue: "I've never actually tasted anything. Not once.", speaker: "B" as const },
      { label: "Recovery", dialogue: "My journal's all waterlogged sonnets. Yours?", speaker: "A" as const },
      { label: "Finale", dialogue: "Neither looked back. Both smiled.", speaker: "narration" as const, sfx: "drip drip", sfxColor: "#93c5fd" },
    ],
    palette: {
      page: "#0f172a",
      title: "#7c2d12",
      titleText: "#fef3c7",
      panels: ["#1e3a5f", "#1a3550", "#2d1b4e", "#1b3a4b", "#1e2d4a", "#162035"],
      accent: "#fbbf24",
    },
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
    dialogue: [
      { label: "Arrival", dialogue: "STAND BACK. Art is incoming and it is ON FIRE.", speaker: "A" as const, sfx: "FWOOSH!", sfxColor: "#f97316" },
      { label: "Spark", dialogue: "The caramelization angle is all wrong for a waning gibbous.", speaker: "B" as const },
      { label: "Spiral", dialogue: "They both stomp in synchronized panic.", speaker: "narration" as const, sfx: "STOMP!", sfxColor: "#ef4444" },
      { label: "Confession", dialogue: "1x feelings I can't say out loud. Total: everything.", speaker: "B" as const },
      { label: "Recovery", dialogue: "It's structurally unsound but emotionally devastating.", speaker: "A" as const, sfx: "*clap*", sfxColor: "#a3e635" },
      { label: "Finale", dialogue: "No fire. No moon check. Just this.", speaker: "narration" as const },
    ],
    palette: {
      page: "#1a0f0a",
      title: "#b91c1c",
      titleText: "#fff7ed",
      panels: ["#4a2010", "#2d3a1a", "#3d1a0a", "#1a3020", "#3a2515", "#1f1510"],
      accent: "#fb923c",
    },
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
    dialogue: [
      { label: "Arrival", dialogue: "I'M HEEERE! Did anyone order sparkle?!", speaker: "A" as const, sfx: "POP!", sfxColor: "#f9a8d4" },
      { label: "Spark", dialogue: "Now arriving on platform 3... the most radiant being in transit.", speaker: "B" as const },
      { label: "Spiral", dialogue: "The TIMETABLES are SACRED!", speaker: "B" as const, sfx: "SPLASH!", sfxColor: "#38bdf8" },
      { label: "Confession", dialogue: "The departure board spelled it out: I HOPED YOU'D COME.", speaker: "narration" as const },
      { label: "Recovery", dialogue: "They danced to the sound of a distant train horn.", speaker: "narration" as const, sfx: "click-clack", sfxColor: "#c4b5fd" },
      { label: "Finale", dialogue: "Neither boards. They split the last glass and watch the taillights fade.", speaker: "narration" as const },
    ],
    palette: {
      page: "#0c0a1a",
      title: "#7e22ce",
      titleText: "#f5f3ff",
      panels: ["#1e1145", "#2a1250", "#1a1040", "#251348", "#1c1042", "#150e35"],
      accent: "#e9d5ff",
    },
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
      portraitUrl: `/portraits/${toSlug(agent.name)}.svg`,
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

    const comicSvg = buildComicSvg(ep.title, ep.agentA, ep.agentB, ep.dialogue, ep.palette);

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
        comicStatus: "ready",
        comicUrl: comicToDataUri(comicSvg),
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
