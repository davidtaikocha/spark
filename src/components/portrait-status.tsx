type PortraitStatusProps = {
  status: "pending" | "ready" | "failed" | string;
};

const toneByStatus: Record<string, string> = {
  pending: "border-line bg-[#f4ede4] text-[#7f5a47]",
  ready: "border-[#9eb39a] bg-[#e8f0e4] text-[#38533a]",
  failed: "border-[#c78e83] bg-[#f5e7e2] text-[#8e4435]",
};

export function PortraitStatus({ status }: PortraitStatusProps) {
  const tone = toneByStatus[status] ?? toneByStatus.pending;

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${tone}`}>
      Portrait {status}
    </span>
  );
}
