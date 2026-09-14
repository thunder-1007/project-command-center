import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, GitCommitHorizontal, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KANBAN_COLUMNS } from "@/lib/board";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Formiva Mission Control" },
      { name: "description", content: "Today's tasks, phase progress and build activity for Formiva CaseFlow." },
      { property: "og:title", content: "Dashboard — Formiva Mission Control" },
      { property: "og:description", content: "Today's tasks, phase progress and build activity." },
    ],
  }),
  component: Dashboard,
});

function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [tasks, phases, commits, reminders] = await Promise.all([
        supabase.from("tasks").select("*").order("due_date", { ascending: true }),
        supabase.from("phases").select("*").order("number"),
        supabase.from("commits").select("*").order("committed_at", { ascending: false }).limit(6),
        supabase.from("reminders").select("*").eq("status", "pending").order("send_at").limit(5),
      ]);
      if (tasks.error) throw tasks.error;
      if (phases.error) throw phases.error;
      return {
        tasks: tasks.data ?? [],
        phases: phases.data ?? [],
        commits: commits.data ?? [],
        reminders: reminders.data ?? [],
      };
    },
  });
}

function Dashboard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const today = new Date().toISOString().slice(0, 10);
  const open = data.tasks.filter((t) => t.kanban_status !== "done");
  const dueToday = open.filter((t) => t.due_date === today);
  const overdue = open.filter((t) => t.due_date && t.due_date < today);
  const blocked = open.filter((t) => t.kanban_status === "blocked");
  const donePhases = data.phases.filter((p) => p.status === "done").length;
  const phasePct = data.phases.length ? Math.round((donePhases / data.phases.length) * 100) : 0;
  const activePhase = data.phases.find((p) => p.status === "active");

  return (
    <div className="space-y-8">
      <header>
        <p className="mono text-xs tracking-[0.25em] text-muted-foreground">STATUS // TODAY</p>
        <h1 className="mt-2 text-2xl font-semibold">Formiva CaseFlow build</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Due today" value={dueToday.length} icon={CalendarClock} />
        <Stat label="Overdue" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? "warn" : undefined} />
        <Stat label="Blocked" value={blocked.length} icon={AlertTriangle} tone={blocked.length ? "warn" : undefined} />
        <Stat label="Open tasks" value={open.length} icon={Target} />
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Roadmap progress</h2>
          <span className="mono text-xs text-muted-foreground">
            {donePhases}/{data.phases.length} phases cleared
          </span>
        </div>
        <Progress value={phasePct} className="mt-3" />
        <p className="mt-3 text-sm text-muted-foreground">
          {activePhase
            ? `Active: Phase ${activePhase.number} — ${activePhase.title}`
            : "No phase marked active yet."}
        </p>
        <Link to="/board" className="mono mt-3 inline-block text-xs text-primary">
          OPEN BOARD →
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Today &amp; overdue</h2>
          <ul className="mt-3 space-y-2">
            {[...overdue, ...dueToday].slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-0">
                <span className="truncate">
                  <span className="mono mr-2 text-xs text-primary">{t.ref}</span>
                  {t.title}
                </span>
                <Badge variant="outline" className="mono shrink-0 text-[10px]">
                  {KANBAN_COLUMNS.find((c) => c.key === t.kanban_status)?.label ?? t.kanban_status}
                </Badge>
              </li>
            ))}
            {overdue.length + dueToday.length === 0 && (
              <li className="text-sm text-muted-foreground">Nothing due today. Good.</li>
            )}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <GitCommitHorizontal className="h-4 w-4 text-primary" aria-hidden /> Recent commits
          </h2>
          <ul className="mt-3 space-y-2">
            {data.commits.map((c) => (
              <li key={c.id} className="border-b border-border/60 pb-2 text-sm last:border-0">
                <span className="mono mr-2 text-xs text-primary">{c.sha.slice(0, 7)}</span>
                <span className="truncate">{c.message}</span>
                {c.task_ref && (
                  <span className="mono ml-2 text-[10px] text-muted-foreground">{c.task_ref}</span>
                )}
              </li>
            ))}
            {data.commits.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No commits yet — connect your repository on the Integrations page.
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Upcoming reminders</h2>
        <ul className="mt-3 space-y-2">
          {data.reminders.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 text-sm">
              <span className="truncate">{r.message}</span>
              <span className="mono shrink-0 text-xs text-muted-foreground">
                {new Date(r.send_at).toLocaleString()}
              </span>
            </li>
          ))}
          {data.reminders.length === 0 && (
            <li className="text-sm text-muted-foreground">No reminders queued.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: "warn" | undefined;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={tone === "warn" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"} aria-hidden />
      </div>
      <div className="mono mt-2 text-3xl">{value}</div>
    </div>
  );
}
