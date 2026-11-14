export interface CampaignEmailFixture {
  key: string;
  sender: string;
  subject: string;
  fields: Record<string, string>;
}

export interface CampaignEmailDetails {
  intro: string;
  requests: string[];
  headline: string;
  description: string;
  cta: string;
  reviewNotes: string[];
}

export function campaignDetails(fixture: CampaignEmailFixture): CampaignEmailDetails;
export function campaignEmailHtml(fixture: CampaignEmailFixture): string;
