import { CalendarDays, CircleDollarSign, LayoutDashboard, Settings, Sparkles, Users, type LucideIcon } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
export type NavItem={label:string;to:NonNullable<LinkProps["to"]>;icon:LucideIcon;ready:boolean;description:string};
export const NAV_ITEMS:NavItem[]=[
 {label:"Dashboard",to:"/dashboard",icon:LayoutDashboard,ready:true,description:"Resumo da operação."},
 {label:"Agenda",to:"/agenda",icon:CalendarDays,ready:true,description:"Atendimentos e horários."},
 {label:"Clientes",to:"/clientes",icon:Users,ready:true,description:"Clientes e histórico."},
 {label:"Serviços",to:"/servicos",icon:Sparkles,ready:true,description:"Serviços, duração e preços."},
 {label:"Financeiro",to:"/financeiro",icon:CircleDollarSign,ready:true,description:"Faturamento e serviços concluídos."},
 {label:"Configurações",to:"/configuracoes",icon:Settings,ready:true,description:"Empresa e agenda pública."},
];
export function findNavItem(pathname:string){return NAV_ITEMS.find(item=>pathname===item.to||pathname.startsWith(item.to+"/"));}