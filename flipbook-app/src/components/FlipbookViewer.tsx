"use client";
import { useEffect, useState } from "react";
import FlipBook from "@/components/FlipBook";

export default function FlipbookViewer() {
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const [inputUrl, setInputUrl] = useState<string>("");
	const [checking, setChecking] = useState<boolean>(false);
	const [inputError, setInputError] = useState<string | null>(null);

	// Optional: support direct linking via ?pdf=
	useEffect(() => {
		try {
			const u = new URL(window.location.href);
			const q = u.searchParams.get("pdf") || undefined;
			if (q) {
				const normalized = q.startsWith("http") || q.startsWith("/") ? q : `/pdfs/${q.replace(/^\/+/, "")}`;
				setSelected(normalized);
			}
		} catch {}
	}, []);

	async function handleUseUrl() {
		const raw = inputUrl.trim();
		if (!raw) return;
		setInputError(null);
    const target = raw;
		// Accept absolute http(s) or same-origin path starting with /
		const isAbsolute = /^https?:\/\//i.test(target);
		if (!isAbsolute && !target.startsWith("/")) {
			setInputError("Enter a full URL (https://...) or a path starting with /pdfs/...");
			return;
		}
		// For same-origin paths, we can trust availability
		if (!isAbsolute) {
			setSelected(target);
			try {
				const u = new URL(window.location.href);
				u.searchParams.set("pdf", encodeURIComponent(target.replace(/^\/+/, "")));
				window.history.replaceState(null, "", u.toString());
			} catch {}
			return;
		}
		// For cross-origin URLs, try a lightweight availability check
		setChecking(true);
		try {
			let ok = false;
			try {
				const head = await fetch(target, { method: "HEAD", cache: "no-store", redirect: "follow", mode: "cors" });
				ok = head.ok;
            } catch {
				// Some servers block HEAD; try small GET range
				try {
					const getResp = await fetch(target, { method: "GET", headers: { Range: "bytes=0-1" }, cache: "no-store", redirect: "follow", mode: "cors" });
					ok = getResp.ok || getResp.status === 206;
                } catch {
					ok = false;
				}
			}
			if (!ok) {
				setInputError("Cannot access URL. It may be 404 or blocked by CORS.");
				return;
			}
			setSelected(target);
			try {
				const u = new URL(window.location.href);
				u.searchParams.set("pdf", encodeURIComponent(target));
				window.history.replaceState(null, "", u.toString());
			} catch {}
		} finally {
			setChecking(false);
		}
	}

	return (
		<div className="grid gap-6">
			<div className="grid gap-3">
				<label className="block text-sm font-medium">Enter a direct URL to a PDF</label>
				<div className="flex gap-2">
					<input
						value={inputUrl}
						onChange={(e) => setInputUrl(e.target.value)}
						placeholder="https://example.com/file.pdf or /pdfs/file.pdf"
						className="flex-1 border rounded px-3 py-2 text-sm"
					/>
					<button onClick={handleUseUrl} disabled={checking} className="border rounded px-3 py-2 text-sm disabled:opacity-50">{checking ? "Checking..." : "Load URL"}</button>
				</div>
				{inputError && <div className="text-sm text-red-600">{inputError}</div>}
			</div>
			<div>
				{selected ? (
					<FlipBook key={selected} pdfUrl={selected} />
				) : (
					<div className="text-sm opacity-80">No PDF selected. Upload or enter a URL.</div>
				)}
			</div>
		</div>
	);
}


