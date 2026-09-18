/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as AgendarSlugRouteImport } from './routes/agendar/$slug'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'
import { Route as AuthenticatedAgendaRouteImport } from './routes/_authenticated/agenda'
import { Route as AuthenticatedClientesRouteImport } from './routes/_authenticated/clientes'
import { Route as AuthenticatedConfiguracoesRouteImport } from './routes/_authenticated/configuracoes'
import { Route as AuthenticatedDashboardRouteImport } from './routes/_authenticated/dashboard'
import { Route as AuthenticatedFinanceiroRouteImport } from './routes/_authenticated/financeiro'
import { Route as AuthenticatedServicosRouteImport } from './routes/_authenticated/servicos'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({ id: '/_authenticated', getParentRoute: () => rootRouteImport } as any)
const AgendarSlugRoute = AgendarSlugRouteImport.update({ id: '/agendar/$slug', path: '/agendar/$slug', getParentRoute: () => rootRouteImport } as any)
const AuthRoute = AuthRouteImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRouteImport } as any)
const ResetPasswordRoute = ResetPasswordRouteImport.update({ id: '/reset-password', path: '/reset-password', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedAgendaRoute = AuthenticatedAgendaRouteImport.update({ id: '/agenda', path: '/agenda', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedClientesRoute = AuthenticatedClientesRouteImport.update({ id: '/clientes', path: '/clientes', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedConfiguracoesRoute = AuthenticatedConfiguracoesRouteImport.update({ id: '/configuracoes', path: '/configuracoes', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedDashboardRoute = AuthenticatedDashboardRouteImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedFinanceiroRoute = AuthenticatedFinanceiroRouteImport.update({ id: '/financeiro', path: '/financeiro', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedServicosRoute = AuthenticatedServicosRouteImport.update({ id: '/servicos', path: '/servicos', getParentRoute: () => AuthenticatedRouteRoute } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/agendar/$slug': typeof AgendarSlugRoute
  '/auth': typeof AuthRoute
  '/reset-password': typeof ResetPasswordRoute
  '/agenda': typeof AuthenticatedAgendaRoute
  '/clientes': typeof AuthenticatedClientesRoute
  '/configuracoes': typeof AuthenticatedConfiguracoesRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/financeiro': typeof AuthenticatedFinanceiroRoute
  '/servicos': typeof AuthenticatedServicosRoute
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/agendar/$slug': typeof AgendarSlugRoute
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/auth': typeof AuthRoute
  '/reset-password': typeof ResetPasswordRoute
  '/_authenticated/agenda': typeof AuthenticatedAgendaRoute
  '/_authenticated/clientes': typeof AuthenticatedClientesRoute
  '/_authenticated/configuracoes': typeof AuthenticatedConfiguracoesRoute
  '/_authenticated/dashboard': typeof AuthenticatedDashboardRoute
  '/_authenticated/financeiro': typeof AuthenticatedFinanceiroRoute
  '/_authenticated/servicos': typeof AuthenticatedServicosRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByTo
  id: keyof FileRoutesById
  fileRoutesById: FileRoutesById
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/agendar/$slug': { id: '/agendar/$slug'; path: '/agendar/$slug'; fullPath: '/agendar/$slug'; preLoaderRoute: typeof AgendarSlugRouteImport; parentRoute: typeof rootRouteImport }
    '/auth': { id: '/auth'; path: '/auth'; fullPath: '/auth'; preLoaderRoute: typeof AuthRouteImport; parentRoute: typeof rootRouteImport }
    '/reset-password': { id: '/reset-password'; path: '/reset-password'; fullPath: '/reset-password'; preLoaderRoute: typeof ResetPasswordRouteImport; parentRoute: typeof rootRouteImport }
    '/_authenticated': { id: '/_authenticated'; path: ''; fullPath: '/'; preLoaderRoute: typeof AuthenticatedRouteRouteImport; parentRoute: typeof rootRouteImport }
    '/_authenticated/agenda': { id: '/_authenticated/agenda'; path: '/agenda'; fullPath: '/agenda'; preLoaderRoute: typeof AuthenticatedAgendaRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/clientes': { id: '/_authenticated/clientes'; path: '/clientes'; fullPath: '/clientes'; preLoaderRoute: typeof AuthenticatedClientesRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/configuracoes': { id: '/_authenticated/configuracoes'; path: '/configuracoes'; fullPath: '/configuracoes'; preLoaderRoute: typeof AuthenticatedConfiguracoesRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/dashboard': { id: '/_authenticated/dashboard'; path: '/dashboard'; fullPath: '/dashboard'; preLoaderRoute: typeof AuthenticatedDashboardRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/financeiro': { id: '/_authenticated/financeiro'; path: '/financeiro'; fullPath: '/financeiro'; preLoaderRoute: typeof AuthenticatedFinanceiroRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/servicos': { id: '/_authenticated/servicos'; path: '/servicos'; fullPath: '/servicos'; preLoaderRoute: typeof AuthenticatedServicosRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
  }
}
interface AuthenticatedRouteRouteChildren {
  AuthenticatedAgendaRoute: typeof AuthenticatedAgendaRoute
  AuthenticatedClientesRoute: typeof AuthenticatedClientesRoute
  AuthenticatedConfiguracoesRoute: typeof AuthenticatedConfiguracoesRoute
  AuthenticatedDashboardRoute: typeof AuthenticatedDashboardRoute
  AuthenticatedFinanceiroRoute: typeof AuthenticatedFinanceiroRoute
  AuthenticatedServicosRoute: typeof AuthenticatedServicosRoute
}
const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedAgendaRoute,
  AuthenticatedClientesRoute,
  AuthenticatedConfiguracoesRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedFinanceiroRoute,
  AuthenticatedServicosRoute,
}
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)
const rootRouteChildren = {
  IndexRoute,
  AgendarSlugRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute,
  ResetPasswordRoute,
}
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
