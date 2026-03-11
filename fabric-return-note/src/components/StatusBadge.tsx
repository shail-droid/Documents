import { FabricReturnStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: FabricReturnStatus }) {
  const { label, className } =
    status === "RECEIVED"
      ? { label: "Received", className: "bg-emerald-100 text-emerald-800" }
      : { label: "Pending Receipt", className: "bg-amber-100 text-amber-900" };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className
      ].join(" ")}
    >
      {label}
    </span>
  );
}

