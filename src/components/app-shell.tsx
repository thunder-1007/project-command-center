import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  KanbanSquare,
  NotebookPen,
  FileText,
  Layers,
  LineChart,
  Plug,
  Shield,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole, ROLE_LABEL } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, level: "any" },
  { to: "/board", label: "Board", icon: KanbanSquare, level: "any" },
  { to: "/log", label: "Daily Log", icon: NotebookPen, level: "any" },
  { to: "/project", label: "Project", icon: FileText, level: "any" },
  { to: "/use-cases", label: "Use Cases", icon: Layers, level: "any" },
  { to: "/market", label: "Market", icon: LineChart, level: "any" },
  { to: "/integrations", label: "Integrations", icon: Plug, level: "manage" },
  { to: "/admin", label: "Admin", icon: Shield, level: "owner" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, canManage, isOwner } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const visible = NAV.filter((item) =>
    item.level === "owner" ? isOwner : item.level === "manage" ? canManage : true,
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="border-b border-border px-5 py-4">
          <div className="mono text-xs tracking-[0.3em] text-primary">FORMIVA</div>
          <div className="mt-1 text-xs text-muted-foreground">Mission Control</div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {visible.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          <div className="mono mt-1 text-[10px] uppercase tracking-widest text-primary">
            {role ? ROLE_LABEL[role] : "—"}
          </div>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {visible.map((item) => (
            <Link key={item.to} to={item.to} className="whitespace-nowrap rounded px-2 py-1 text-xs text-muted-foreground">
              {item.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={signOut} className="ml-auto">
            <LogOut className="h-4 w-4" aria-hidden />
          </Button>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
