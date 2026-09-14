# Formiva CaseFlow: zero to working project

## 1. Start the project locally

Run the Formiva application in the repository and keep the local URL visible in Mission Control.

```bash
pnpm install
pnpm dev --host 0.0.0.0 --port 3000
```

Open **Mission Control → Integrations → Live view**, enter `http://localhost:3000`, and select **Preview**. The viewport uses the browser's localhost, so it shows the project running on the same machine as the browser.

## 2. Work from the project brief

Start in **Project brief** and convert the current phase into tasks. The first build sequence is intentionally narrow: employee onboarding, versioned form intake, documents and safety checks, durable jobs and reminders, workflow editing, and pilot proof.

## 3. Update the daily signal

At the end of each work session, open **Daily log**, choose the current status, record focused hours, write what changed, list blockers, and define the next move. The history view preserves the build story and the reminder loop can later be connected to email, Teams, or SMS.

## 4. Send IDE and deployment events

Use the event bridge shown in **Integrations → Events**. Your local helper or deployed application should send signed events when a build starts, a test fails, or a release completes.

```js
await fetch(FORMIVA_EVENT_ENDPOINT, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-formiva-signature": process.env.FORMIVA_EVENT_SIGNATURE,
  },
  body: JSON.stringify({
    type: "build.completed",
    ref: "FMV-21",
    environment: "localhost",
    url: "http://localhost:3000",
    status: "passed",
  }),
});
```

Never put the signing secret in frontend code. Store it in the local environment, deployment environment, or server-side secret manager.

## 5. Preview a deployment

After deploying to Netlify, Vercel, or another HTTPS host, paste the deployment URL into **Integrations → Live view**. Use the embedded viewport when the target allows framing; otherwise use **Open tab** while the event stream and health state remain in Mission Control.

## 6. Clear the Wave 01 gate

Do not broaden the product until the current gate is evidenced: three committed pilots, 80%+ first-pass completeness, and two repeat hiring cycles. Add the evidence to the project decision log before moving to the next sales wave.

## 7. Security baseline

Keep demo access only for local development. For a real deployment, use Supabase authentication, owner/manager/contributor/viewer RBAC, server-side secrets, signed event payloads, environment separation, audit logs, and human review for sensitive workflows.
