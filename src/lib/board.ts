export const KANBAN_COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
] as const;

export const SDLC_STAGES = [
  { key: "requirements", label: "Requirements" },
  { key: "design", label: "Design" },
  { key: "build", label: "Build" },
  { key: "test", label: "Test" },
  { key: "deploy", label: "Deploy" },
  { key: "measure", label: "Measure" },
] as const;

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const PHASE_STATUSES = [
  { key: "not_started", label: "Not started" },
  { key: "active", label: "Active" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
] as const;

export function priorityClass(p: string) {
  switch (p) {
    case "critical":
      return "text-destructive border-destructive/50";
    case "high":
      return "text-primary border-primary/50";
    case "low":
      return "text-muted-foreground border-border";
    default:
      return "text-foreground border-border";
  }
}
