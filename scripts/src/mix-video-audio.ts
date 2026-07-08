/**
 * Mix a generated soundtrack (and optional voiceover) into a silent/visual-only
 * ritual video, then optionally upload the result to the app's public Object
 * Storage bucket under `public/videos/<name>.mp4`.
 *
 * This exists because the 5 ritual/onboarding videos' soundtracks were
 * originally mixed ad hoc with ffmpeg and the source audio files were
 * discarded after upload — there was no repeatable recipe. See
 * "Regenerating a video's soundtrack" in replit.md for the full process
 * (which media-generation prompts to use, when to include a voiceover, etc).
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run mix-video-audio -- \
 *     --name welcome-intro \
 *     --video /path/to/silent-visual.mp4 \
 *     --music /path/to/ambient-music.mp3 \
 *     [--voiceover /path/to/voiceover.mp3] \
 *     [--music-volume 0.35] \
 *     [--voiceover-volume 1.0] \
 *     [--out /tmp/welcome-intro-mixed.mp4] \
 *     [--upload]
 *
 * --name must be one of the VIDEO_FILENAMES keys in
 * artifacts/authentic-steps/lib/videoSource.ts (minus the .mp4 extension is
 * added automatically) so the mobile app picks up the new file at the same
 * streaming URL.
 */
import { spawnSync } from "child_process";
import { existsSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { Storage } from "@google-cloud/storage";

interface Args {
  name: string;
  video: string;
  music: string;
  voiceover?: string;
  musicVolume: number;
  voiceoverVolume: number;
  out: string;
  upload: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const has = (flag: string): boolean => argv.includes(flag);

  const name = get("--name");
  const video = get("--video");
  const music = get("--music");
  if (!name || !video || !music) {
    console.error(
      "Usage: mix-video-audio --name <video-name> --video <silent.mp4> --music <music.mp3> " +
        "[--voiceover <voiceover.mp3>] [--music-volume 0.35] [--voiceover-volume 1.0] " +
        "[--out <output.mp4>] [--upload]"
    );
    process.exit(1);
  }
  for (const [label, file] of [
    ["--video", video],
    ["--music", music],
  ] as const) {
    if (!existsSync(file)) {
      console.error(`${label} file not found: ${file}`);
      process.exit(1);
    }
  }
  const voiceover = get("--voiceover");
  if (voiceover && !existsSync(voiceover)) {
    console.error(`--voiceover file not found: ${voiceover}`);
    process.exit(1);
  }

  return {
    name,
    video,
    music,
    voiceover,
    musicVolume: Number(get("--music-volume") ?? "0.35"),
    voiceoverVolume: Number(get("--voiceover-volume") ?? "1.0"),
    out: get("--out") ?? path.join(mkdtempSync(path.join(tmpdir(), "mix-video-")), `${name}.mp4`),
    upload: has("--upload"),
  };
}

/**
 * Builds the ffmpeg filter graph:
 *  - Loops/trims the music bed to the video's duration (`-shortest` on output).
 *  - If a voiceover is provided, mixes it over the music bed (music ducked to
 *    `musicVolume`, voiceover at `voiceoverVolume`) via amix; otherwise the
 *    music bed alone becomes the audio track.
 *  - Copies the video stream untouched (no re-encode) and encodes AAC audio.
 */
function runFfmpeg(args: Args): void {
  const inputs = ["-i", args.video, "-stream_loop", "-1", "-i", args.music];
  let filterComplex: string;
  let audioMapLabel: string;

  if (args.voiceover) {
    inputs.push("-i", args.voiceover);
    filterComplex =
      `[1:a]volume=${args.musicVolume}[music];` +
      `[2:a]volume=${args.voiceoverVolume}[voice];` +
      `[music][voice]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
    audioMapLabel = "[aout]";
  } else {
    filterComplex = `[1:a]volume=${args.musicVolume}[aout]`;
    audioMapLabel = "[aout]";
  }

  const ffmpegArgs = [
    "-y",
    ...inputs,
    "-filter_complex",
    filterComplex,
    "-map",
    "0:v:0",
    "-map",
    audioMapLabel,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    args.out,
  ];

  console.log(`Running: ffmpeg ${ffmpegArgs.join(" ")}`);
  const result = spawnSync("ffmpeg", ffmpegArgs, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error("ffmpeg failed");
    process.exit(result.status ?? 1);
  }
  console.log(`Mixed video written to: ${args.out}`);
}

/**
 * Uploads the mixed file to the same bucket/prefix the API server serves
 * public objects from (PUBLIC_OBJECT_SEARCH_PATHS), at `public/videos/<name>.mp4`.
 * Reuses the sidecar `external_account` credential pattern from
 * artifacts/api-server/src/lib/objectStorage.ts since scripts run outside
 * that package.
 */
async function upload(name: string, filePath: string): Promise<void> {
  const searchPaths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (searchPaths.length === 0) {
    console.error(
      "PUBLIC_OBJECT_SEARCH_PATHS is not set — cannot determine which bucket/prefix to upload to."
    );
    process.exit(1);
  }
  const [firstPath] = searchPaths;
  const [, bucketName, ...prefixParts] = firstPath.split("/");
  const prefix = prefixParts.join("/");
  const destination = path.posix.join(prefix, "videos", `${name}.mp4`);

  const storage = new Storage({
    credentials: {
      audience: "replit",
      subject_token_type: "access_token",
      token_url: "http://127.0.0.1:1106/token",
      type: "external_account",
      credential_source: {
        url: "http://127.0.0.1:1106/credential",
        format: { type: "json", subject_token_field_name: "access_token" },
      },
      universe_domain: "googleapis.com",
    },
    projectId: "",
  });

  console.log(`Uploading ${filePath} to gs://${bucketName}/${destination}`);
  await storage.bucket(bucketName).upload(filePath, {
    destination,
    metadata: { contentType: "video/mp4" },
  });
  console.log(
    `Uploaded. It will now be served at GET /api/storage/public-objects/videos/${name}.mp4`
  );
}

async function main(): Promise<void> {
  const args = parseArgs();
  runFfmpeg(args);
  if (args.upload) {
    await upload(args.name, args.out);
  } else {
    console.log("Skipping upload (pass --upload to publish to Object Storage).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
