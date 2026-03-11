"use client";

import { useEffect, useMemo, useState } from "react";

export type OverlayStep = { lines: string[]; delay: number };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const AGENT_STEPS: OverlayStep[] = [
  {
    lines: [
      "Skimming your agent\u2019s autobiography\u2026",
      "Reading the backstory (it\u2019s unhinged)\u2026",
      "Absorbing this character\u2019s entire vibe\u2026",
      "Processing emotional damage\u2026",
    ],
    delay: 0,
  },
  {
    lines: [
      "Identifying personality red flags\u2026",
      "Cataloguing quirks and bad habits\u2026",
      "Running a vibe check (results: chaotic)\u2026",
      "Quantifying emotional instability\u2026",
    ],
    delay: 3000,
  },
  {
    lines: [
      "Polishing the profile until it sparkles\u2026",
      "Making them sound dateable (tough job)\u2026",
      "Giving them a dating-app glow-up\u2026",
      "Assembling a personality from spare parts\u2026",
    ],
    delay: 8000,
  },
  {
    lines: [
      "Painting their face (they won\u2019t sit still)\u2026",
      "Teaching the AI what a lobster in a blazer looks like\u2026",
      "Convincing the portrait machine this is fine\u2026",
      "Rendering cheekbones on a non-human entity\u2026",
      "Drawing someone who\u2019s somehow hot and also a toaster\u2026",
    ],
    delay: 16000,
  },
  {
    lines: [
      "Almost done \u2014 just adding emotional baggage\u2026",
      "Final touch: a hint of romantic doom\u2026",
      "Sprinkling in that main character energy\u2026",
      "Applying the last coat of charisma\u2026",
    ],
    delay: 50000,
  },
];

export const EPISODE_STEPS: OverlayStep[] = [
  {
    lines: [
      "Picking a restaurant neither of them deserves\u2026",
      "Scouting locations for maximum awkwardness\u2026",
      "Finding the worst possible venue for this\u2026",
      "Setting the mood (ominous)\u2026",
    ],
    delay: 0,
  },
  {
    lines: [
      "Writing dialogue that would get you uninvited\u2026",
      "Scripting the most unhinged first impression\u2026",
      "Generating chemistry (and property damage)\u2026",
      "Drafting pickup lines that should be illegal\u2026",
    ],
    delay: 4000,
  },
  {
    lines: [
      "Adding a plot twist nobody asked for\u2026",
      "Inserting catastrophic misunderstandings\u2026",
      "Making sure at least one table gets flipped\u2026",
      "Escalating the situation beyond repair\u2026",
    ],
    delay: 10000,
  },
  {
    lines: [
      "Sketching the disaster in vivid detail\u2026",
      "Teaching the AI to draw emotional wreckage\u2026",
      "Illustrating regrettable life choices\u2026",
      "Rendering the exact moment it all went wrong\u2026",
      "Drawing speech bubbles full of bad decisions\u2026",
    ],
    delay: 20000,
  },
  {
    lines: [
      "Adding sound effects (mostly screaming)\u2026",
      "Inking the tears and confetti\u2026",
      "Polishing the panels \u2014 chef\u2019s kiss\u2026",
      "Final panel: someone is on fire, emotionally\u2026",
    ],
    delay: 55000,
  },
];

function OrbitDot({
  angle,
  radius,
  size,
  color,
  glow,
}: {
  angle: number;
  radius: number;
  size: number;
  color: string;
  glow: string;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        transform: `rotate(${angle}deg) translateY(-${radius}px)`,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${size * 3}px ${glow}, 0 0 ${size * 6}px ${glow}`,
      }}
    />
  );
}

function OrbitRing({
  radius,
  dots,
  dotSize,
  duration,
  color,
  glow,
  reverse,
}: {
  radius: number;
  dots: number;
  dotSize: number;
  duration: number;
  color: string;
  glow: string;
  reverse?: boolean;
}) {
  const angleStep = 360 / dots;
  return (
    <div
      className="absolute inset-0"
      style={{
        animation: `spin ${duration}s linear infinite${reverse ? " reverse" : ""}`,
      }}
    >
      {Array.from({ length: dots }, (_, i) => (
        <OrbitDot
          key={i}
          angle={i * angleStep}
          radius={radius}
          size={dotSize}
          color={color}
          glow={glow}
        />
      ))}
    </div>
  );
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function CreationOverlay({
  active,
  steps = AGENT_STEPS,
  estimateSeconds = 60,
}: {
  active: boolean;
  steps?: OverlayStep[];
  estimateSeconds?: number;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Pick one random line per step on mount
  const pickedLines = useMemo(
    () => (active ? steps.map((s) => pick(s.lines)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active],
  );

  useEffect(() => {
    if (active) {
      setVisible(true);
      setStepIndex(0);
      setElapsed(0);
    } else if (visible) {
      const timeout = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [active, visible]);

  useEffect(() => {
    if (!active) return;

    const timeouts = steps.slice(1).map((step, i) =>
      setTimeout(() => setStepIndex(i + 1), step.delay),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [active, steps]);

  // Elapsed timer
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        active ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/[0.06] blur-[120px]" />
        <div className="absolute left-1/2 top-[45%] h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.04] blur-[100px]" />
      </div>

      {/* Grain */}
      <div className="grain-overlay" />

      {/* Content */}
      <div className="relative flex flex-col items-center">
        {/* Orbit container */}
        <div className="relative h-48 w-48">
          {/* Orbit tracks */}
          <div className="absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03]" />
          <div className="absolute left-1/2 top-1/2 h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03]" />
          <div className="absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03]" />

          {/* Central core */}
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose to-accent opacity-15 blur-xl animate-pulse-soft" />
          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose/80 to-accent/60 opacity-30 blur-md animate-pulse-soft" />
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose to-accent opacity-80" />

          {/* Orbit rings */}
          <OrbitRing
            radius={35}
            dots={3}
            dotSize={5}
            duration={4}
            color="rgb(212, 105, 138)"
            glow="rgba(212, 105, 138, 0.5)"
          />
          <OrbitRing
            radius={58}
            dots={5}
            dotSize={3.5}
            duration={7}
            color="rgb(232, 155, 114)"
            glow="rgba(232, 155, 114, 0.4)"
            reverse
          />
          <OrbitRing
            radius={80}
            dots={4}
            dotSize={2.5}
            duration={12}
            color="rgb(201, 168, 108)"
            glow="rgba(201, 168, 108, 0.3)"
          />
        </div>

        {/* Step text with crossfade */}
        <div className="relative mt-10 h-6 w-80">
          {pickedLines.map((line, i) => (
            <p
              key={line}
              className={`absolute inset-x-0 text-center font-display text-sm tracking-wide transition-all duration-700 ${
                i === stepIndex
                  ? "translate-y-0 opacity-100 text-ink/60"
                  : i < stepIndex
                    ? "-translate-y-3 opacity-0"
                    : "translate-y-3 opacity-0"
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Progress dots */}
        <div className="mt-5 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-700 ${
                i <= stepIndex ? "w-4 bg-rose/50" : "w-1 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Timer + estimate */}
        <p className="mt-6 text-xs tabular-nums text-muted/40">
          {formatElapsed(elapsed)}
          {elapsed < estimateSeconds && (
            <span> / ~{formatElapsed(estimateSeconds)}</span>
          )}
        </p>
      </div>
    </div>
  );
}
