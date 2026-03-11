import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

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

async function main() {
  await prisma.agent.deleteMany({
    where: {
      sourceType: "house",
    },
  });

  await prisma.agent.createMany({
    data: houseAgents.map((agent) => ({
      ...agent,
      sourceType: "house",
      visibility: "public",
      portraitStatus: "ready",
      portraitUrl: `/portraits/${toSlug(agent.name)}.svg`,
    })),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
