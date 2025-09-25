const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copy(src, dest) {
	ensureDir(path.dirname(dest));
	fs.copyFileSync(src, dest);
	console.log(`[copy] ${src} -> ${dest}`);
}

try {
	const root = process.cwd();
	const legacySrc = path.join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
	const publicDest = path.join(root, 'public', 'pdf.worker.legacy.min.mjs');
	copy(legacySrc, publicDest);
} catch (e) {
	console.warn('[copy] pdfjs worker copy skipped:', e?.message || e);
}


