// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { AIChatAgent } from "@cloudflare/ai-chat";
import {
	streamText,
	convertToModelMessages,
	stepCountIs,
} from "ai";
import { createWorkersAI } from "workers-ai-provider";
import type { EmailFull, EmailMetadata } from "../lib/schemas.ts";
import { isPromptInjection } from "../lib/ai.ts";
import {
	getMailboxStub,
	stripHtmlToText,
	textToHtml,
} from "../lib/email-helpers.ts";
import { Folders } from "../../shared/folders.ts";
import type { Env } from "../types.ts";
import { asRateLimitStorage } from "../lib/rate-limit/do-adapter.ts";
import { recordAiEvent } from "../lib/observability/analytics.ts";
import { createEmailTools } from "./tools-factory.ts";
import { runEmailPipeline, recordAgentUsage } from "./pipeline.ts";

/**
 * Default system prompt used when no custom prompt is configured for a mailbox.
 * Users can override this on a per-mailbox basis via the Settings UI.
 */
const DEFAULT_SYSTEM_PROMPT = `You are an email assistant that helps manage this inbox. You read emails, draft replies, and help organize conversations.

## Writing Style
Write like a real person. Short, direct, flowing prose. Get to the point. Plain text only - no HTML tags in your replies.

**Formatting rules:**
- Write in natural paragraphs. NO bullet points, NO numbered lists, NO dashes, NO markdown formatting in email drafts.
- NO bold (**), NO italic (*), NO headers (#), NO horizontal rules (---), NO code blocks. Plain text only.
- Links go inline in the text, not on separate lines.
- Don't structure replies like a template or form letter. Just talk normally.

**Agent Behavior Rules (CRITICAL):**
- NEVER output meta-commentary about what you are doing (e.g. do not say "I am drafting a reply to Alex", "I checked the thread", etc).
- When a new email arrives, your ONLY job is to call the \`draft_reply\` tool.
- DO NOT summarize the email. DO NOT explain your actions.
- Output NOTHING except the tool call. If you must output text, it should ONLY be the literal draft text itself if tools fail.
- Before drafting ANY reply, carefully read the full thread history.
- NEVER repeat information that was already shared in a prior message in the thread.
- Your reply should only contain NEW information or directly respond to what the person just said. Move the conversation forward, don't rehash it.

## Who Are You Replying To?
Use the name the person gives in their email body / signature. That's their name - use it. The "from" address is where you send the reply, but the name in the email is how you greet them.

## CRITICAL: Draft Only - Never Send
You can ONLY draft emails. You do NOT have the ability to send emails directly.

- Use draft_reply to draft replies to existing emails
- Use draft_email to draft new outbound emails
- The operator will review and send drafts from the UI - you cannot send them

**CRITICAL: The draft body must contain ONLY the email text.** Never include agent commentary, status messages, meta-notes, markdown formatting, or anything that isn't part of the actual email in the draft body. No "Draft created.", no "---", no "**bold**", no "Here's the draft:", no separators. The body field is the literal email the recipient will read. Everything else goes in your chat message, not in the draft body.

**Don't paste draft contents into the chat.** The drafts are saved via tools - the operator can see them in the Drafts folder. In your chat message, just briefly say what you drafted (e.g. "Drafted a reply to Tim"). Don't duplicate the full email body in the chat.

## Draft Management
Use discard_draft to delete drafts that the operator rejects or that are no longer needed.`;

/**
 * Fetch the custom system prompt for a mailbox from its R2 settings.
 * Falls back to DEFAULT_SYSTEM_PROMPT if none is configured.
 */
async function getSystemPrompt(env: Env, mailboxId: string): Promise<string> {
	try {
		const key = `mailboxes/${mailboxId}.json`;
		const obj = await env.BUCKET.get(key);
		if (obj) {
			const settings = await obj.json<Record<string, unknown>>();
			if (typeof settings.agentSystemPrompt === "string" && settings.agentSystemPrompt.trim()) {
				return settings.agentSystemPrompt;
			}
		}
	} catch {
		// Fall through to default
	}
	return DEFAULT_SYSTEM_PROMPT;
}

