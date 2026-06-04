// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { DurableObject } from "cloudflare:workers";
import { addUsageBucket, calculateCompletionRate, emptyUsageBucket, groupTasksByStatus, isTerminalTaskStatus } from "./logic";
import { recordAndCheck } from "../lib/cost-guard/budget";
import type { BudgetEnv, CostCheckResult } from "../lib/cost-guard/budget";
import {
	buildDailyCostSeries,
	buildMonthlyCostSeries,
	aggregateModelUsage,
	type DailyCostPoint,
	type MonthlyCostPoint,
	type ModelUsageRow,
} from "./cost-aggregation";
import type {
	AdminActor,
	AdminClient,
	AdminClientInput,
	AdminSnapshot,
	AdminTask,
	AdminTaskInput,
	AgentUsageBucket,
	AgentUsageEventInput,
} from "./types";

type Row = Record<string, string | number | null>;

export class AdminDO extends DurableObject<any> {
	constructor(state: DurableObjectState, env: any) {
		super(state, env);
		this.migrate();
	}

	private migrate() {
		this.ctx.storage.transactionSync(() => {
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS clients (
					id TEXT PRIMARY KEY,
					name TEXT NOT NULL,
					company TEXT NOT NULL,
					email TEXT,
					owner TEXT,
					status TEXT NOT NULL,
					tags TEXT NOT NULL DEFAULT '[]',
					notes TEXT,
					created_at TEXT NOT NULL,
					updated_at TEXT NOT NULL
				);

				CREATE TABLE IF NOT EXISTS tasks (
					id TEXT PRIMARY KEY,
					client_id TEXT NOT NULL,
					title TEXT NOT NULL,
					type TEXT NOT NULL,
					status TEXT NOT NULL,
					priority TEXT NOT NULL,
					owner TEXT,
					due_date TEXT,
					completion INTEGER NOT NULL DEFAULT 0,
					mailbox_id TEXT,
					request_email_id TEXT,
					issue TEXT,
					notes TEXT,
					created_at TEXT NOT NULL,
					updated_at TEXT NOT NULL,
					FOREIGN KEY(client_id) REFERENCES clients(id)
				);

				CREATE TABLE IF NOT EXISTS task_events (
					id TEXT PRIMARY KEY,
					task_id TEXT NOT NULL,
					event_type TEXT NOT NULL,
					from_status TEXT,
					to_status TEXT,
					actor_email TEXT NOT NULL,
					actor_role TEXT NOT NULL,
					metadata TEXT NOT NULL DEFAULT '{}',
					created_at TEXT NOT NULL
				);

				CREATE TABLE IF NOT EXISTS agent_usage_events (
					id TEXT PRIMARY KEY,
					agent_id TEXT NOT NULL,
					operation TEXT NOT NULL,
					model TEXT,
					input_tokens INTEGER NOT NULL DEFAULT 0,
					output_tokens INTEGER NOT NULL DEFAULT 0,
					cost_usd REAL NOT NULL DEFAULT 0,
					latency_ms INTEGER,
					status TEXT NOT NULL,
					error_code TEXT,
					created_at TEXT NOT NULL
				);

				CREATE TABLE IF NOT EXISTS audit_logs (
					id TEXT PRIMARY KEY,
					entity_type TEXT NOT NULL,
					entity_id TEXT NOT NULL,
					action TEXT NOT NULL,
					actor_email TEXT NOT NULL,
					actor_role TEXT NOT NULL,
					before_json TEXT,
					after_json TEXT,
					created_at TEXT NOT NULL
				);

				CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON tasks(client_id, status);
				CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks(status, due_date);
				CREATE INDEX IF NOT EXISTS idx_usage_created ON agent_usage_events(created_at);
				CREATE INDEX IF NOT EXISTS idx_usage_agent_created ON agent_usage_events(agent_id, created_at);
			`);
		});
	}

	private now() {
		return new Date().toISOString();
	}

	private parseTags(value: string | number | null): string[] {
		if (typeof value !== "string") return [];
		try {
			const parsed = JSON.parse(value) as unknown;
			return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
		} catch {
			return [];
		}
	}

	private clientFromRow(row: Row): AdminClient {
		return {
			id: String(row.id),
			name: String(row.name),
			company: String(row.company),
			email: typeof row.email === "string" ? row.email : "",
			owner: typeof row.owner === "string" ? row.owner : "",
			status: String(row.status) as AdminClient["status"],
			tags: this.parseTags(row.tags),
			notes: typeof row.notes === "string" ? row.notes : "",
			createdAt: String(row.created_at),
			updatedAt: String(row.updated_at),
		};
	}

	private taskFromRow(row: Row): AdminTask {
		return {
			id: String(row.id),
			clientId: String(row.client_id),
			title: String(row.title),
			type: String(row.type) as AdminTask["type"],
			status: String(row.status) as AdminTask["status"],
			priority: String(row.priority) as AdminTask["priority"],
			owner: typeof row.owner === "string" ? row.owner : "",
			dueDate: typeof row.due_date === "string" ? row.due_date : "",
			completion: Number(row.completion ?? 0),
			mailboxId: typeof row.mailbox_id === "string" ? row.mailbox_id : "",
			requestEmailId: typeof row.request_email_id === "string" ? row.request_email_id : "",
			issue: typeof row.issue === "string" ? row.issue : "",
			notes: typeof row.notes === "string" ? row.notes : "",
			createdAt: String(row.created_at),
			updatedAt: String(row.updated_at),
		};
	}

	private listClientRows() {
		return [...this.ctx.storage.sql.exec("SELECT * FROM clients ORDER BY updated_at DESC")] as Row[];
	}

	private listTaskRows() {
		return [...this.ctx.storage.sql.exec("SELECT * FROM tasks ORDER BY updated_at DESC")] as Row[];
	}

	private audit(entityType: string, entityId: string, action: string, actor: AdminActor, before: unknown, after: unknown) {
		this.ctx.storage.sql.exec(
			`INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_email, actor_role, before_json, after_json, created_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
			crypto.randomUUID(),
			entityType,
			entityId,
			action,
			actor.email,
			actor.role,
			before == null ? null : JSON.stringify(before),
			after == null ? null : JSON.stringify(after),
			this.now(),
		);
	}

	async listClients() {
		return this.listClientRows().map((row) => this.clientFromRow(row));
	}

	async createClient(input: AdminClientInput, actor: AdminActor) {
		const now = this.now();
		const client: AdminClient = {
			id: crypto.randomUUID(),
			...input,
			createdAt: now,
			updatedAt: now,
		};
		this.ctx.storage.transactionSync(() => {
			this.ctx.storage.sql.exec(
				`INSERT INTO clients (id, name, company, email, owner, status, tags, notes, created_at, updated_at)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
				client.id,
				client.name,
				client.company,
				client.email ?? "",
				client.owner ?? "",
				client.status,
				JSON.stringify(client.tags),
				client.notes ?? "",
				now,
				now,
			);
			this.audit("client", client.id, "create", actor, null, client);
		});
		return client;
	}

	async updateClient(id: string, input: AdminClientInput, actor: AdminActor) {
		const beforeRow = [...this.ctx.storage.sql.exec("SELECT * FROM clients WHERE id = ?1", id)][0] as Row | undefined;
		if (!beforeRow) return null;
		const before = this.clientFromRow(beforeRow);
		const updated: AdminClient = { id, ...input, createdAt: before.createdAt, updatedAt: this.now() };
		this.ctx.storage.transactionSync(() => {
			this.ctx.storage.sql.exec(
				`UPDATE clients SET name = ?1, company = ?2, email = ?3, owner = ?4, status = ?5,
				 tags = ?6, notes = ?7, updated_at = ?8 WHERE id = ?9`,
				updated.name,
				updated.company,
				updated.email ?? "",
				updated.owner ?? "",
				updated.status,
				JSON.stringify(updated.tags),
				updated.notes ?? "",
				updated.updatedAt,
				id,
			);
			this.audit("client", id, "update", actor, before, updated);
		});
		return updated;
	}

	async listTasks(filters: { status?: string; clientId?: string } = {}) {
		const conditions: string[] = [];
		const params: string[] = [];
		if (filters.status) {
			params.push(filters.status);
			conditions.push(`status = ?${params.length}`);
		}
		if (filters.clientId) {
			params.push(filters.clientId);
			conditions.push(`client_id = ?${params.length}`);
		}
		const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
		return [...this.ctx.storage.sql.exec(`SELECT * FROM tasks ${where} ORDER BY updated_at DESC`, ...params)]
			.map((row) => this.taskFromRow(row as Row));
	}

	async createTask(input: AdminTaskInput, actor: AdminActor) {
		const client = [...this.ctx.storage.sql.exec("SELECT id FROM clients WHERE id = ?1", input.clientId)][0];
		if (!client) throw new Error("Client not found");
		const now = this.now();
		const task: AdminTask = {
			id: crypto.randomUUID(),
			...input,
			completion: isTerminalTaskStatus(input.status) ? 100 : input.completion,
			createdAt: now,
			updatedAt: now,
		};
		this.ctx.storage.transactionSync(() => {
			this.ctx.storage.sql.exec(
				`INSERT INTO tasks (id, client_id, title, type, status, priority, owner, due_date, completion,
				 mailbox_id, request_email_id, issue, notes, created_at, updated_at)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`,
				task.id,
				task.clientId,
				task.title,
				task.type,
				task.status,
				task.priority,
				task.owner ?? "",
				task.dueDate ?? "",
				task.completion,
				task.mailboxId ?? "",
				task.requestEmailId ?? "",
				task.issue ?? "",
				task.notes ?? "",
				now,
				now,
			);
			this.ctx.storage.sql.exec(
				`INSERT INTO task_events (id, task_id, event_type, to_status, actor_email, actor_role, metadata, created_at)
				 VALUES (?1, ?2, 'create', ?3, ?4, ?5, ?6, ?7)`,
				crypto.randomUUID(),
				task.id,
				task.status,
				actor.email,
				actor.role,
				JSON.stringify({ completion: task.completion }),
				now,
			);
			this.audit("task", task.id, "create", actor, null, task);
		});
		return task;
	}

	async updateTask(id: string, input: AdminTaskInput, actor: AdminActor) {
		const beforeRow = [...this.ctx.storage.sql.exec("SELECT * FROM tasks WHERE id = ?1", id)][0] as Row | undefined;
		if (!beforeRow) return null;
		const client = [...this.ctx.storage.sql.exec("SELECT id FROM clients WHERE id = ?1", input.clientId)][0];
		if (!client) throw new Error("Client not found");
		const before = this.taskFromRow(beforeRow);
		const updated: AdminTask = {
			id,
			...input,
			completion: isTerminalTaskStatus(input.status) ? 100 : input.completion,
			createdAt: before.createdAt,
			updatedAt: this.now(),
		};
		this.ctx.storage.transactionSync(() => {
			this.ctx.storage.sql.exec(
				`UPDATE tasks SET client_id = ?1, title = ?2, type = ?3, status = ?4, priority = ?5,
				 owner = ?6, due_date = ?7, completion = ?8, mailbox_id = ?9, request_email_id = ?10,
				 issue = ?11, notes = ?12, updated_at = ?13 WHERE id = ?14`,
				updated.clientId,
				updated.title,
				updated.type,
				updated.status,
				updated.priority,
				updated.owner ?? "",
				updated.dueDate ?? "",
				updated.completion,
				updated.mailboxId ?? "",
				updated.requestEmailId ?? "",
				updated.issue ?? "",
				updated.notes ?? "",
				updated.updatedAt,
				id,
			);
			if (before.status !== updated.status) {
				this.ctx.storage.sql.exec(
					`INSERT INTO task_events (id, task_id, event_type, from_status, to_status, actor_email, actor_role, metadata, created_at)
					 VALUES (?1, ?2, 'status_change', ?3, ?4, ?5, ?6, ?7, ?8)`,
					crypto.randomUUID(),
					id,
					before.status,
					updated.status,
					actor.email,
					actor.role,
					JSON.stringify({ completion: updated.completion }),
					updated.updatedAt,
				);
			}
			this.audit("task", id, "update", actor, before, updated);
		});
		return updated;
	}

	async recordAgentUsage(input: AgentUsageEventInput) {
		const createdAt = input.createdAt ?? this.now();
		this.ctx.storage.sql.exec(
			`INSERT INTO agent_usage_events (id, agent_id, operation, model, input_tokens, output_tokens,
			 cost_usd, latency_ms, status, error_code, created_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
			crypto.randomUUID(),
			input.agentId,
			input.operation,
			input.model ?? "",
			input.inputTokens ?? 0,
			input.outputTokens ?? 0,
			input.costUsd ?? 0,
			input.latencyMs ?? null,
			input.status,
			input.errorCode ?? "",
			createdAt,
		);
		return { recorded: true };
	}

	async recordCostAndCheck(costUsd: number, budgetEnv: BudgetEnv): Promise<CostCheckResult> {
		const storage = {
			get: async (key: string): Promise<number | undefined> => {
				const val = await this.ctx.storage.get<number>(key);
				return val ?? undefined;
			},
			put: async (key: string, value: number): Promise<void> => {
				await this.ctx.storage.put(key, value);
			},
		};
		return recordAndCheck(storage, costUsd, budgetEnv);
	}

	private usageSince(days: number): AgentUsageBucket {
		const start = new Date();
		start.setUTCDate(start.getUTCDate() - (days - 1));
		const startKey = start.toISOString().slice(0, 10);
		const row = [...this.ctx.storage.sql.exec(
			`SELECT COUNT(*) as calls,
			        COALESCE(SUM(input_tokens), 0) as inputTokens,
			        COALESCE(SUM(output_tokens), 0) as outputTokens,
			        COALESCE(SUM(CASE WHEN operation = 'chat' THEN 1 ELSE 0 END), 0) as chatHits,
			        COALESCE(SUM(cost_usd), 0) as costUsd,
			        COALESCE(SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END), 0) as errors,
			        COALESCE(SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END), 0) as blocked
			   FROM agent_usage_events
			  WHERE SUBSTR(created_at, 1, 10) >= ?1`,
			startKey,
		)][0] as Row | undefined;

		return {
			calls: Number(row?.calls ?? 0),
			inputTokens: Number(row?.inputTokens ?? 0),
			outputTokens: Number(row?.outputTokens ?? 0),
			chatHits: Number(row?.chatHits ?? 0),
			costUsd: Number(row?.costUsd ?? 0),
			errors: Number(row?.errors ?? 0),
			blocked: Number(row?.blocked ?? 0),
		};
	}

	async getSnapshot(): Promise<AdminSnapshot> {
		const clients = this.listClientRows().map((row) => this.clientFromRow(row));
		const tasks = this.listTaskRows().map((row) => this.taskFromRow(row));
		const today = new Date().toISOString().slice(0, 10);
		const usageRows = [...this.ctx.storage.sql.exec(
			`SELECT SUBSTR(created_at, 1, 10) as date,
			        agent_id as agentId,
			        COUNT(*) as calls,
			        COALESCE(SUM(input_tokens), 0) as inputTokens,
			        COALESCE(SUM(output_tokens), 0) as outputTokens,
			        COALESCE(SUM(CASE WHEN operation = 'chat' THEN 1 ELSE 0 END), 0) as chatHits,
			        COALESCE(SUM(cost_usd), 0) as costUsd,
			        COALESCE(SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END), 0) as errors,
			        COALESCE(SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END), 0) as blocked
			   FROM agent_usage_events
			  WHERE created_at >= datetime('now', '-29 days')
			  GROUP BY SUBSTR(created_at, 1, 10), agent_id
			  ORDER BY date ASC, agent_id ASC`,
		)] as Row[];

		return {
			generatedAt: this.now(),
			clients,
			tasks,
			charts: {
				tasksByStatus: groupTasksByStatus(tasks),
				tasksByClient: clients.map((client) => {
					const clientTasks = tasks.filter((task) => task.clientId === client.id);
					return {
						clientId: client.id,
						clientName: client.company || client.name,
						total: clientTasks.length,
						completed: clientTasks.filter((task) => isTerminalTaskStatus(task.status)).length,
						overdue: clientTasks.filter((task) =>
							task.dueDate && task.dueDate < today && !isTerminalTaskStatus(task.status)
						).length,
					};
				}),
				aiUsageByDay: usageRows.map((row) => ({
					date: String(row.date),
					agentId: String(row.agentId),
					calls: Number(row.calls ?? 0),
					inputTokens: Number(row.inputTokens ?? 0),
					outputTokens: Number(row.outputTokens ?? 0),
					chatHits: Number(row.chatHits ?? 0),
					costUsd: Number(row.costUsd ?? 0),
					errors: Number(row.errors ?? 0),
					blocked: Number(row.blocked ?? 0),
				})),
			},
			aiUsage: {
				day: this.usageSince(1),
				week: this.usageSince(7),
				month: this.usageSince(30),
				total: addUsageBucket(this.usageSince(3650), emptyUsageBucket()),
			},
		};
	}

	async getReport() {
		const snapshot = await this.getSnapshot();
		return {
			...snapshot,
			totals: {
				clients: snapshot.clients.length,
				tasks: snapshot.tasks.length,
				completedTasks: snapshot.tasks.filter((task) => isTerminalTaskStatus(task.status)).length,
				openTasks: snapshot.tasks.filter((task) => !isTerminalTaskStatus(task.status)).length,
				completionRate: calculateCompletionRate(snapshot.tasks),
			},
		};
	}

	async getDailyCostSeries(days: number = 30, now: () => number = Date.now): Promise<DailyCostPoint[]> {
		const dailyLimit = parseFloat(this.env.DAILY_BUDGET_USD ?? "10");
		const list = await this.ctx.storage.list<number>({ prefix: "cost:day:" });
		const data: Array<{ day: string; costUsd: number }> = [];
		for (const [key, value] of list) {
			data.push({ day: key.slice("cost:day:".length), costUsd: typeof value === "number" ? value : 0 });
		}
		const endDay = new Date(now()).toISOString().slice(0, 10);
		return buildDailyCostSeries(data, dailyLimit, endDay, days);
	}

	async getMonthlyCostSeries(months: number = 6, now: () => number = Date.now): Promise<MonthlyCostPoint[]> {
		const monthlyLimit = parseFloat(this.env.MONTHLY_BUDGET_USD ?? "200");
		const list = await this.ctx.storage.list<number>({ prefix: "cost:month:" });
		const data: Array<{ month: string; costUsd: number }> = [];
		for (const [key, value] of list) {
			data.push({ month: key.slice("cost:month:".length), costUsd: typeof value === "number" ? value : 0 });
		}
		const t = new Date(now());
		const endMonth = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
		return buildMonthlyCostSeries(data, monthlyLimit, endMonth, months);
	}

	async getModelUsageBreakdown(days: number = 7): Promise<ModelUsageRow[]> {
		const start = new Date();
		start.setUTCDate(start.getUTCDate() - (days - 1));
		const startKey = start.toISOString().slice(0, 10);
		const rawRows = [...this.ctx.storage.sql.exec(
			`SELECT model, operation, input_tokens, output_tokens
			   FROM agent_usage_events
			  WHERE SUBSTR(created_at, 1, 10) >= ?1
			    AND model IS NOT NULL AND model != ''`,
			startKey,
		)] as Array<Record<string, string | number | null>>;
		const normalized = rawRows.map((r) => ({
			model: String(r.model ?? ""),
			operation: String(r.operation ?? ""),
			inputTokens: Number(r.input_tokens ?? 0),
			outputTokens: Number(r.output_tokens ?? 0),
		}));
		return aggregateModelUsage(normalized);
	}
}
