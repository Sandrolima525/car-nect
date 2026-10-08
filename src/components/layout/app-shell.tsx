import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Waves, Clock3, MessageCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type Notification = { id: string; appointment_id: string | null; type: string; title: string; message: string; read_at: string | null; created_at: string };
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
import { exitCompanyAsMaster } from "@/services/company";

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
  const [masterMode, setMasterMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const current = findNavItem(pathname);
  const displayName = profile?.full_name ?? profile?.email ?? "Usuário";
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    void supabase.rpc("is_platform_admin").then(({ data }) => setMasterMode(data === true));
  }, []);
  useEffect(() => {
    if (!company?.id) { setNotifications([]); return; }
    let active = true;
    const loadNotifications = async () => {
      const { data } = await supabase.from("notifications").select("id,appointment_id,type,title,message,read_at,created_at").eq("company_id", company.id).order("created_at", { ascending: false }).limit(30);
      if (active) setNotifications((data ?? []) as Notification[]);
    };
    void loadNotifications();
    const channel = supabase.channel("company-notifications-" + company.id).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "company_id=eq." + company.id }, (payload) => {
      setNotifications((current) => [payload.new as Notification, ...current].slice(0, 30));
    }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [company?.id]);

  const unreadNotifications = notifications.filter((item) => !item.read_at).length;
  const markNotificationRead = async (id: string) => {
    const readAt = new Date().toISOString();
    await supabase.from("notifications").update({ read_at: readAt }).eq("id", id);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: readAt } : item));
  };
  const markAllNotificationsRead = async () => {
    const ids = notifications.filter((item) => !item.read_at).map((item) => item.id);
    if (!ids.length) return;
    const readAt = new Date().toISOString();
    await supabase.from("notifications").update({ read_at: readAt }).in("id", ids);
    setNotifications((current) => current.map((item) => ids.includes(item.id) ? { ...item, read_at: readAt } : item));
  };

  useEffect(() => {
    if (!company?.id) { setAccessExpiresAt(null); return; }
    let active = true;
    const loadAccess = async () => {
      const { data, error } = await supabase.from("companies").select("access_expires_at").eq("id", company.id).maybeSingle();
      if (active) setAccessExpiresAt(!error && data?.access_expires_at ? data.access_expires_at : null);
    };
    void loadAccess();
    return () => { active = false; };
  }, [company?.id]);

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
    <div style={brandCssVariables(brand)} className="flex min-h-screen bg-gradient-to-br from-background via-background to-primary/[0.035]">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border/70 bg-sidebar/95 shadow-xl shadow-black/[0.04] lg:block"><div className="sticky top-0 h-screen"><SidebarContent /></div></aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[4.25rem] items-center gap-3 border-b border-border/60 bg-background/80 px-4 shadow-sm backdrop-blur-2xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl lg:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0"><SheetTitle className="sr-only">Menu de navegação</SheetTitle><SidebarContent onNavigate={() => setMobileOpen(false)} /></SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">{current?.label ?? company?.name ?? "Empresa"}</h1>
            {current && current.to !== "/dashboard" && <Breadcrumb className="hidden sm:block"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to="/dashboard">Início</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{current.label}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>}
          </div>
      <div className="flex items-center gap-2">
          {profile?.role !== "master" && accessExpiresAt && (() => {
            const remainingDays = Math.max(0, Math.ceil((new Date(accessExpiresAt).getTime() - Date.now()) / 86400000));
            const warning = remainingDays <= 7;
            const urgent = remainingDays <= 3;
            const label = remainingDays === 0 ? "Expirado" : `${remainingDays} ${remainingDays === 1 ? "dia" : "dias"}`;
            return <div title={`Acesso válido até ${new Date(accessExpiresAt).toLocaleDateString("pt-BR")}`} className={cn("flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold shadow-sm", urgent ? "border-destructive/30 bg-destructive/10 text-destructive" : warning ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" : "border-primary/20 bg-primary/10 text-primary")}><Clock3 className="h-4 w-4 shrink-0" /><span className="hidden sm:inline">Acesso:</span><span>{label}</span></div>;
          })()}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild><button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground" aria-label="Notificações"><Bell className="h-[18px] w-[18px]" />{unreadNotifications > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(360px,calc(100vw-1.5rem))] p-0">
              <div className="flex items-center justify-between border-b px-4 py-3"><div><p className="font-semibold">Notificações</p><p className="text-xs text-muted-foreground">{unreadNotifications ? unreadNotifications + " nova(s)" : "Tudo em dia"}</p></div>{unreadNotifications > 0 && <button type="button" onClick={() => void markAllNotificationsRead()} className="text-xs font-semibold text-primary hover:underline">Marcar como lidas</button>}</div>
              <div className="max-h-[min(420px,60vh)] overflow-y-auto">
                {notifications.length === 0 ? <div className="px-4 py-10 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-7 w-7 opacity-40" />Nenhuma notificação ainda.</div> : notifications.map((item) => <button key={item.id} type="button" onClick={() => void markNotificationRead(item.id)} className={cn("flex w-full gap-3 border-b px-4 py-3 text-left transition hover:bg-muted/60", !item.read_at && "bg-primary/[0.06]")}><span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", item.read_at ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-sm">{item.title}</strong>{!item.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.message}</span><span className="mt-1 block text-[10px] text-muted-foreground/70">{new Date(item.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></span></button>)}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:shadow-md hover:shadow-primary/20")} aria-label="Menu do usuário">{initials(displayName) || "U"}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel><span className="block truncate">{displayName}</span><span className="block text-xs font-normal text-muted-foreground">{profile ? ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] : "—"}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
          {masterMode && <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0"><p className="text-sm font-semibold">Modo Master ativo</p><p className="text-xs text-muted-foreground">Você está acessando esta empresa pelo painel administrativo.</p></div>
            <Button size="sm" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={async () => { await exitCompanyAsMaster(); location.href = "/admin"; }}>Voltar ao Master</Button>
          </div>}
          {children}
        </main>
      </div>
    </div>
  );
}
