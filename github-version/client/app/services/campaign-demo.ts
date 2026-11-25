import { request } from "./api";
import type { CampaignWorkspace } from "../../shared/campaign-demo.js";

export type { CampaignWorkspace, RequirementField, CampaignDraft } from "../../shared/campaign-demo.js";

const path = (mailboxId: string, emailId: string) =>
  `/api/v1/mailboxes/${encodeURIComponent(mailboxId)}/emails/${encodeURIComponent(emailId)}/campaign-workspace`;
const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const campaignDemoApi = {
  seedSamples: (mailboxId: string) =>
    request<{ created: number; total: number }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxId)}/demo-campaigns/seed`, json("POST", {})),
  getWorkspace: (mailboxId: string, emailId: string) =>
    request<CampaignWorkspace>(path(mailboxId, emailId)),
  saveRequirements: (mailboxId: string, emailId: string, requirements: Record<string, string>) =>
    request<CampaignWorkspace>(path(mailboxId, emailId), json("PUT", { requirements })),
  saveReply: (mailboxId: string, emailId: string, reply: { subject: string; body: string }) =>
    request<CampaignWorkspace>(`${path(mailboxId, emailId)}/reply`, json("POST", reply)),
  makeCampaign: (mailboxId: string, emailId: string, input: { title: string; notes: string; requirements: Record<string, string> }) =>
    request<CampaignWorkspace>(`${path(mailboxId, emailId)}/campaign`, json("POST", input)),
};