// Use `any` for the Env generic to avoid type conflicts between the custom
// SEND_EMAIL binding shape and the AIChatAgent constraint.  The actual env
// is fully typed inside the tools via the closure.
export class EmailAgent extends AIChatAgent<any> {
	async onChatMessage(onFinish: any) {
		const env = this.env as Env;
		const mailboxId = this.name;
		if (!env.AI) {
			return new Response(JSON.stringify({ error: "AI not available in local dev" }), { status: 503, headers: { "Content-Type": "application/json" } });
		}
		const workersai = createWorkersAI({ binding: env.AI });
		const rateLimitStorage = asRateLimitStorage(
			(this.state as unknown as { storage: unknown }).storage,
		);
		const tools = createEmailTools(env, mailboxId, rateLimitStorage);
		const systemPrompt = await getSystemPrompt(env, mailboxId);

		const result = streamText({
			model: workersai("@cf/moonshotai/kimi-k2.5"),
			system: systemPrompt,
			messages: await convertToModelMessages(this.messages),
			tools,
			stopWhen: stepCountIs(5),
			onFinish: async (event) => {
				await recordAgentUsage(env, mailboxId, "chat", (event as Record<string, unknown>).usage);
				const chatUsage = (event as Record<string, unknown>).usage as Record<string, unknown> | undefined;
				recordAiEvent(env, {
					mailboxId,
					operation: "chat",
					model: "@cf/moonshotai/kimi-k2.5",
					inputTokens: Number(chatUsage?.inputTokens ?? chatUsage?.promptTokens ?? 0),
					outputTokens: Number(chatUsage?.outputTokens ?? chatUsage?.completionTokens ?? 0),
					costUsd: 0,
					latencyMs: 0,
					status: "ok",
				});
				return onFinish(event);
			},
		});

		return result.toUIMessageStreamResponse();
	}

