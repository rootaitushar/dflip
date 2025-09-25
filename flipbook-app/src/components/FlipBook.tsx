"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy, GlobalWorkerOptions as GlobalWorkerOptionsType } from "pdfjs-dist/legacy/build/pdf";
import Image from "next/image";
import HTMLFlipBook from "react-pageflip";

type FlipBookProps = {
	pdfUrl: string;
};

export default function FlipBook({ pdfUrl }: FlipBookProps) {
	const [pages, setPages] = useState<string[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [bookSize, setBookSize] = useState<{ width: number; height: number }>({ width: 360, height: 512 });
	const bookRef = useRef<any>(null);
	const [currentPage, setCurrentPage] = useState<number>(0);

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
				const renderedPages: string[] = [];
				for (let i = 1; i <= pdf.numPages; i++) {
					const page: PDFPageProxy = await pdf.getPage(i);
					const scale = 2;
					const targetWidth = bookSize.width;
					const viewport = page.getViewport({ scale: scale * (targetWidth / page.view[2]) });
					const canvas = document.createElement("canvas");
					const context = canvas.getContext("2d");
					if (!context) continue;
					canvas.width = viewport.width as number;
					canvas.height = viewport.height as number;
					await page.render({ canvasContext: context, viewport }).promise;
					renderedPages.push(canvas.toDataURL("image/jpeg", 0.92));
				}
				if (!cancelled) {
					setPages(renderedPages);
					setCurrentPage(0);
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

	if (loading) return <div className="w-full text-center py-8">Loading PDF…</div>;
	if (error) return <div className="w-full text-center py-8 text-red-600">{error}</div>;
	if (pages.length === 0) return <div className="w-full text-center py-8">No pages found.</div>;

	function goPrev() {
		bookRef.current?.pageFlip()?.flipPrev();
	}
	function goNext() {
		bookRef.current?.pageFlip()?.flipNext();
	}
	function goTo(indexZeroBased: number) {
		const safe = Math.max(0, Math.min(indexZeroBased, pages.length - 1));
		bookRef.current?.pageFlip()?.turnToPage(safe);
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
					onFlip={(e: any) => {
						if (typeof e?.data === "number") setCurrentPage(e.data);
					}}
				>
					{pages.map((src, i) => (
						<div key={i} className="bg-white">
							<img src={src} alt={`Page ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
						</div>
					))}
				</HTMLFlipBook>
			</div>
		</div>
	);
}


