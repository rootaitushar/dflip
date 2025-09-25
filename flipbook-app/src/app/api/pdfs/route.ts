import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
	try {
		const publicDir = path.join(process.cwd(), "public", "pdfs");
		if (!fs.existsSync(publicDir)) {
			return NextResponse.json({ pdfs: [] });
		}
		const entries = await fs.promises.readdir(publicDir, { withFileTypes: true });
		const pdfs = entries
			.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"))
			.map((e) => ({ name: e.name, url: `/pdfs/${e.name}` }));
		return NextResponse.json({ pdfs });
	} catch (error) {
		return NextResponse.json({ pdfs: [], error: "Failed to list PDFs" }, { status: 500 });
	}
}


