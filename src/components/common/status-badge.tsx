import { CheckCircle2, Clock, PackageCheck, Timer, XCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ServiceOrderStatus } from "@/types/database";

const STATUS_MAP: Record<
  ServiceOrderStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "border-warning/40 bg-warning/10 text-warning-foreground",
  },
  in_progress: {
    label: "Em andamento",
    icon: Timer,
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  completed: {
    label: "Concluído",
    icon: CheckCircle2,
    className: "border-success/40 bg-success/10 text-success-foreground",
  },
  delivered: {
    label: "Entregue",
    icon: PackageCheck,
    className: "border-border bg-muted text-foreground",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

export function StatusBadge({ status }: { status: ServiceOrderStatus }) {
  const config = STATUS_MAP[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([key, value]) => [key, value.label]),
) as Record<ServiceOrderStatus, string>;
