import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = { label: string; value: string; hint?: string; icon: LucideIcon; loading?: boolean; accent?: boolean; };

export function StatCard({ label, value, hint, icon: Icon, loading, accent }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-3xl font-bold tracking-tight text-card-foreground">{value}</p>}
          {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
