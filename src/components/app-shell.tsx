import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Activity, BarChart3, BookOpen, Boxes, Cable, CheckSquare, ClipboardList, GitBranch, LayoutDashboard, LogOut, Settings2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, useRole } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/board", label: "Command board", icon: CheckSquare },
  { to: "/log", label: "Daily log", icon: ClipboardList },
  { to: "/project", label: "Project brief", icon: BookOpen },
  { to: "/use-cases", label: "Use cases", icon: Boxes },
  { to: "/market", label: "Market watch", icon: BarChart3 },
  { to: "/integrations", label: "Integrations", icon: Cable, level: "manage" as const },
  { to: "/admin", label: "Admin & access", icon: ShieldCheck, level: "owner" as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, isOwner, canManage } = useRole();
  const visible = NAV.filter((item) => item.level === "owner" ? isOwner : item.level === "manage" ? canManage : true);
  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }
  return <div className="min-h-screen bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 hidden w-[250px] flex-col border-r border-border bg-sidebar lg:flex">
      <div className="border-b border-border px-5 py-5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded bg-primary text-primary-foreground"><Activity className="h-5 w-5" /></div><div><div className="mono text-sm font-semibold tracking-[0.18em] text-primary">FORMIVA</div><div className="text-[11px] text-muted-foreground">Mission Control / v0.1</div></div></div></div>
      <div className="px-4 pt-5"><div className="mono mb-2 px-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Control room</div><nav className="space-y-1">{visible.map((item) => { const active = pathname === item.to || pathname.startsWith(`${item.to}/`); return <Link key={item.to} to={item.to} className={cn("group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors", active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")}><item.icon className="h-4 w-4" />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}</Link>; })}</nav></div>
      <div className="mt-auto border-t border-border p-4"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold">{(user?.email?.[0] ?? "F").toUpperCase()}</div><div className="min-w-0"><div className="truncate text-xs">{user?.email ?? "Local owner"}</div><div className="mono text-[10px] uppercase tracking-widest text-primary">{role ? ROLE_LABEL[role] : "—"}</div></div></div><Button variant="ghost" size="sm" className="mt-3 w-full justify-start px-1 text-muted-foreground" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></div>
    </aside>
    <div className="lg:pl-[250px]"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-8"><div className="flex items-center gap-2 text-xs text-muted-foreground"><GitBranch className="h-3.5 w-3.5 text-primary" /><span className="mono">main</span><span>/</span><span>Formiva CaseFlow</span></div><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="hidden items-center gap-1.5 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Workspace online</span><Settings2 className="h-4 w-4" /></div></header><div className="border-b border-border bg-sidebar px-4 py-2 lg:hidden"><div className="flex gap-2 overflow-x-auto">{visible.map((item) => <Link key={item.to} to={item.to} className="whitespace-nowrap rounded px-2 py-1 text-xs text-muted-foreground">{item.label}</Link>)}</div></div><main className="min-w-0 p-5 md:p-8">{children}</main></div>
  </div>;
}
export function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mono text-[10px] uppercase tracking-[0.25em] text-primary">{eyebrow}</div><h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>; }
export function Panel({ children, className }: { children: ReactNode; className?: string }) { return <section className={cn("rounded-lg border border-border bg-card/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]", className)}>{children}</section>; }
export function Kicker({ children }: { children: ReactNode }) { return <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{children}</div>; }
