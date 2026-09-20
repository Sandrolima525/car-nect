import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, Waves } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { NAV_ITEMS, findNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/types/database";
import { brandCssVariables, DEFAULT_BRAND, type BrandColors } from "@/lib/branding";
import { supabase } from "@/integrations/supabase/client";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, company, signOut } = useAuth();
  const displayName = profile?.full_name ?? profile?.email ?? "Usuário";
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border/70 bg-gradient-to-br from-primary/[0.10] to-transparent px-5 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-background shadow-lg ring-4 ring-primary/10">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company?.name ?? "Logo da empresa"} className="h-full w-full object-cover" />
            ) : (
              <Waves className="h-7 w-7 text-primary" />
            )}
          </div>
          <div className="min-w-0 max-w-full">
            <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">{company?.name ?? "Empresa"}</p>
            <p className="text-xs text-sidebar-foreground/55">Gestão automotiva</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">Menu principal</p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} onClick={onNavigate}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/65 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeProps={{ className: "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold bg-primary/15 text-sidebar-foreground shadow-sm" }}>
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
              <span className="flex-1 truncate">{item.label}</span>
              {!item.ready && <span className="rounded-md bg-sidebar-foreground/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sidebar-foreground/45">Em breve</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border bg-sidebar/60 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-foreground/10 text-xs font-bold text-sidebar-foreground">{initials(displayName) || "U"}</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-sidebar-foreground">{displayName}</p><p className="truncate text-xs text-sidebar-foreground/50">{profile ? ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] : "—"}</p></div>
        </div>
        <p className="mb-3 truncate text-[11px] text-sidebar-foreground/40">{company?.trade_name ?? company?.name ?? "Sem empresa vinculada"}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={() => void signOut()}><LogOut className="h-4 w-4" />Sair</Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, company, signOut } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brand, setBrand] = useState<BrandColors>(DEFAULT_BRAND);
  const current = findNavItem(pathname);
  const displayName = profile?.full_name ?? profile?.email ?? "Usuário";
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (!company?.id) return;
    const loadBrand = async () => {
      const { data } = await (supabase as any).from("companies").select("brand_colors").eq("id", company.id).maybeSingle();
      if (data?.brand_colors) setBrand({ ...DEFAULT_BRAND, ...data.brand_colors });
    };
    void loadBrand();
    const onBrandUpdate = (event: Event) => {
      const colors = (event as CustomEvent<BrandColors>).detail;
      if (colors) setBrand({ ...DEFAULT_BRAND, ...colors });
    };
    window.addEventListener("brand-theme-updated", onBrandUpdate);
    return () => window.removeEventListener("brand-theme-updated", onBrandUpdate);
  }, [company?.id]);

  return (
    <div style={brandCssVariables(brand)} className="flex min-h-[100dvh] min-w-0 bg-gradient-to-br from-background via-background to-primary/[0.035]">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border/70 bg-sidebar/95 shadow-xl shadow-black/[0.04] lg:block"><div className="sticky top-0 h-screen"><SidebarContent /></div></aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-[4.25rem] items-center gap-2 border-b border-border/60 bg-background/85 px-3 py-2 shadow-sm backdrop-blur-2xl sm:gap-3 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl lg:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0"><SheetTitle className="sr-only">Menu de navegação</SheetTitle><SidebarContent onNavigate={() => setMobileOpen(false)} /></SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">{current?.label ?? company?.name ?? "Empresa"}</h1>
            {current && current.to !== "/dashboard" && <Breadcrumb className="hidden sm:block"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to="/dashboard">Início</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{current.label}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>}
          </div>
      <DropdownMenu>
            <DropdownMenuTrigger asChild><button type="button" className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:shadow-md hover:shadow-primary/20")} aria-label="Menu do usuário">{initials(displayName) || "U"}</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel><span className="block truncate">{displayName}</span><span className="block text-xs font-normal text-muted-foreground">{profile ? ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] : "—"}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
