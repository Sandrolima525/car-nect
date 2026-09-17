import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/types/database";

const NAV_ITEMS = [{ label: "Painel", to: "/dashboard" as const }];

const SOON = [
  "Clientes",
  "Veículos",
  "Serviços",
  "Ordens de serviço",
  "Agenda",
  "Funcionários",
  "Financeiro",
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, company, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="border-b border-sidebar-border bg-sidebar px-4 py-5 lg:w-64 lg:border-b-0 lg:border-r">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">LavaPro</p>
        <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground">
          {company?.trade_name ?? company?.name ?? "Sem empresa"}
        </p>

        <nav className="mt-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 hidden lg:block">
          <p className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground">Em breve</p>
          <ul className="mt-2 space-y-1">
            {SOON.map((item) => (
              <li key={item} className="px-3 py-1.5 text-sm text-muted-foreground/60">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.full_name ?? profile?.email ?? "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile ? ROLE_LABELS[profile.role] : "—"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Sair
          </Button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
