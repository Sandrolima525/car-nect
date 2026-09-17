import {
  CalendarDays,
  Car,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  UserSquare2,
  Wallet,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";

export type NavItem = {
  label: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
  /** Módulo já implementado (false = navegação preparada para o próximo passo). */
  ready: boolean;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    ready: true,
    description: "Visão geral da operação do dia.",
  },
  {
    label: "Clientes",
    to: "/clientes",
    icon: Users,
    ready: false,
    description: "Cadastro e gerenciamento dos clientes da empresa.",
  },
  {
    label: "Veículos",
    to: "/veiculos",
    icon: Car,
    ready: false,
    description: "Veículos vinculados a cada cliente e seu histórico.",
  },
  {
    label: "Serviços",
    to: "/servicos",
    icon: Sparkles,
    ready: false,
    description: "Catálogo de serviços, preços e duração estimada.",
  },
  {
    label: "Ordens de Serviço",
    to: "/ordens",
    icon: ClipboardList,
    ready: false,
    description: "Abertura e acompanhamento dos atendimentos.",
  },
  {
    label: "Agenda",
    to: "/agenda",
    icon: CalendarDays,
    ready: false,
    description: "Agendamentos e organização do dia.",
  },
  {
    label: "Funcionários",
    to: "/funcionarios",
    icon: UserSquare2,
    ready: false,
    description: "Equipe, funções e comissões.",
  },
  {
    label: "Financeiro",
    to: "/financeiro",
    icon: Wallet,
    ready: false,
    description: "Pagamentos e movimentações da empresa.",
  },
  {
    label: "Relatórios",
    to: "/relatorios",
    icon: BarChart3,
    ready: false,
    description: "Indicadores e análises do negócio.",
  },
  {
    label: "Configurações",
    to: "/configuracoes",
    icon: Settings,
    ready: false,
    description: "Dados da empresa e preferências do sistema.",
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}
