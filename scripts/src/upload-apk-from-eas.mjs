/**
 * upload-apk-from-eas.mjs
 *
 * Fetches the latest finished Android APK build from EAS for the
 * authentic-steps app and uploads it to Object Storage so the
 * production download link works.
 *
 * Usage (from workspace root):
 *   node scripts/src/upload-apk-from-eas.mjs
 *
 * Requires:
 *   - EXPO_TOKEN set in environment
 *   - PUBLIC_OBJECT_SEARCH_PATHS set (e.g. /my-bucket/public)
 *
 * The file is uploaded as builds/authentic-steps-<version>-build<code>.apk
 * and is immediately reachable via:
 *   GET /api/storage/public-objects/builds/authentic-steps-<version>-build<code>.apk
 */

import { createWriteStream, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Storage } from "@google-cloud/storage";

const SIDECAR = "http://127.0.0.1:1106";
const EAS_API = "https://api.expo.dev/graphql";
const PROJECT_ID = "3bbd004e-d0f9-404d-bc18-c7d378e3eae1";

const token = process.env.EXPO_TOKEN;
if (!token) {
  console.error("EXPO_TOKEN not set");
  process.exit(1);
}

const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
if (!pathsStr) {
  console.error("PUBLIC_OBJECT_SEARCH_PATHS not set");
  process.exit(1);
}
const firstPath = pathsStr.split(",")[0].trim();
const bucketName = firstPath.split("/")[1];
const prefix = firstPath.split("/").slice(2).join("/");

// ── 1. Find latest finished Android APK build ─────────────────────────────

// The build ID we're waiting for — the one with EXPO_PUBLIC_CLERK_PROXY_URL set
const TARGET_BUILD_ID = "210bfc6f-e886-43c2-abe4-2290a665d154";

const query = `
  query GetBuilds($appId: String!) {
    app {
      byId(appId: $appId) {
        builds(platform: ANDROID, limit: 5, offset: 0) {
          id
          status
          artifacts {
            buildUrl
          }
          appVersion
          appBuildVersion
          completedAt
        }
      }
    }
  }
`;

const gqlRes = await fetch(EAS_API, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ query, variables: { appId: PROJECT_ID } }),
});
const gqlData = await gqlRes.json();
const builds = gqlData?.data?.app?.byId?.builds ?? [];

// Only use the targeted build (the one with the proxy URL fix)
const target = builds.find((b) => b.id === TARGET_BUILD_ID);

if (!target) {
  console.error(`Target build ${TARGET_BUILD_ID} not found in recent builds.`);
  process.exit(1);
}

if (target.status !== "FINISHED" || !target.artifacts?.buildUrl) {
  console.log(
    `Build ${TARGET_BUILD_ID} is not finished yet. Status: ${target.status}`
  );
  console.log("Wait for the EAS build to complete, then re-run this script.");
  console.log(
    `Track at: https://expo.dev/accounts/authentic-steps-for-youthapp/projects/authentic-steps-app/builds/${TARGET_BUILD_ID}`
  );
  process.exit(0);
}

const finished = target;

const { buildUrl, appVersion, appBuildVersion } = finished;
const filename = `authentic-steps-${appVersion}-build${appBuildVersion}.apk`;
console.log(`Found build: ${filename}`);
console.log(`  Download URL: ${buildUrl}`);

// ── 2. Download APK to a temp file ────────────────────────────────────────

const tmpPath = join(tmpdir(), filename);
console.log(`Downloading to ${tmpPath} ...`);

const dlRes = await fetch(buildUrl);
if (!dlRes.ok || !dlRes.body) {
  console.error(`Download failed: ${dlRes.status} ${dlRes.statusText}`);
  process.exit(1);
}

await pipeline(dlRes.body, createWriteStream(tmpPath));
console.log("Download complete.");

// ── 3. Upload to Object Storage ───────────────────────────────────────────

const gcsClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const destination = prefix ? `${prefix}/builds/${filename}` : `builds/${filename}`;
console.log(`Uploading to gs://${bucketName}/${destination} ...`);

await gcsClient.bucket(bucketName).upload(tmpPath, {
  destination,
  metadata: { contentType: "application/vnd.android.package-archive" },
});

console.log("Upload complete.");
console.log(`\nDownload link (share with testers):`);
console.log(
  `  https://authentic-steps-youth.replit.app/api/storage/public-objects/builds/${filename}`
);

// ── 4. Cleanup ────────────────────────────────────────────────────────────
try {
  unlinkSync(tmpPath);
} catch {
  // best-effort cleanup
}
