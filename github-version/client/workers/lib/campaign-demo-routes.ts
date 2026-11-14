import type { Hono } from "hono";
import type { MailboxContext } from "./mailbox";

// Uses the existing requireMailbox / Cloudflare Access boundaries.
export function registerCampaignDemoRoutes(app: Hono<MailboxContext>) {
  const base = "/api/v1/mailboxes/:mailboxId/emails/:emailId/campaign-workspace";
  app.post("/api/v1/mailboxes/:mailboxId/demo-campaigns/seed", async (c) => {
    let input;
    try {
      const raw = await c.req.text();
      input = raw ? JSON.parse(raw) : {};
    } catch { return c.json({ error: "JSON 요청을 확인해 주세요." }, 400); }
    if (!input || typeof input !== "object" || Array.isArray(input) ||
      (input.refreshContent !== undefined && typeof input.refreshContent !== "boolean")) {
      return c.json({ error: "refreshContent는 true 또는 false여야 합니다." }, 400);
    }
    return c.json(await c.var.mailboxStub.seedDemoCampaigns(c.req.param("mailboxId")!, input.refreshContent === true));
  });
  app.get(base, async (c) => {
    const result = await c.var.mailboxStub.getDemoCampaignWorkspace(c.req.param("emailId")!);
    return result.ok ? c.json(result.workspace) : c.json({ error: result.error }, result.status);
  });
  for (const operation of ["requirements", "reply", "campaign"] as const) {
    app.on(operation === "requirements" ? "PUT" : "POST", operation === "requirements" ? base : `${base}/${operation}`, async (c) => {
      let input;
      try { input = await c.req.json(); } catch { return c.json({ error: "JSON 요청을 확인해 주세요." }, 400); }
      if (!input || typeof input !== "object" || Array.isArray(input)) return c.json({ error: "요청 형식을 확인해 주세요." }, 400);
      const result = await c.var.mailboxStub.mutateDemoCampaignWorkspace(
        c.req.param("emailId")!, c.req.param("mailboxId")!, operation, input,
      );
      return result.ok ? c.json(result.workspace) : c.json({ error: result.error }, result.status);
    });
  }
}
