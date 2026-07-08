/**
 * Ritual/onboarding videos are streamed from the API server's public object
 * storage endpoint instead of being bundled into the app binary (bundling
 * ~18MB of video assets slowed downloads/updates and forced a full app
 * store resubmission for every video edit).
 */

const VIDEO_FILENAMES = {
  welcomeIntro: "welcome-intro.mp4",
  messageForYou: "message-for-you.mp4",
  intentionIntro: "intention-intro.mp4",
  iamIntro: "iam-intro.mp4",
  gratitudeIntro: "gratitude-intro.mp4",
} as const;

export type VideoName = keyof typeof VIDEO_FILENAMES;

function apiDomain(): string | null {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? domain.replace(/^https?:\/\//, "").replace(/\/+$/, "") : null;
}

/**
 * Returns the streaming URL for a named video, or null if the app has no
 * known API domain to stream from (should not happen outside of
 * misconfigured local dev — callers should treat null the same as an
 * unreachable network).
 */
export function getVideoUrl(name: VideoName): string | null {
  const domain = apiDomain();
  if (!domain) return null;
  return `https://${domain}/api/storage/public-objects/videos/${VIDEO_FILENAMES[name]}`;
}

/**
 * Streaming URLs for every known ritual/onboarding video. Used to
 * opportunistically pre-cache all of them in the background (see
 * `lib/videoCache.ts#precacheVideosOnWifi`) rather than waiting for each to
 * be watched once before it plays instantly.
 */
export function getAllVideoUrls(): string[] {
  return (Object.keys(VIDEO_FILENAMES) as VideoName[])
    .map((name) => getVideoUrl(name))
    .filter((url): url is string => url !== null);
}
