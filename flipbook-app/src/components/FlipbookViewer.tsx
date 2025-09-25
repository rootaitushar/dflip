"use client";
import { useEffect, useRef, useState } from "react";
import FlipBook from "@/components/FlipBook";

export default function FlipbookViewer() {
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const [inputUrl, setInputUrl] = useState<string>("");
	const prevObjectUrl = useRef<string | null>(null);

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

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (prevObjectUrl.current) {
			URL.revokeObjectURL(prevObjectUrl.current);
			prevObjectUrl.current = null;
		}
		const url = URL.createObjectURL(file);
		prevObjectUrl.current = url;
		setSelected(url);
		try {
			const u = new URL(window.location.href);
			u.searchParams.delete("pdf");
			window.history.replaceState(null, "", u.toString());
		} catch {}
	}

	function handleUseUrl() {
		if (!inputUrl.trim()) return;
		if (prevObjectUrl.current) {
			URL.revokeObjectURL(prevObjectUrl.current);
			prevObjectUrl.current = null;
		}
		setSelected(inputUrl.trim());
	}

	useEffect(() => {
		return () => {
			if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
		};
	}, []);

	return (
		<div className="grid gap-6">
			<div className="grid gap-3">
				<label className="block text-sm font-medium">Upload a PDF</label>
				<input type="file" accept="application/pdf" onChange={handleFile} className="block w-full text-sm" />
				<div className="text-xs opacity-70">Or enter a direct URL to a PDF:</div>
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


