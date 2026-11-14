export interface DemoEmail { id: string; subject: string | null; sender: string | null; body?: string | null; body_text?: string | null; body_html?: string | null; thread_id?: string | null }
export interface DemoFixture { key: string; sender: string; subject: string; fields: Record<string, string> }
export interface RequirementField { key: string; label: string; value: string; required: boolean; source: "email" | "user" | "missing"; evidence: string | null }
export interface MissingRequirement { key: string; label: string; blocking: boolean; reason: string; question: string }
export interface CampaignDraft { id: string; title: string; status: "draft"; fields: Record<string, string>; notes: string; blockers: string[]; createdAt: string; updatedAt: string }
export interface WorkspaceStore { requirements?: Record<string, string>; reply?: { subject: string; body: string }; replyDraftId?: string | null; campaign?: CampaignDraft | null; updatedAt?: string }
export interface CampaignWorkspace {
  mode: "demo"; fixtureId: string; brand: string; product: string;
  summary: { headline: string; bullets: string[] };
  requirements: RequirementField[]; missing: MissingRequirement[];
  reply: { subject: string; body: string }; suggestedReply: { subject: string; body: string }; replyDraftId: string | null;
  campaign: CampaignDraft | null; campaignStale: boolean; updatedAt: string | null;
}
export const FIELD_LABELS: Record<string, string>;
export const DEMO_CAMPAIGNS: DemoFixture[];
export function demoBody(fixture: DemoFixture): string;
export function demoEmailHtml(fixture: DemoFixture): string;
export function escapeHtml(text: string): string;
export function findDemo(email: DemoEmail): DemoFixture | undefined;
export function stableDemoId(scope: string, key: string): Promise<string>;
export function validateRequirements(input: unknown): Record<string, string>;
export function normalizedOverrides(fixture: DemoFixture, input: unknown): Record<string, string>;
export function validateReply(input: unknown): {subject: string; body: string};
export function buildWorkspace(email: DemoEmail, stored?: WorkspaceStore): CampaignWorkspace;
export function makeCampaign(workspace: CampaignWorkspace, input: {title: string; notes?: string}, previous: CampaignDraft | null | undefined, id: string): CampaignDraft;
