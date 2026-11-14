import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { stableDemoId } from "../../shared/campaign-demo.js";

// Test the public RPC surface directly; do not infer the entire Drizzle-backed
// DO type through the test helper's recursive RPC-mapping generic.
interface DemoMailbox {
  seedDemoCampaigns(mailbox: string, refreshContent?: boolean): Promise<{ created: number; total: number; refreshed?: number }>;
  getEmail(emailId: string): Promise<any>;
  countEmails(options: { folder: string }): Promise<number>;
  getDemoCampaignWorkspace(emailId: string): Promise<any>;
  mutateDemoCampaignWorkspace(emailId: string, mailbox: string, operation: string, input: unknown): Promise<any>;
}
function mailboxStub(name: string): DemoMailbox {
  const binding = (env as unknown as { MAILBOX: DurableObjectNamespace }).MAILBOX;
  return binding.get(binding.idFromName(name)) as unknown as DemoMailbox;
}

describe("Cloudflare campaign demo workflow", () => {
  it("seeds nine fictional messages idempotently without sending or auto-generating replies", async () => {
      const instance = mailboxStub("demo-campaign-seed-test");
      expect(await instance.seedDemoCampaigns("demo@example.com")).toEqual({ created: 9, total: 9 });
      expect(await instance.seedDemoCampaigns("demo@example.com")).toEqual({ created: 0, total: 9 });
      expect(await instance.countEmails({ folder: "inbox" })).toBe(9);
      expect(await instance.countEmails({ folder: "sent" })).toBe(0);
      expect(await instance.countEmails({ folder: "draft" })).toBe(0);
  });

  it("persists requirements, editable reply and campaign draft while preserving missing facts", async () => {
    const mailbox = "workflow@example.com";
    const instance = mailboxStub(mailbox);
    const emailId = await stableDemoId(mailbox, "lg-oled-launch");
      await instance.seedDemoCampaigns(mailbox);
      const initial = await instance.getDemoCampaignWorkspace(emailId);
      expect(initial.ok).toBe(true);
      expect(initial.workspace.missing.map((m: any) => m.key)).toContain("assets");
      const requirements = { assets: "PC 600×600 / 모바일 360×480", frequencyCap: "하루 1회" };
      const updated = await instance.mutateDemoCampaignWorkspace(emailId, mailbox, "requirements", { requirements });
      expect(updated.workspace.missing).toHaveLength(0);
      const reply = { subject: "검토 회신", body: "직접 수정한 한국어 답변 <안내>" };
      const first = await instance.mutateDemoCampaignWorkspace(emailId, mailbox, "reply", reply);
      const second = await instance.mutateDemoCampaignWorkspace(emailId, mailbox, "reply", { ...reply, body: "수정된 답변" });
      expect(first.workspace.replyDraftId).toBe(second.workspace.replyDraftId);
      expect(await instance.countEmails({ folder: "draft" })).toBe(1);
      const campaign = await instance.mutateDemoCampaignWorkspace(emailId, mailbox, "campaign", {
        title: "OLED Popup 검토 초안", notes: "운영팀 확인 필요", requirements,
      });
      expect(campaign.workspace.campaign.status).toBe("draft");
      expect(campaign.workspace.campaign.blockers).toHaveLength(0);
      const persisted = await instance.getDemoCampaignWorkspace(emailId);
      expect(persisted.workspace.reply.body).toBe("수정된 답변");
      expect(persisted.workspace.campaign.title).toBe("OLED Popup 검토 초안");
      const original = await instance.getEmail(emailId);
      expect(await instance.seedDemoCampaigns(mailbox, true)).toEqual({ created: 0, total: 9, refreshed: 9 });
      const refreshed = await instance.getEmail(emailId);
      expect(refreshed.body).toContain('<img src="/campaign-examples/lg-oled-launch.jpg"');
      for (const key of ["id", "date", "read", "starred", "thread_id", "sender", "subject"]) {
        expect(refreshed[key]).toEqual(original[key]);
      }
      expect((await instance.getDemoCampaignWorkspace(emailId)).workspace).toEqual(persisted.workspace);
      expect(await instance.countEmails({ folder: "draft" })).toBe(1);
      expect(await instance.countEmails({ folder: "inbox" })).toBe(9);
      expect(await instance.countEmails({ folder: "sent" })).toBe(0);
  });

  it("rejects non-demo and invalid requests without replacing unrelated mail", async () => {
    const mailbox = "validation@example.com";
    const instance = mailboxStub(mailbox);
    const emailId = await stableDemoId(mailbox, "lg-oled-launch");
      expect((await instance.getDemoCampaignWorkspace("not-present")).status).toBe(404);
      await instance.seedDemoCampaigns(mailbox);
      expect((await instance.mutateDemoCampaignWorkspace(emailId, mailbox, "requirements", {
        requirements: { endDate: "2026-11-01" },
      })).status).toBe(400);
      expect((await instance.mutateDemoCampaignWorkspace(emailId, mailbox, "reply", { subject: "", body: "" })).status).toBe(400);
      expect(await instance.countEmails({ folder: "draft" })).toBe(0);
  });
});
