// Vite plugin to handle AI draft API for local development
import type { Plugin } from 'vite';
import { readFileSync } from 'fs';

interface AiMockPluginOptions {
	enabled?: boolean;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
	return typeof value === 'object' && value !== null;
}

function getStringField(value: unknown, field: string): string | undefined {
	if (!isRecord(value)) return undefined;
	const candidate = value[field];
	return typeof candidate === 'string' ? candidate : undefined;
}

function getChatCompletionText(value: unknown): string {
	if (!isRecord(value)) return '';
	const choices = value.choices;
	if (!Array.isArray(choices)) return '';
	const firstChoice = choices[0];
	if (!isRecord(firstChoice)) return '';
	const message = firstChoice.message;
	if (!isRecord(message)) return '';
	const content = message.content;
	return typeof content === 'string' ? content : '';
}

export function aiMockPlugin(options: AiMockPluginOptions = {}): Plugin {
	const enabled = options.enabled !== false;

	// Read environment variables
	const getEnvVar = (name: string): string => {
		try {
			const envContent = readFileSync('.dev.vars', 'utf-8');
			const match = envContent.match(new RegExp(`^${name}=*(.+)$`, 'm'));
			return match ? match[1].trim() : '';
		} catch {
			return '';
		}
	};

	const kimiApiKey = getEnvVar('KIMI_API_KEY');
	const kimiBaseUrl = getEnvVar('KIMI_BASE_URL') || 'https://api.moonshot.cn/v1';
	const aiProvider = getEnvVar('AI_PROVIDER') || 'kimi';

	return {
		name: 'ai-mock-plugin',
		configureServer(server) {
			if (!enabled) return;

			server.middlewares.use(async (req, res, next) => {
				if (req.url?.includes('/api/v1/mailboxes/') && req.url?.includes('/ai/draft') && req.method === 'POST') {
					try {
						// Parse request body
						const body = await new Promise<unknown>((resolve) => {
							let data = '';
							req.on('data', (chunk) => { data += chunk; });
							req.on('end', () => {
								try {
									resolve(JSON.parse(data));
								} catch {
									resolve({});
								}
							});
						});

						const emailId = getStringField(body, 'email_id');
						const sender = getStringField(body, 'sender');
						const subject = getStringField(body, 'subject');
						const threadId = getStringField(body, 'thread_id');

						console.log('[AI Plugin] Processing draft request:', { emailId, sender, subject, threadId, aiProvider });

						// Call Kimi API
						if (aiProvider === 'kimi' && kimiApiKey) {
							const response = await fetch(`${kimiBaseUrl}/chat/completions`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${kimiApiKey}`,
								},
								body: JSON.stringify({
									model: 'moonshot-v1-8k',
									messages: [
										{
											role: 'system',
											content: `You are an email assistant that helps draft replies. Write professional, concise email responses in Korean. Always include a polite greeting and closing.`,
										},
										{
											role: 'user',
											content: `Draft a reply to this email:\n\nFrom: ${sender || 'Unknown'}\nSubject: ${subject || 'No subject'}\n\nWrite a professional, helpful response that acknowledges receipt and provides next steps.`,
										},
									],
									temperature: 0.7,
									max_tokens: 500,
								}),
							});

							if (response.ok) {
								const data = await response.json();
								const aiText = getChatCompletionText(data);

								const draftResponse = {
									draft_id: `draft_${Date.now()}`,
									subject: subject ? `Re: ${subject}` : 'Re: Your email',
									body_text: aiText.trim(),
								};

								console.log('[AI Plugin] Draft generated successfully');
								res.setHeader('Content-Type', 'application/json');
								res.writeHead(200);
								res.end(JSON.stringify(draftResponse));
								return;
							} else {
								const errorText = await response.text();
								console.error('[AI Plugin] Kimi API error:', response.status, errorText);
							}
						}

						// Fallback to mock if API call fails or no API key
						console.log('[AI Plugin] Using fallback mock response');
						await new Promise(resolve => setTimeout(resolve, 1500));

						const mockDraft = {
							draft_id: `draft_${Date.now()}`,
							subject: subject ? `Re: ${subject}` : 'Re: Your email',
							body_text: `감사합니다. 귀하의 이메일을 잘 받았습니다.

곧 연락드리겠습니다.

본인 드림`,
						};

						res.setHeader('Content-Type', 'application/json');
						res.writeHead(200);
						res.end(JSON.stringify(mockDraft));
					} catch (error) {
						console.error('[AI Plugin] Error:', error);
						res.setHeader('Content-Type', 'application/json');
						res.writeHead(500);
						res.end(JSON.stringify({ error: 'Failed to generate AI draft' }));
					}
					return;
				}
				next();
			});
		},
	};
}
