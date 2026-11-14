import { Button } from "@cloudflare/kumo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { queryKeys } from "~/queries/keys";
import { campaignDemoApi, type CampaignWorkspace } from "~/services/campaign-demo";

type View = "summary" | "reply" | "requirements" | "campaign";
type Props = { mailboxId: string; emailId: string; threadId?: string | null };
const views: { key: View; label: string }[] = [
	{ key: "summary", label: "Summary" },
	{ key: "reply", label: "Draft reply" },
	{ key: "requirements", label: "Requirement" },
	{ key: "campaign", label: "Make campaign" },
];
const inputClass = "mt-1 w-full rounded-lg border border-kumo-line bg-kumo-base px-3 py-2 text-sm text-kumo-default focus:outline-none focus:ring-2 focus:ring-kumo-brand disabled:opacity-60";
const valuesOf = (workspace: CampaignWorkspace) =>
	Object.fromEntries(workspace.requirements.map((field) => [field.key, field.value]));

export default function CampaignActions({ mailboxId, emailId, threadId }: Props) {
	const queryClient = useQueryClient();
	const id = useId();
	const [view, setView] = useState<View | null>(null);
	const [workspace, setWorkspace] = useState<CampaignWorkspace | null>(null);
	const [requirements, setRequirements] = useState<Record<string, string>>({});
	const [reply, setReply] = useState({ subject: "", body: "" });
	const [savedReply, setSavedReply] = useState({ subject: "", body: "" });
	const [title, setTitle] = useState("");
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(true);
	const [attempt, setAttempt] = useState(0);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError("");
		campaignDemoApi.getWorkspace(mailboxId, emailId).then((data) => {
			if (!active) return;
			setWorkspace(data);
			setRequirements(valuesOf(data));
			setReply(data.reply);
			setSavedReply(data.reply);
			setTitle(data.campaign?.title || data.summary.headline);
			setNotes(data.campaign?.notes || "");
		}).catch((err: unknown) => {
if (active) setError(err instanceof Error ? err.message : "캠페인 작업 공간을 불러오지 못했습니다.");
		}).finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [mailboxId, emailId, attempt]);

	const requirementsDirty = Boolean(workspace?.requirements.some((field) => requirements[field.key] !== field.value));
	const replyDirty = reply.subject !== savedReply.subject || reply.body !== savedReply.body;
	const campaignDirty = workspace?.campaign
		? title !== workspace.campaign.title || notes !== workspace.campaign.notes ||
			workspace.requirements.some((field) => requirements[field.key] !== (workspace.campaign?.fields[field.key] || ""))
		: Boolean(notes) || Boolean(workspace && title !== workspace.summary.headline);
	const dirty = requirementsDirty || replyDirty || campaignDirty;
	useEffect(() => {
		if (!dirty) return;
		const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [dirty]);

	// Only persist user overrides; unchanged email evidence must retain its provenance.
	const overrides = () => Object.fromEntries(
		(workspace?.requirements || [])
			.filter((field) => field.source === "user" || requirements[field.key] !== field.value)
			.map((field) => [field.key, requirements[field.key] || ""]),
	);
	const save = async (kind: "requirements" | "reply" | "campaign") => {
		if (!workspace || pending) return;
		setPending(true);
		setError("");
		setSuccess("");
		try {
			const data = kind === "requirements"
				? await campaignDemoApi.saveRequirements(mailboxId, emailId, overrides())
				: kind === "reply"
					? await campaignDemoApi.saveReply(mailboxId, emailId, reply)
					: await campaignDemoApi.makeCampaign(mailboxId, emailId, { title, notes, requirements: overrides() });
			setWorkspace(data);
			// Never replace locally edited reply text when requirements or campaign change.
			if (kind !== "reply") setRequirements(valuesOf(data));
			if (kind === "reply") {
				setReply(data.reply);
				setSavedReply(data.reply);
				const listPrefix = queryKeys.emails.list(mailboxId, {}).slice(0, 2);
				void queryClient.invalidateQueries({
					predicate: (query) => query.queryKey[0] === listPrefix[0] &&
						query.queryKey[1] === listPrefix[1] &&
						typeof query.queryKey[2] === "object",
				});
				if (threadId) void queryClient.invalidateQueries({ queryKey: queryKeys.emails.thread(mailboxId, threadId) });
				void queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(mailboxId) });
				setSuccess("Drafts 폴더에 회신 초안을 저장했습니다. 발송하지 않았습니다.");
			} else if (kind === "campaign") {
				setTitle(data.campaign?.title || title);
				setNotes(data.campaign?.notes || "");
				setSuccess("캠페인 DRAFT를 저장했습니다. 활성화 또는 발송하지 않았습니다.");
			} else {
				setSuccess("요구사항을 저장하고 검토 결과를 갱신했습니다. 작성 중인 회신은 유지됩니다.");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해 주세요.");
		} finally { setPending(false); }
	};

	return (
<section aria-label="캠페인 작업 공간" className="border-b border-kumo-line bg-kumo-recessed">
			<div className="px-4 py-3">
				<div className="flex flex-wrap gap-2" aria-label="캠페인 작업">
					{views.map((item) => (
						<Button key={item.key} size="sm" variant={view === item.key ? "primary" : "secondary"}
							aria-expanded={view === item.key} aria-controls={`${id}-result`}
							onClick={() => { setView(view === item.key ? null : item.key); setSuccess(""); }}>
							{item.label}
						</Button>
					))}
				</div>
				{workspace?.campaignStale && <p className="mt-1 text-xs font-medium text-kumo-default">캠페인 DRAFT 업데이트 필요 · Make campaign에서 현재 요구사항으로 다시 저장해 주세요.</p>}
				{dirty && <p className="mt-1 text-xs font-medium text-kumo-default">저장하지 않은 변경사항이 있습니다. 메일을 이동하기 전에 해당 항목을 저장해 주세요.</p>}
			</div>
			{(view || error) && (
				<div id={`${id}-result`} role="region" aria-label="캠페인 작업 결과" tabIndex={0} className="mx-4 mb-4 max-h-[50dvh] overflow-y-auto overscroll-contain rounded-xl border border-kumo-line bg-kumo-base p-4" aria-busy={loading || pending}>
					{error && <div role="alert" className="mb-3 rounded-lg border border-kumo-line bg-kumo-recessed p-3 text-sm text-kumo-default">
						<p>{error}</p>
						{!workspace && <Button size="sm" variant="secondary" className="mt-2" onClick={() => setAttempt((value) => value + 1)}>다시 불러오기</Button>}
						{workspace && <p className="mt-1 text-xs">입력 내용은 유지됩니다. 아래 저장 버튼으로 다시 시도해 주세요.</p>}
					</div>}
					{success && <p role="status" className="mb-3 rounded-lg bg-kumo-recessed p-3 text-sm text-kumo-default">{success}</p>}
					{loading ? <div role="status" aria-label="작업 공간 불러오는 중" className="animate-pulse space-y-3"><div className="h-4 w-3/4 rounded bg-kumo-fill" /><div className="h-3 w-full rounded bg-kumo-fill" /><div className="h-3 w-2/3 rounded bg-kumo-fill" /></div> : workspace && (
						<>
							{view === "summary" && <div className="space-y-4">
								<h3 className="text-sm font-semibold text-kumo-default">{workspace.summary.headline}</h3>
								<ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-kumo-default">{workspace.summary.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
								{requirementsDirty && <p className="text-xs text-kumo-subtle">요약은 마지막으로 저장된 요구사항 기준입니다.</p>}
								<details className="rounded-lg border border-kumo-line p-3">
									<summary className="cursor-pointer text-sm font-medium text-kumo-default">원본 이메일 근거 보기</summary>
									<div className="mt-3 space-y-2">{workspace.requirements.filter((field) => field.evidence).map((field) => <blockquote key={field.key} className="border-l-2 border-kumo-line pl-3 text-xs leading-5 text-kumo-subtle">{field.evidence}</blockquote>)}</div>
								</details>
							</div>}
							{view === "requirements" && <div className="space-y-4">
								<div><h3 className="text-sm font-semibold text-kumo-default">요구사항 검토</h3><p className="mt-1 text-xs text-kumo-subtle">필수 항목을 확인하고 미확정 조건은 담당자에게 질문해 주세요.</p></div>
								<fieldset disabled={pending} className="grid gap-4 md:grid-cols-2">
									{workspace.requirements.map((field) => {
										const missing = workspace.missing.find((item) => item.key === field.key);
										const changed = requirements[field.key] !== field.value;
										return <div key={field.key} className="min-w-0">
											<label htmlFor={`${id}-${field.key}`} className="text-xs font-semibold text-kumo-default">{field.label} {field.required && <span className="text-kumo-subtle">(필수)</span>}</label>
											{field.key === "channel" ? <select id={`${id}-${field.key}`} className={inputClass} value={requirements[field.key] || ""} onChange={(event) => setRequirements({ ...requirements, [field.key]: event.target.value })}><option value="">미확인</option><option>Popup</option><option>Web push</option><option>Inline banner</option></select> :
												<input id={`${id}-${field.key}`} className={inputClass} value={requirements[field.key] || ""} maxLength={2000} placeholder="미확인" onChange={(event) => setRequirements({ ...requirements, [field.key]: event.target.value })} />}
											<p className="mt-1 text-[11px] text-kumo-subtle">출처: {changed ? "user · 사용자 수정 (미저장)" : field.source === "email" ? "email · 원본 메일" : field.source === "user" ? "user · 사용자 입력" : "missing · 미확인"}</p>
											{field.evidence && <blockquote className="mt-1 break-words text-xs leading-5 text-kumo-subtle">{field.evidence}</blockquote>}
											{missing && <div className="mt-2 rounded-lg bg-kumo-recessed p-2 text-xs leading-5 text-kumo-default"><p>{missing.reason}</p><p className="mt-1">확인 질문: {missing.question}</p></div>}
										</div>;
									})}
								</fieldset>
								<p className="text-xs text-kumo-subtle">필수 여부와 누락 사유는 저장 후 다시 계산됩니다. 빈 항목이 있어도 검토용으로 저장할 수 있습니다.</p>
								<Button size="sm" variant="primary" disabled={pending || !requirementsDirty} onClick={() => void save("requirements")}>{pending ? "저장 중…" : "요구사항 저장"}</Button>
							</div>}
							{view === "reply" && <div className="space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-kumo-default">회신 초안</h3><span className="text-xs text-kumo-subtle">{workspace.replyDraftId ? "저장된 Drafts 초안 불러옴" : "아직 저장하지 않은 추천 초안"}</span></div>
								<fieldset disabled={pending} className="space-y-3">
									<label className="block text-xs font-medium text-kumo-default">제목<input className={inputClass} maxLength={500} value={reply.subject} onChange={(event) => setReply({ ...reply, subject: event.target.value })} /></label>
									<label className="block text-xs font-medium text-kumo-default">본문<textarea className={`${inputClass} min-h-52 resize-y leading-6`} maxLength={30000} value={reply.body} onChange={(event) => setReply({ ...reply, body: event.target.value })} /></label>
								</fieldset>
								{requirementsDirty && <p className="text-xs text-kumo-subtle">변경된 요구사항을 먼저 저장한 뒤 추천 초안을 적용할 수 있습니다.</p>}
								<div className="flex flex-wrap gap-2">
									<Button size="sm" variant="primary" disabled={pending || !reply.subject.trim() || !reply.body.trim()} onClick={() => void save("reply")}>{pending ? "저장 중…" : "Drafts에 저장"}</Button>
									<Button size="sm" variant="secondary" disabled={pending || requirementsDirty} onClick={() => {
										if (replyDirty && !window.confirm("작성 중인 회신을 저장된 요구사항 기반 추천 초안으로 바꿀까요?")) return;
										setReply({ ...workspace.suggestedReply });
										setSuccess("반환된 추천 초안을 적용했습니다. Drafts 저장은 별도로 진행해 주세요.");
									}}>추천 초안 다시 적용</Button>
								</div>
								<p className="text-xs text-kumo-subtle">저장만 수행하며 이메일을 발송하지 않습니다. 다시 저장하면 같은 초안을 갱신합니다.</p>
							</div>}
							{view === "campaign" && <div className="space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-kumo-default">캠페인 구성 초안</h3><span className="rounded border border-kumo-line bg-kumo-recessed px-2 py-1 text-xs font-semibold text-kumo-default">DRAFT</span></div>
								<p className="text-xs leading-5 text-kumo-subtle">검토용 초안만 저장합니다. 캠페인은 활성화되거나 집행되지 않습니다.</p>
								{workspace.campaignStale && <p role="status" className="rounded-lg border border-kumo-line bg-kumo-recessed p-3 text-xs leading-5 text-kumo-default">저장된 캠페인 초안이 현재 요구사항과 다릅니다. 기존 초안은 변경되지 않았습니다. 아래 업데이트 버튼으로 다시 저장해 주세요.</p>}
								<fieldset disabled={pending} className="space-y-3">
									<label className="block text-xs font-medium text-kumo-default">초안 이름<input className={inputClass} maxLength={300} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
									<label className="block text-xs font-medium text-kumo-default">운영 메모<textarea className={`${inputClass} min-h-20`} maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="검토 담당자와 다음 확인 사항" /></label>
								</fieldset>
								<details className="rounded-lg border border-kumo-line p-3"><summary className="cursor-pointer text-xs font-medium text-kumo-default">저장할 현재 요구사항 {requirementsDirty && "(미저장 변경 포함)"}</summary><dl className="mt-3 space-y-2">{workspace.requirements.map((field) => <div key={field.key} className="text-xs leading-5"><dt className="font-medium text-kumo-default">{field.label}</dt><dd className="break-words text-kumo-subtle">{requirements[field.key] || "미확인"}</dd></div>)}</dl></details>
								<div className="rounded-lg bg-kumo-recessed p-3 text-xs leading-5 text-kumo-default"><p className="font-semibold">검토 차단 항목 · {workspace.missing.length}건</p>{workspace.missing.length ? <ul className="mt-1 list-disc pl-4">{workspace.missing.map((item) => <li key={item.key}>{item.label}: {item.reason}</li>)}</ul> : <p>저장된 요구사항에 누락 항목이 없습니다. 최종 운영 검토는 별도로 필요합니다.</p>}{requirementsDirty && <p className="mt-2">변경사항 저장 시 누락 항목을 다시 계산합니다.</p>}</div>
								{workspace.campaign && <div className="text-xs leading-5 text-kumo-subtle"><p>저장된 초안 ID: <span className="break-all">{workspace.campaign.id}</span></p><p>저장된 초안의 차단 항목: {workspace.campaign.blockers.join(", ") || "없음"}</p></div>}
								<Button size="sm" variant="primary" disabled={pending || !title.trim()} onClick={() => void save("campaign")}>{pending ? "저장 중…" : workspace.campaign ? "같은 캠페인 초안 업데이트" : "캠페인 초안 저장"}</Button>
							</div>}
						</>
					)}
				</div>
			)}
		</section>
	);
}