	/**
	 * Handle HTTP requests to the agent DO. Intercepts /onNewEmail
	 * before passing to the default AIChatAgent handler.
	 */
	async onRequest(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === "/onNewEmail" && request.method === "POST") {
			try {
				const emailData = await request.json() as {
					mailboxId: string;
					emailId: string;
					sender: string;
					subject: string;
					threadId: string;
				};
				const result = await this.handleNewEmail(emailData);
				return new Response(JSON.stringify(result), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (e) {
				console.error("onNewEmail handler failed:", (e as Error).message);
				return new Response(
					JSON.stringify({ error: (e as Error).message }),
					{ status: 500, headers: { "Content-Type": "application/json" } },
				);
			}
		}
		return super.onRequest(request);
	}

	/**
	 * Called when a new email arrives. Pre-reads the email and thread,
	 * runs the triage → draft → review pipeline, then saves the result
	 * as a draft and persists the conversation to chat history.
	 */
	async handleNewEmail(emailData: {
		mailboxId: string;
		emailId: string;
		sender: string;
		subject: string;
		threadId: string;
	}) {
		const env = this.env as Env;
		const systemPrompt = await getSystemPrompt(env, emailData.mailboxId);

		// Pre-read the email and thread so the pipeline has full context
		const stub = getMailboxStub(env, emailData.mailboxId);

		let email: EmailFull | null = null;
		let threadContext = "";
		try {
			email = (await stub.getEmail(emailData.emailId)) as EmailFull | null;
			if (email?.body) {
				const isInjection = await isPromptInjection(env.AI, email.body);
				if (isInjection) {
					console.warn("Skipping auto-draft due to detected prompt injection:", emailData.emailId);
					await recordAgentUsage(env, emailData.mailboxId, "auto_draft", undefined, "blocked", "prompt_injection_email");
					recordAiEvent(env, { mailboxId: emailData.mailboxId, operation: "auto_draft", model: "@cf/moonshotai/kimi-k2.5", inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: 0, status: "blocked", errorCode: "prompt_injection_email" });

					// Log to agent chat so the user knows why it skipped
					const newMessages = [
						{
							id: crypto.randomUUID(),
							role: "user" as const,
							content: `[Auto-triggered] New email from ${emailData.sender}: "${emailData.subject}"`,
							createdAt: new Date(),
							parts: [{ type: "text" as const, text: `[Auto-triggered] New email from ${emailData.sender}: "${emailData.subject}"` }],
						},
						{
							id: crypto.randomUUID(),
							role: "assistant" as const,
							content: "⚠️ Blocked auto-draft creation: the email appears to contain prompt injection or malicious instructions.",
							createdAt: new Date(),
							parts: [{ type: "text" as const, text: "⚠️ Blocked auto-draft creation: the email appears to contain prompt injection or malicious instructions." }],
						},
					];
					await this.persistMessages([...this.messages, ...newMessages]);

					return;
				}
			}

			// Load thread for conversation context
			const threadEmails = (await stub.getEmails({ thread_id: emailData.threadId })) as EmailMetadata[];
			if (threadEmails.length > 1) {
				const fullThread = await Promise.all(
					threadEmails.map(async (e) => {
						const full = (await stub.getEmail(e.id)) as EmailFull | null;
						const text = full?.body ? stripHtmlToText(full.body) : "";
						return { id: e.id, sender: e.sender, recipient: e.recipient, subject: e.subject, date: e.date, folder_id: e.folder_id, body_text: text };
					}),
				);
				fullThread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
				threadContext = fullThread
					.map((e) => `[${e.date}] ${e.sender} → ${e.recipient} (${e.folder_id}): ${e.body_text.substring(0, 500)}`)
					.join("\n\n");

				// Scan thread context for prompt injection too -- an attacker
				// could plant an injection in an earlier email in the thread
				// that gets included in the agent's prompt.
				if (threadContext) {
					const threadInjection = await isPromptInjection(env.AI, threadContext);
					if (threadInjection) {
						console.warn("Skipping auto-draft due to prompt injection in thread context:", emailData.threadId);
						await recordAgentUsage(env, emailData.mailboxId, "auto_draft", undefined, "blocked", "prompt_injection_thread");
						recordAiEvent(env, { mailboxId: emailData.mailboxId, operation: "auto_draft", model: "@cf/moonshotai/kimi-k2.5", inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: 0, status: "blocked", errorCode: "prompt_injection_thread" });
						const newMessages = [
							{
								id: crypto.randomUUID(),
								role: "user" as const,
								content: `[Auto-triggered] New email from ${emailData.sender}: "${emailData.subject}"`,
								createdAt: new Date(),
								parts: [{ type: "text" as const, text: `[Auto-triggered] New email from ${emailData.sender}: "${emailData.subject}"` }],
							},
							{
								id: crypto.randomUUID(),
								role: "assistant" as const,
								content: "Blocked auto-draft creation: the thread context appears to contain prompt injection or malicious instructions.",
								createdAt: new Date(),
								parts: [{ type: "text" as const, text: "Blocked auto-draft creation: the thread context appears to contain prompt injection or malicious instructions." }],
							},
						];
						await this.persistMessages([...this.messages, ...newMessages]);
						return;
					}
				}
			}
		} catch (e) {
			console.warn("Pre-read failed, pipeline will use minimal email data:", (e as Error).message);
		}

		// Build EmailFull from emailData if pre-read failed
		const pipelineEmail: EmailFull = email ?? {
			id: emailData.emailId,
			subject: emailData.subject,
			sender: emailData.sender,
			recipient: emailData.mailboxId,
			date: new Date().toISOString(),
			read: false,
			starred: false,
			body: null,
			thread_id: emailData.threadId,
		};

		// ── Run the triage → draft → review pipeline ──────────────────
		try {
			const pipelineResult = await runEmailPipeline(env, {
				mailboxId: emailData.mailboxId,
				email: pipelineEmail,
				threadContext,
				systemPrompt,
			});

			// ── Save draft if pipeline produced one ────────────────────
			if (pipelineResult.draft && pipelineResult.draft.body.trim()) {
				const draftId = crypto.randomUUID();
				const draftStub = getMailboxStub(env, emailData.mailboxId);
				const body = pipelineResult.draft.body;
				await draftStub.createEmail(
					Folders.DRAFT,
					{
						id: draftId,
						subject: pipelineResult.draft.subject,
						sender: emailData.mailboxId.toLowerCase(),
						recipient: emailData.sender.toLowerCase(),
						date: new Date().toISOString(),
						body: /<[a-z][\s\S]*>/i.test(body)
							? body
							: textToHtml(body),
						in_reply_to: emailData.emailId,
						email_references: null,
						thread_id: emailData.threadId,
						citations_json: pipelineResult.draft.citations?.length
							? JSON.stringify(pipelineResult.draft.citations)
							: null,
					},
					[],
				);
			}

			// Persist the conversation into the agent's chat history
			const assistantText = pipelineResult.draft
				? `Created draft reply to ${emailData.sender}.`
				: pipelineResult.triaged.skipDraft
					? `Skipped auto-draft: ${pipelineResult.triaged.reason}`
					: "Auto-draft skipped.";

			const newMessages = [
				{
					id: crypto.randomUUID(),
					role: "user" as const,
					content: `[Auto-triggered] New email from ${emailData.sender}: "${emailData.subject}"`,
					createdAt: new Date(),
					parts: [
						{
							type: "text" as const,
							text: `[Auto-triggered] New email from ${emailData.sender}: "${emailData.subject}"`,
						},
					],
				},
				{
					id: crypto.randomUUID(),
					role: "assistant" as const,
					content: assistantText,
					createdAt: new Date(),
					parts: [
						{
							type: "text" as const,
							text: assistantText,
						},
					],
				},
			];

			await this.persistMessages([...this.messages, ...newMessages]);

			return {
				status: pipelineResult.draft ? "draft_generated" : "skipped",
				triaged: pipelineResult.triaged,
				text: pipelineResult.draft?.body ?? "",
			};
		} catch (e) {
			console.error("Auto-draft pipeline failed:", (e as Error).message);
			await recordAgentUsage(env, emailData.mailboxId, "auto_draft", undefined, "error", "pipeline_failed");
			recordAiEvent(env, { mailboxId: emailData.mailboxId, operation: "auto_draft", model: "@cf/moonshotai/kimi-k2.5", inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: 0, status: "error", errorCode: "pipeline_failed" });
			return { status: "error", error: (e as Error).message };
		}
	}
}
