-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('owner','manager','contributor','viewer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.can_write(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','manager','contributor'))
$$;

CREATE OR REPLACE FUNCTION public.can_manage(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','manager'))
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'owner'::public.app_role ELSE 'viewer'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "owners update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'owner'));
CREATE POLICY "roles readable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- ===== Phases =====
CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  scope TEXT,
  exit_test TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  start_date DATE,
  target_date DATE,
  gate_cleared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phases TO authenticated;
GRANT ALL ON public.phases TO service_role;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phases read" ON public.phases FOR SELECT TO authenticated USING (true);
CREATE POLICY "phases write" ON public.phases FOR ALL TO authenticated USING (public.can_manage(auth.uid())) WITH CHECK (public.can_manage(auth.uid()));

-- ===== Tasks =====
CREATE SEQUENCE public.task_ref_seq START 1;
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL UNIQUE DEFAULT ('FMV-' || nextval('public.task_ref_seq')),
  title TEXT NOT NULL,
  description TEXT,
  phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
  kanban_status TEXT NOT NULL DEFAULT 'backlog',
  sdlc_stage TEXT NOT NULL DEFAULT 'requirements',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee UUID,
  due_date DATE,
  estimate_hours NUMERIC,
  blocked_reason TEXT,
  position INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks read" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "tasks update" ON public.tasks FOR UPDATE TO authenticated USING (public.can_manage(auth.uid()) OR (public.can_write(auth.uid()) AND (assignee = auth.uid() OR created_by = auth.uid())));
CREATE POLICY "tasks delete" ON public.tasks FOR DELETE TO authenticated USING (public.can_manage(auth.uid()));

CREATE TABLE public.task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor UUID,
  kind TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.task_events TO authenticated;
GRANT ALL ON public.task_events TO service_role;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task events read" ON public.task_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "task events insert" ON public.task_events FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- ===== Daily logs =====
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  did TEXT,
  blockers TEXT,
  next_plan TEXT,
  hours NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs read" ON public.daily_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "logs insert own" ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_write(auth.uid()));
CREATE POLICY "logs update own" ON public.daily_logs FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.can_manage(auth.uid()));
CREATE POLICY "logs delete own" ON public.daily_logs FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));

-- ===== Reminders =====
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  message TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders read own" ON public.reminders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.can_manage(auth.uid()));
CREATE POLICY "reminders insert" ON public.reminders FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "reminders update" ON public.reminders FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.can_manage(auth.uid()));
CREATE POLICY "reminders delete" ON public.reminders FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.can_manage(auth.uid()));

-- ===== Use cases =====
CREATE TABLE public.use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank INT NOT NULL,
  name TEXT NOT NULL,
  documents TEXT,
  buyer TEXT,
  why_fits TEXT,
  wave INT,
  gate TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.use_cases TO authenticated;
GRANT ALL ON public.use_cases TO service_role;
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "use cases read" ON public.use_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "use cases write" ON public.use_cases FOR ALL TO authenticated USING (public.can_manage(auth.uid())) WITH CHECK (public.can_manage(auth.uid()));

-- ===== Market =====
CREATE TABLE public.market_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor TEXT NOT NULL,
  capability TEXT,
  their_position TEXT,
  our_position TEXT,
  is_differentiator BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_notes TO authenticated;
GRANT ALL ON public.market_notes TO service_role;
ALTER TABLE public.market_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market notes read" ON public.market_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "market notes write" ON public.market_notes FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

CREATE TABLE public.market_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_digests TO authenticated;
GRANT ALL ON public.market_digests TO service_role;
ALTER TABLE public.market_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "digests read" ON public.market_digests FOR SELECT TO authenticated USING (true);
CREATE POLICY "digests write" ON public.market_digests FOR ALL TO authenticated USING (public.can_manage(auth.uid())) WITH CHECK (public.can_manage(auth.uid()));

-- ===== Integrations / settings =====
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  last_status TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations read" ON public.integrations FOR SELECT TO authenticated USING (public.can_manage(auth.uid()));
CREATE POLICY "integrations write" ON public.integrations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sha TEXT NOT NULL UNIQUE,
  message TEXT,
  author TEXT,
  branch TEXT,
  url TEXT,
  task_ref TEXT,
  committed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commits TO authenticated;
