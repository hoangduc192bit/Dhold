import { statusMeta } from "../lib/contract";

export default function StatusBadge({ status, size = "md" }: { status: number; size?: "sm" | "md" }) {
  const m = statusMeta(status);
  return (
    <span className={`badge border ${m.bg} ${m.color} ${size === "sm" ? "text-[10px] px-2 py-0.5" : ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${status === 0 ? "dot-pulse" : ""}`} />
      {m.label}
    </span>
  );
}
