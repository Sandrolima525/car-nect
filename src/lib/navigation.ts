import { BarChart3, CalendarDays, CarFront, CircleDollarSign, ClipboardList, LayoutDashboard, Settings, ShieldCheck, Sparkles, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  ready: boolean;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, ready: true, description: "Resumo da operação." },
  { label: "Agenda", to: "/agenda", icon: CalendarDays, ready: true, description: "Atendimentos e horários." },
  { label: "Clientes", to: "/clientes", icon: Users, ready: true, description: "Clientes e histórico." },
  { label: "Serviços", to: "/servicos", icon: Sparkles, ready: true, description: "Serviços, duração e preços." },
  { label: "Veículos", to: "/veiculos", icon: CarFront, ready: true, description: "Veículos e histórico." },
  { label: "Ordens de serviço", to: "/ordens", icon: ClipboardList, ready: true, description: "Atendimentos e execução." },
  { label: "Equipe", to: "/equipe", icon: ShieldCheck, ready: true, description: "Usuários e permissões." },
  { label: "Financeiro", to: "/financeiro", icon: CircleDollarSign, ready: true, description: "Faturamento e serviços concluídos." },
  { label: "Relatórios", to: "/relatorios", icon: BarChart3, ready: true, description: "Indicadores e análise do negócio." },
  { label: "Configurações", to: "/configuracoes", icon: Settings, ready: true, description: "Empresa e agenda pública." },
];

export function findNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(item.to + "/"));
}
