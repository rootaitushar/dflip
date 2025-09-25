"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/legacy/build/pdf";
import HTMLFlipBook from "react-pageflip";

type FlipBookProps = {
	pdfUrl: string;
};

export default function FlipBook({ pdfUrl }: FlipBookProps) {
	const [pages, setPages] = useState<(string | null)[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [bookSize, setBookSize] = useState<{ width: number; height: number }>({ width: 360, height: 512 });
type PageFlipInstance = { flipPrev: () => void; flipNext: () => void; turnToPage: (index: number) => void };
type FlipBookHandle = { pageFlip: () => PageFlipInstance };
const bookRef = useRef<FlipBookHandle | null>(null);
	const [currentPage, setCurrentPage] = useState<number>(0);
	const pdfRef = useRef<PDFDocumentProxy | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;
		const container = containerRef.current;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const cw = Math.max(280, Math.min(entry.contentRect.width, 900));
				const pageWidth = Math.floor(cw / 2);
				const pageHeight = Math.floor(pageWidth * 1.414);
				setBookSize({ width: pageWidth, height: pageHeight });
			}
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setLoading(true);
			setError(null);
			setPages([]);
			abortRef.current?.abort();
			abortRef.current = new AbortController();
			try {
				const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
				(pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = "/pdf.worker.legacy.min.mjs";
				// Add cache-busting for http/https/file paths, but NOT for blob: URLs
				let fetchUrl = pdfUrl;
				if (!pdfUrl.startsWith("blob:")) {
					const bust = Date.now();
					fetchUrl = `${pdfUrl}${pdfUrl.includes("?") ? "&" : "?"}v=${bust}`;
				}
				const pdf: PDFDocumentProxy = await (pdfjs as unknown as { getDocument: (src: string) => { promise: Promise<PDFDocumentProxy> } }).getDocument(fetchUrl).promise;
				pdfRef.current = pdf;
				if (cancelled) return;
				setPages(Array.from({ length: pdf.numPages }, () => null));
				setCurrentPage(0);
				// Eager render first few pages (fast, lower scale on small screens)
				const initialCount = Math.min(4, pdf.numPages);
				for (let i = 1; i <= initialCount; i++) {
					await renderAndStorePage(i);
					if (cancelled) return;
				}
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to render PDF");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [pdfUrl, bookSize.width]);

	// Render helper with adaptive scale and idle scheduling
	async function renderAndStorePage(pageNumber: number, priority: boolean = false) {
		const pdf = pdfRef.current;
		if (!pdf) return;
		if (pages[pageNumber - 1]) return; // already rendered
		// Adaptive scale: smaller on mobile to speed up
		const isNarrow = bookSize.width < 360;
		const baseScale = isNarrow ? 1.2 : 1.6;
		const page: PDFPageProxy = await pdf.getPage(pageNumber);
		const targetWidth = bookSize.width;
		const viewport = page.getViewport({ scale: baseScale * (targetWidth / page.view[2]) });
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (!context) return;
		canvas.width = viewport.width as number;
		canvas.height = viewport.height as number;
		await page.render({ canvasContext: context, viewport }).promise;
		const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
		setPages((prev) => {
			const next = prev.slice();
			next[pageNumber - 1] = dataUrl;
			return next;
		});
	}

	// When page flips, pre-render neighbors around the current page lazily
	useEffect(() => {
		if (!pdfRef.current || pages.length === 0) return;
		const neighbors: number[] = [];
		for (let d = -2; d <= 3; d++) {
			const p = currentPage + 1 + d; // pages are 1-based in pdf.js
			if (p >= 1 && p <= pages.length) neighbors.push(p);
		}
		(async () => {
			for (const p of neighbors) {
				if (!pages[p - 1]) {
					await renderAndStorePage(p);
				}
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, bookSize.width]);

	if (loading) return <div className="w-full text-center py-8">Loading PDF…</div>;
	if (error) return <div className="w-full text-center py-8 text-red-600">{error}</div>;
	if (pages.length === 0) return <div className="w-full text-center py-8">No pages found.</div>;

	function goPrev() {
		bookRef.current?.pageFlip()?.flipPrev();
	}
	function goNext() {
		bookRef.current?.pageFlip()?.flipNext();
	}


	return (
		<div ref={containerRef} className="w-full mx-auto">
			<div className="flex items-center justify-between gap-3 mb-3 px-1">
				<button onClick={goPrev} className="border rounded px-3 py-1 text-sm">Prev</button>
				<div className="text-sm">
					Page {Math.min(currentPage + 1, pages.length)} / {pages.length}
				</div>
				<button onClick={goNext} className="border rounded px-3 py-1 text-sm">Next</button>
			</div>
			<div style={{ width: bookSize.width * 2 }} className="mx-auto overflow-hidden">
				<HTMLFlipBook
					ref={bookRef}
					key={pdfUrl}
					width={bookSize.width}
					height={bookSize.height}
					showCover={true}
					maxShadowOpacity={0.5}
					mobileScrollSupport={true}
					usePortrait={true}
                onFlip={(e: { data: number }) => {
                    if (typeof e?.data === "number") setCurrentPage(e.data);
					}}
				>
					{pages.map((src, i) => (
						<div key={i} className="bg-white">
							{src ? (
								<img src={src} alt={`Page ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
							) : (
								<div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Rendering…</div>
							)}
						</div>
					))}
				</HTMLFlipBook>
			</div>
		</div>
	);
}


