/**
 * check-metadata-sync
 *
 * Compares store-assets/app-store-metadata.md (base, en) with
 * store-assets/app-store-metadata-en-AU.md and warns when the base
 * has grown significantly relative to the AU file.
 *
 * The en-AU file is expected to always be LARGER than the base, because
 * it contains extra locale-specific sections (Localisation notes, keyword
 * rationale, spelling change tables, etc.). If the base word count
 * approaches or exceeds the AU word count, content was almost certainly
 * added to the base without a matching update to en-AU.
 *
 * Additionally, any headings present in the base but absent from en-AU
 * (after normalising locale suffixes) are listed as a reminder to add
 * them.
 *
 * Exit 0 — files look in sync.
 * Exit 1 — base has grown relative to en-AU beyond the safe margin, or
 *            a base-only section was found.
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";

const __dirname = dirname(new URL(import.meta.url).pathname);
const repoRoot = resolve(__dirname, "../..");
const basePath = resolve(repoRoot, "store-assets/app-store-metadata.md");
const auPath = resolve(repoRoot, "store-assets/app-store-metadata-en-AU.md");

function wordCount(text: string): number {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[^a-zA-Z0-9'\-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function extractHeadings(text: string): Set<string> {
  const result = new Set<string>();
  for (const line of text.split("\n")) {
    const m = /^#{1,3} (.+)$/.exec(line);
    if (m) {
      const normalised = m[1]
        .replace(/\s*[—–-]\s*(en-AU|locale:.*)\s*$/i, "")
        .replace(/\s*\(en-AU\)\s*$/i, "")
        .trim()
        .toLowerCase();
      result.add(normalised);
    }
  }
  return result;
}

let base: string;
let au: string;
try {
  base = readFileSync(basePath, "utf8");
} catch {
  console.error(`ERROR: Could not read base file: ${basePath}`);
  process.exit(1);
}
try {
  au = readFileSync(auPath, "utf8");
} catch {
  console.error(`ERROR: Could not read en-AU file: ${auPath}`);
  process.exit(1);
}

const baseWords = wordCount(base);
const auWords = wordCount(au);
const margin = auWords - baseWords;

const baseHeadings = extractHeadings(base);
const auHeadings = extractHeadings(au);
const baseOnlyHeadings = [...baseHeadings].filter((h) => !auHeadings.has(h));

console.log("=== store-assets metadata sync check ===\n");
console.log(
  `Base (en):   ${baseWords} words  [store-assets/app-store-metadata.md]`
);
console.log(
  `AU (en-AU):  ${auWords} words  [store-assets/app-store-metadata-en-AU.md]`
);

let hasIssue = false;

if (margin >= 0) {
  console.log(
    `Margin:      en-AU is ${margin} words larger than base ✓\n` +
      `             (expected: en-AU contains extra locale-specific sections)\n`
  );
} else {
  console.log(
    `Margin:      ⚠  base is ${Math.abs(margin)} words LARGER than en-AU!\n` +
      `             en-AU should always be larger. Content was likely added to\n` +
      `             the base without a matching update to the AU localisation.\n`
  );
  hasIssue = true;
}

if (baseOnlyHeadings.length > 0) {
  console.log(
    `Sections in base not found in en-AU (${baseOnlyHeadings.length}):`
  );
  for (const h of baseOnlyHeadings) {
    console.log(`  + "${h}"`);
  }
  console.log(
    `\n  ⚠  These sections may need to be added to app-store-metadata-en-AU.md.\n` +
      `     (If they are intentionally base-only, this warning can be ignored.)\n`
  );
  hasIssue = true;
}

if (!hasIssue) {
  console.log(
    `✓ No sync issues detected. If you have updated the base file, verify that\n` +
      `  any new or changed content is reflected in app-store-metadata-en-AU.md.\n`
  );
}

process.exit(hasIssue ? 1 : 0);
