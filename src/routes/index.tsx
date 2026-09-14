import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, GitCommitHorizontal, KanbanSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Formiva Mission Control — Build Tracker for CaseFlow" },
      {
        name: "description",
        content:
          "The single console for building Formiva CaseFlow: 12-phase roadmap, Kanban and waterfall boards, daily logs, reminders and market watch.",
      },
      { property: "og:title", content: "Formiva Mission Control" },
      {
        property: "og:description",
        content:
          "Track, manage and report the Formiva CaseFlow build from one dashboard.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: KanbanSquare,
    title: "Three views, one backlog",
    body: "Kanban, SDLC stages and a waterfall timeline over Phases 0-11 from the build manual.",
  },
  {
    icon: Activity,
    title: "Daily doing status",
    body: "Log what you did, what blocked you and what is next. Email reminders keep the loop closed.",
  },
  {
    icon: GitCommitHorizontal,
    title: "Coding activity",
    body: "Commits from VS Code or Devin land against the task you referenced.",
  },
  {
    icon: ShieldCheck,
    title: "Roles and audit",
    body: "Owner, manager, contributor and viewer — enforced on the server, every change recorded.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="mono text-sm tracking-[0.3em] text-primary">FORMIVA</span>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <p className="mono text-xs tracking-[0.25em] text-muted-foreground">
          MISSION CONTROL // CASEFLOW BUILD
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight">
          One console to run the Formiva build.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Not a generic project tool. Every board, gate and exit test is taken straight from
          the Formiva roadmap, PRD and market comparison — so the work you track is the work
          the plan actually approved.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Open the dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create an account
            </Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-md border border-border bg-card p-6">
              <f.icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
