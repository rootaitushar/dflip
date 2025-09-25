import FlipbookViewer from "@/components/FlipbookViewer";

export default function Home() {
	return (
		<main className="min-h-screen p-8">
			<h1 className="text-2xl font-semibold mb-6">PDF Flipbook</h1>
			<div className="mb-6 text-sm opacity-80">Drop PDFs into <code>public/pdfs</code> and refresh.</div>
			<FlipbookViewer />
		</main>
	);
}
