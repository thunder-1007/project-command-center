import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({
    meta: [
      { title: "Daily Log — Formiva Mission Control" },
      { name: "description", content: "Record daily doing status, blockers and tomorrow's plan for the Formiva build." },
      { property: "og:title", content: "Daily Log — Formiva Mission Control" },
      { property: "og:description", content: "Record daily doing status, blockers and next plan." },
    ],
  }),
  component: DailyLog,
});

function DailyLog() {
  const { user, canWrite } = useRole();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [did, setDid] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextPlan, setNextPlan] = useState("");
  const [hours, setHours] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: logs } = useQuery({
    queryKey: ["daily-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .order("log_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mine = logs?.find((l) => l.user_id === user?.id && l.log_date === today);
  if (mine && !loaded) {
    setLoaded(true);
    setDid(mine.did ?? "");
    setBlockers(mine.blockers ?? "");
    setNextPlan(mine.next_plan ?? "");
    setHours(mine.hours != null ? String(mine.hours) : "");
  }

  async function save() {
    if (!user) return;
    const payload = {
      user_id: user.id,
      log_date: today,
      did,
      blockers,
      next_plan: nextPlan,
      hours: hours ? Number(hours) : null,
    };
    const { error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "user_id,log_date" });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Today's log saved");
    queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="mono text-xs tracking-[0.25em] text-muted-foreground">DAILY LOG</p>
        <h1 className="mt-2 text-2xl font-semibold">{new Date().toDateString()}</h1>
      </header>

      <section className="max-w-2xl space-y-4 rounded-md border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="did">What I did today</Label>
          <Textarea id="did" rows={4} value={did} onChange={(e) => setDid(e.target.value)} disabled={!canWrite} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="blockers">Blockers</Label>
          <Textarea id="blockers" rows={3} value={blockers} onChange={(e) => setBlockers(e.target.value)} disabled={!canWrite} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="next">Tomorrow's plan</Label>
          <Textarea id="next" rows={3} value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} disabled={!canWrite} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours">Hours</Label>
          <Input id="hours" type="number" step="0.5" className="w-32" value={hours} onChange={(e) => setHours(e.target.value)} disabled={!canWrite} />
        </div>
        <Button onClick={save} disabled={!canWrite}>
          Save today's log
        </Button>
        {!canWrite && <p className="text-xs text-muted-foreground">Your role is read-only.</p>}
      </section>

      <section>
        <h2 className="text-sm font-semibold">History</h2>
        <ul className="mt-3 space-y-3">
          {(logs ?? []).map((l) => (
            <li key={l.id} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="mono text-xs text-primary">{l.log_date}</span>
                <span className="mono text-xs text-muted-foreground">{l.hours ?? 0}h</span>
              </div>
              {l.did && <p className="mt-2 text-sm whitespace-pre-wrap">{l.did}</p>}
              {l.blockers && (
                <p className="mt-2 text-sm text-destructive whitespace-pre-wrap">Blocked: {l.blockers}</p>
              )}
              {l.next_plan && (
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">Next: {l.next_plan}</p>
              )}
            </li>
          ))}
          {(logs ?? []).length === 0 && <li className="text-sm text-muted-foreground">No entries yet.</li>}
        </ul>
      </section>
    </div>
  );
}
