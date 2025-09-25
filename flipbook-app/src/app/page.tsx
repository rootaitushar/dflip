import FlipbookViewer from "@/components/FlipbookViewer";

export default function Home() {
	return (
		<main className="min-h-screen p-4 sm:p-6 md:p-8">
			<h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">PDF Flipbook</h1>
			<div className="mb-4 sm:mb-6 text-xs sm:text-sm opacity-80">Paste a PDF URL below to view it as a flipbook.</div>
			<div className="max-w-6xl mx-auto">
				<FlipbookViewer />
			</div>
		</main>
	);
}
