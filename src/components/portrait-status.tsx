type PortraitStatusProps = {
  status: "pending" | "ready" | "failed" | string;
};

const toneByStatus: Record<string, string> = {
  pending: "bg-gold/15 text-gold border-gold/20",
  ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  failed: "bg-rose/15 text-rose border-rose/20",
};

export function PortraitStatus({ status }: PortraitStatusProps) {
  const tone = toneByStatus[status] ?? toneByStatus.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "ready"
            ? "bg-emerald-400"
            : status === "failed"
              ? "bg-rose"
              : "bg-gold animate-pulse-soft"
        }`}
      />
      Portrait {status}
    </span>
  );
}
