# Formiva Mission Control — a project management tool built only for Formiva

A single dashboard to run the Formiva CaseFlow build: track daily progress, manage the 12-phase roadmap in Kanban / SDLC / waterfall views, get email reminders, see your GitHub coding activity, post updates to Teams, and keep a live market view.

This is not a generic project tool. Every board, field and view is shaped by your own documents — the phases, gates, exit tests and competitor set come straight from the Formiva roadmap, PRD and comparison doc.

## What gets built

### Pages
1. **Dashboard (home, after login)** — today's tasks, overdue items, phase progress bar (Phase 0-11), latest GitHub commits, upcoming reminders, recent Teams posts.
2. **Board** — three switchable views over the same tasks:
   - Kanban: Backlog / In Progress / Blocked / Review / Done
   - SDLC: Requirements → Design → Build → Test → Deploy → Measure
   - Waterfall: Gantt-style timeline of Phases 0-11 with dependencies and exit-test gates
3. **Daily Log** — one entry per day: what you did, hours, blockers, tomorrow's plan. Auto-links to tasks touched and commits made.
4. **Project** — living project brief: scope, launch workflow (employee onboarding), stack decisions, the architecture layers, and the sensitive-pilot gate checklist from your docs.
5. **Use Cases** — the 10 use cases and 5 sales waves from your comparison doc, each with its gate condition and status (not started / validating / cleared).
6. **Market** — competitor comparison table (Jotform, Formstack, Power Automate, Zapier) that you can edit, plus an AI-generated market digest you can refresh and either accept into your notes or discard.
7. **Integrations** — connect GitHub repo, Teams channel webhook, reminder settings.
8. **Admin** — users, roles, audit log of who changed what.
9. **Login / Sign-up**

### Roles (RBAC)
- **Owner** (you): everything, including admin and integrations
- **Manager**: create/edit tasks, phases, logs, market notes
- **Contributor**: update own tasks and daily logs
- **Viewer**: read-only

Roles live in a separate roles table, checked on the server for every read and write — never on the page alone.

### Seeded content
The board ships pre-filled with Phases 0-11 from your build manual, each with its scope and exit test as the definition of done, so the tool is useful the moment it opens.

### Reminders
Daily digest plus per-task due reminders by email. WhatsApp/SMS is left as a pluggable channel — the reminder engine is written so adding it later is a settings change, not a rebuild.

### Teams
Paste an incoming-webhook URL for your channel; task moves, blockers and the daily digest post there. You choose which events post.

### GitHub / local coding activity
Connect your repo. Commits, branches and pull requests appear on the dashboard and attach to tasks when the commit message mentions a task ID (e.g. `FMV-14`). This covers VS Code and Devin work automatically, since both push to the same repo — no localhost agent needed.

## Design direction
Dark, dense "mission control" aesthetic — engineering console, not a pastel SaaS board. Monospace accents for IDs and commit hashes, a single signal colour for state changes, tight spacing so a whole phase fits on one screen.

## Technical notes
- Lovable Cloud for database, auth and server logic: tables for `profiles`, `user_roles`, `phases`, `tasks`, `task_events`, `daily_logs`, `reminders`, `market_notes`, `market_digests`, `use_cases`, `integrations`, `audit_log`. Row-level security on all of them, with an `app_role` enum and a `has_role()` security-definer function.
- Email via Resend (matches your stack doc); you'll supply a Resend API key and a verified sender.
- Scheduled reminder sweep runs server-side and marks each reminder sent, so nothing double-fires.
- Teams posts and GitHub reads happen in server functions; webhook URLs and tokens stay in the secret store.
- Market digest uses the Lovable AI gateway, writing to a review queue rather than publishing directly.

## What I need from you along the way
- Resend API key + a sender address you control (for reminders)
- Teams channel incoming-webhook URL
- GitHub repo name and access (via the GitHub connection)

## Build order
1. Cloud enable, schema, roles, login/sign-up, admin page
2. Phases + tasks seeded from the roadmap; Kanban, SDLC, waterfall views
3. Dashboard, daily log
4. Project / Use Cases / Market pages
5. Reminders (email), Teams posts, GitHub activity feed
6. AI market digest