GRANT ALL ON public.commits TO service_role;
ALTER TABLE public.commits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commits read" ON public.commits FOR SELECT TO authenticated USING (true);
CREATE POLICY "commits write" ON public.commits FOR ALL TO authenticated USING (public.can_manage(auth.uid())) WITH CHECK (public.can_manage(auth.uid()));

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor UUID,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read" ON public.audit_log FOR SELECT TO authenticated USING (public.can_manage(auth.uid()));
CREATE POLICY "audit insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ===== Seeds =====
INSERT INTO public.phases (number, title, scope, exit_test) VALUES
(0,'Founder basics & discovery','Founder basics, customer interviews, launch workflow map, synthetic/redacted documents, assumptions and decisions log','Founder can explain intake-to-outcome flow and identify sensitive actions.'),
(1,'Infrastructure baseline','Vercel project, Clerk project, OCI VCN/firewalls, VM1/VM2 baseline, Docker Compose, private database/cache, R2 bucket, Cloudflare Tunnel/Access','Health checks pass; database and AI ports are not public; frontend reaches a protected API.'),
(2,'Schema, RBAC & case primitives','PostgreSQL/Drizzle schema, workspace/member/RBAC middleware, case and audit primitives','Cross-tenant negative tests pass.'),
(3,'Intake forms & uploads','Versioned onboarding form, public link, save/resume, uploads, R2 metadata, file safety checks','Synthetic respondent completes mobile flow; unsafe files are quarantined.'),
(4,'Review queue & approvals','Review queue, deterministic validation, approvals, timers, case timeline, correction/audit UX','Reviewer can resolve an exception without losing original evidence.'),
(5,'Durable jobs & worker','Durable jobs, Valkey transport, worker leases, retries, dead-letter, safe replay, notification status','Duplicate delivery produces one business effect; failed jobs are visible.'),
(6,'AI Engine on VM2','OCR, language detection, classification, extraction, confidence components, AI API contract, model registry, benchmark harness','CPU-only benchmark recorded; model/version audit works; no sensitive action auto-executes.'),
(7,'Exact AI routing','AI first, deterministic low-risk checks, human review for low confidence/sensitive/conflict, post-approval route/notify/approve/integrate/update/confirm','Test matrix covers every route and records reason/evidence.'),
(8,'Codeless workflow editor','Visual nodes for triggers, conditions, AI results, approvals, human review, timers, actions, integrations; draft/version/publish/rollback, dry-run, safe mode','Synthetic dry-runs do not write externally; published version immutable; rollback auditable.'),
(9,'Integration interaction layer','Resend, Google Workspace/Sheets, Razorpay events, signed webhooks, connector health, field mapping, idempotency, retries','1,000 synthetic events have no silent loss; provider callbacks verified.'),
(10,'Deployment hardening & pilot','Deployment hardening and pilot','Restore test, resource alerts, secret rotation, ARM image release, smoke tests, sensitive-pilot gate pass.'),
(11,'Measure & expand','Measure and expand only if justified','Employee onboarding shows measurable completion/rework/support improvement; manufacturing remains gated.');

INSERT INTO public.use_cases (rank, name, documents, buyer, why_fits, wave, gate) VALUES
(0,'Employee onboarding (launch)','Offer letter, ID proof, bank details, education proof','HR/Ops lead','Launch workflow — highest urgency, clearest ROI',1,'3 paying/committed pilots, 80%+ first-pass completeness, repeat use across 2 hiring cycles'),
(1,'Vendor/supplier onboarding','GST certificate, PAN, bank proof, MSME certificate','Procurement/Finance lead','Repeatable, document-heavy, compliance-sensitive',3,'Reuses document-verification engine; adjacent buyer validated'),
(2,'Client onboarding (agencies, law/CA firms)','KYC docs, signed contracts, engagement letters','Practice owner/Ops','Same evidentiary rigor law/finance firms expect',5,'Inbound demand x3 from segment'),
(3,'School/college admissions','Birth certificate, prior marksheets, fee receipt','Admissions head','Seasonal but high-volume, verification heavy',4,'Paid pilot outside peak season'),
(4,'IT access/equipment requests','Manager approval, asset acknowledgment','IT/Ops','Same approval-chain engine, zero new documents',2,'60% of Wave-1 customers adopt a second workflow'),
(5,'Leave/expense approvals','Receipts, manager sign-off','HR/Finance','Fast second-workflow sell to existing customers',2,'60% of Wave-1 customers adopt a second workflow'),
(6,'Real estate tenant/buyer onboarding','ID proof, income proof, signed agreement','Broker/property manager','Verification + e-signature-adjacent flow',5,'Inbound demand x3 from segment'),
(7,'Insurance claim intake','Claim form, photos/evidence, policy proof','Claims/adjuster team','Evidence-linked AI fits claim documentation',5,'Trust-evidence pack complete before any sale'),
(8,'Loan/NBFC application intake','KYC, income proof, bank statements','Credit/underwriting team','High sensitivity — strictest human-review gate',5,'Trust-evidence pack complete before any sale'),
(9,'Healthcare patient registration','Insurance card, ID, consent form','Clinic front-desk/ops','High sensitivity — health data, gated',5,'Trust-evidence pack complete before any sale'),
(10,'Manufacturing quality/nonconformance intake','Inspection evidence, corrective-action forms','Quality/procurement lead','Structured evidence + approval chain',5,'≥70% reuse of shared primitives + paid pilot');

INSERT INTO public.market_notes (competitor, capability, their_position, our_position, is_differentiator) VALUES
('Jotform','Forms/intake','Yes, mature','Yes',false),
('Jotform','Document OCR/classification','Limited (add-on)','Built-in AI engine, confidence-scored',true),
('Formstack','Forms/intake','Yes, mature','Yes',false),
('Formstack','Immutable audit trail as core object','Partial','Yes — core object, not a report',true),
('Power Automate','Approvals/routing','Yes (Flow)','Yes',false),
('Power Automate','Backend recomputes routing','Not documented','Yes — never trusts the AI recommendation',true),
('Zapier','Integration breadth','Widest (7,000+ apps)','Narrow, by demand only',false),
('Zapier','Human-review queue with evidence','No','Yes — evidence + correction history',true),
('All four','Case as versioned governed record','No','Yes',true),
('All four','Implementation-led selling','Self-serve','Yes — setup done for the customer',true),
('All four','India-first pricing','USD pricing','₹999–₹7,999+',true);

INSERT INTO public.integrations (kind, enabled, config) VALUES
('teams', false, '{"webhook_configured": false, "events": ["task_moved","blocked","daily_digest"]}'::jsonb),
('github', false, '{"repo": "", "branch": "main"}'::jsonb),
('email', false, '{"from": "", "digest_hour_utc": 3}'::jsonb);
