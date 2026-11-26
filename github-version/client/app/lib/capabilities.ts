// What this build can actually do. The Replit production build ships without
// mail delivery and without the AI service: its server answers those requests
// with 403 and 503. Components ask for a capability, never for the platform.
const isReplitProduction = import.meta.env.VITE_REPLIT_PRODUCTION === "true";

export const capabilities = {
	/** Deliver a message. Off means a message can only be saved as a draft. */
	sendMail: !isReplitProduction,
	/** Draft replies and chat with the AI service. */
	aiAssistant: !isReplitProduction,
	/** Workers AI is reached only from the Cloudflare deployment, never from Replit. */
	workersAi: !isReplitProduction,
	/** Administrator password login with a server session. */
	sessionLogin: isReplitProduction,
};
