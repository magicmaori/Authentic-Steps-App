import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");

const manifestPath = join(root, "artifacts/pitch-deck/src/data/slides-manifest.json");
const recordPath = join(root, "artifacts/pitch-deck/src/data/export-record.json");

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const fingerprint = JSON.stringify(manifest);
const exportedAt = new Date().toISOString();

const fmt = (process.argv[2] ?? "both").toLowerCase();
if (!["pdf", "pptx", "both"].includes(fmt)) {
  console.error(`Usage: pnpm --filter @workspace/scripts run sync-export-record [pdf|pptx|both]`);
  process.exit(1);
}

const existing = JSON.parse(readFileSync(recordPath, "utf-8")) as {
  pdf: { fingerprint: string; exportedAt: string } | null;
  pptx: { fingerprint: string; exportedAt: string } | null;
};

if (fmt === "pdf" || fmt === "both") {
  existing.pdf = { fingerprint, exportedAt };
}
if (fmt === "pptx" || fmt === "both") {
  existing.pptx = { fingerprint, exportedAt };
}

writeFileSync(recordPath, JSON.stringify(existing, null, 2) + "\n");
console.log(`export-record.json updated for: ${fmt}`);
console.log(`exportedAt: ${exportedAt}`);
