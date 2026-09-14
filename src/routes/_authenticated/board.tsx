import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/session";
import { KANBAN_COLUMNS, SDLC_STAGES, PRIORITIES, PHASE_STATUSES, priorityClass } from "@/lib/board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Phase = Tables<"phases">;

export const Route = createFileRoute("/_authenticated/board")({
  head: () => ({
    meta: [
      { title: "Board — Formiva Mission Control" },
      { name: "description", content: "Kanban, SDLC and waterfall views of every Formiva CaseFlow task." },
      { property: "og:title", content: "Board — Formiva Mission Control" },
      { property: "og:description", content: "Kanban, SDLC and waterfall views of every task." },
    ],
  }),
  component: Board,
});

function useBoard() {
  return useQuery({
    queryKey: ["board"],
    queryFn: async () => {
      const [tasks, phases] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("phases").select("*").order("number"),
      ]);
      if (tasks.error) throw tasks.error;
      if (phases.error) throw phases.error;
      return { tasks: (tasks.data ?? []) as Task[], phases: (phases.data ?? []) as Phase[] };
    },
  });
}

function Board() {
  const { data, isLoading } = useBoard();
  const { canWrite, canManage } = useRole();
  const queryClient = useQueryClient();

  async function updateTask(id: string, patch: Partial<Task>) {
    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["board"] });
  }

  async function updatePhase(id: string, patch: Partial<Phase>) {
    const { error } = await supabase.from("phases").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["board"] });
  }

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-xs tracking-[0.25em] text-muted-foreground">WORK</p>
          <h1 className="mt-2 text-2xl font-semibold">Board</h1>
        </div>
        {canWrite && <NewTaskDialog phases={data.phases} />}
      </header>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="sdlc">SDLC</TabsTrigger>
          <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-5">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {KANBAN_COLUMNS.map((col) => {
              const items = data.tasks.filter((t) => t.kanban_status === col.key);
              return (
                <div key={col.key} className="rounded-md border border-border bg-card/60 p-3">
                  <div className="mono flex items-center justify-between text-xs text-muted-foreground">
                    <span>{col.label.toUpperCase()}</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {items.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        phases={data.phases}
                        canWrite={canWrite}
                        onChange={(patch) => updateTask(t.id, patch)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sdlc" className="mt-5">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {SDLC_STAGES.map((stage) => {
              const items = data.tasks.filter((t) => t.sdlc_stage === stage.key);
              return (
                <div key={stage.key} className="rounded-md border border-border bg-card/60 p-3">
                  <div className="mono flex items-center justify-between text-xs text-muted-foreground">
                    <span>{stage.label.toUpperCase()}</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {items.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        phases={data.phases}
                        canWrite={canWrite}
                        onChange={(patch) => updateTask(t.id, patch)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="waterfall" className="mt-5 space-y-3">
          {data.phases.map((p) => {
            const items = data.tasks.filter((t) => t.phase_id === p.id);
            const done = items.filter((t) => t.kanban_status === "done").length;
            const pct = items.length ? Math.round((done / items.length) * 100) : p.status === "done" ? 100 : 0;
            return (
              <div key={p.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="mono mr-2 text-xs text-primary">PHASE {p.number}</span>
                    <span className="font-medium">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="mono text-xs text-muted-foreground">
                      {done}/{items.length} tasks
                    </span>
                    {canManage ? (
                      <Select value={p.status} onValueChange={(v) => updatePhase(p.id, { status: v })}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHASE_STATUSES.map((s) => (
                            <SelectItem key={s.key} value={s.key}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="mono text-[10px]">
                        {p.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {p.summary && <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>}
                <Progress value={pct} className="mt-3" />
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskCard({
  task,
  phases,
  canWrite,
  onChange,
}: {
  task: Task;
  phases: Phase[];
  canWrite: boolean;
  onChange: (patch: Partial<Task>) => void;
}) {
  const phase = phases.find((p) => p.id === task.phase_id);
  return (
    <div className="rounded border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="mono text-[10px] text-primary">{task.ref}</span>
        <Badge variant="outline" className={`mono text-[10px] ${priorityClass(task.priority)}`}>
          {task.priority}
        </Badge>
      </div>
      <p className="mt-1.5 text-sm leading-snug">{task.title}</p>
      {phase && <p className="mono mt-1 text-[10px] text-muted-foreground">P{phase.number}</p>}
      {task.due_date && (
        <p className="mono mt-1 text-[10px] text-muted-foreground">due {task.due_date}</p>
      )}
      {canWrite && (
        <div className="mt-2 grid gap-1.5">
          <Select value={task.kanban_status} onValueChange={(v) => onChange({ kanban_status: v })}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_COLUMNS.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={task.sdlc_stage} onValueChange={(v) => onChange({ sdlc_stage: v })}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SDLC_STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function NewTaskDialog({ phases }: { phases: Phase[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phaseId, setPhaseId] = useState<string>(phases[0]?.id ?? "");
  const [priority, setPriority] = useState<string>("medium");
  const [stage, setStage] = useState<string>("build");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!title.trim()) return toast.error("Give the task a title");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description || null,
      phase_id: phaseId || null,
      priority,
      sdlc_stage: stage,
      kanban_status: "backlog",
      due_date: dueDate || null,
      created_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Task created");
    setTitle("");
    setDescription("");
    setDueDate("");
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["board"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden /> New task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Phase</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      P{p.number} — {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>SDLC stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SDLC_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={create} disabled={saving} className="w-full">
            {saving ? "Creating…" : "Create task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
