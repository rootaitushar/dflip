"use client";
import { useEffect, useState } from "react";
import FlipBook from "@/components/FlipBook";

export default function FlipbookViewer() {
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const [inputUrl, setInputUrl] = useState<string>("");

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

	function handleUseUrl() {
		if (!inputUrl.trim()) return;
		setSelected(inputUrl.trim());
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
					<button onClick={handleUseUrl} className="border rounded px-3 py-2 text-sm">Load URL</button>
				</div>
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


