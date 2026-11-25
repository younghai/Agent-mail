import { useEffect } from "react";
import ComposePanel from "~/components/ComposePanel";
import { useUIStore } from "~/hooks/useUIStore";

/**
 * The composer on views that have no split pane for it: settings, admin
 * pages, Inbox Zero. Where a view renders ComposePanel inline, pass `hidden`.
 */
export default function ComposeDialog({ hidden = false }: { hidden?: boolean }) {
	const isComposing = useUIStore((state) => state.isComposing);
	const closeCompose = useUIStore((state) => state.closeCompose);
	const open = isComposing && !hidden;

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeCompose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, closeCompose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 md:p-10"
			role="dialog"
			aria-modal="true"
			aria-label="메일 작성"
			onClick={(event) => {
				if (event.target === event.currentTarget) closeCompose();
			}}
		>
			<div className="h-full max-h-[760px] w-full max-w-3xl overflow-hidden rounded-xl border border-kumo-line bg-kumo-base shadow-xl">
				<ComposePanel />
			</div>
		</div>
	);
}
