import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  planned,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  planned: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-card p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-card-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          O que vem neste módulo
        </p>
        <ul className="mt-2 space-y-1.5">
          {planned.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">Voltar ao dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
