import { logger } from "./logger";

/**
 * Transactional email delivery for invite links, backed by the Replit-managed
 * Resend connector. Credentials are fetched from the connector proxy at runtime
 * (never cached long-term, tokens rotate) and used against the Resend REST API
 * directly so we avoid pulling in the SDK.
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Authentic Steps <onboarding@resend.dev>";

interface ResendConnectionSettings {
  api_key?: string;
  apiKey?: string;
  access_token?: string;
  [key: string]: unknown;
}

let cachedKey: { value: string; expiresAt: number } | null = null;
const KEY_TTL_MS = 5 * 60 * 1000;

function replitToken(): string | null {
  if (process.env.REPL_IDENTITY) {
    return "repl " + process.env.REPL_IDENTITY;
  }
  if (process.env.WEB_REPL_RENEWAL) {
    return "depl " + process.env.WEB_REPL_RENEWAL;
  }
  return null;
}

/**
 * Resolve the Resend API key. Prefers an explicit RESEND_API_KEY secret (set
 * directly by the operator), and otherwise falls back to the Replit-managed
 * Resend connector proxy.
 */
async function getResendApiKey(): Promise<string> {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }

  if (cachedKey && cachedKey.expiresAt > Date.now()) {
    return cachedKey.value;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = replitToken();
  if (!hostname || !token) {
    throw new Error(
      "Resend connector is not available (missing REPLIT_CONNECTORS_HOSTNAME or repl identity). Connect Resend to enable invite emails.",
    );
  }

  const res = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: token,
      },
    },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch Resend connection (${res.status} ${res.statusText}).`,
    );
  }

  const data = (await res.json()) as {
    items?: Array<{ settings?: ResendConnectionSettings }>;
  };
  const settings = data.items?.[0]?.settings;
  const apiKey = settings?.api_key ?? settings?.apiKey ?? settings?.access_token;
  if (!apiKey) {
    throw new Error(
      "Resend connection has no API key. Reconnect Resend to enable invite emails.",
    );
  }

  cachedKey = { value: apiKey, expiresAt: Date.now() + KEY_TTL_MS };
  return apiKey;
}

/** Whether email delivery is configured (either a direct key or the connector). */
export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY) return true;
  return Boolean(process.env.REPLIT_CONNECTORS_HOSTNAME && replitToken());
}

/**
 * Build the public web redeem URL for an invite code. Prefers an explicit
 * DASHBOARD_URL, otherwise derives it from the Replit domain + dashboard base
 * path so links work in both dev and production.
 */
export function buildRedeemUrl(code: string): string {
  const explicit = process.env.DASHBOARD_URL?.replace(/\/$/, "");
  const basePath = (process.env.DASHBOARD_BASE_PATH ?? "/dashboard").replace(
    /\/$/,
    "",
  );
  const base = explicit ?? `${originFromEnv()}${basePath}`;
  return `${base}/redeem?code=${encodeURIComponent(code)}`;
}

/**
 * Build the mobile app entry-point URL for an invite code. The Authentic
 * Steps mobile app's landing/Expo server is mounted at the root of the same
 * domain (unlike the dashboard, which lives under /dashboard), so this only
 * needs the root origin plus the invite code as a query param. The landing
 * page (and, once opened, the app's redeem screen) reads that param.
 */
export function buildMobileAppUrl(code: string): string {
  const explicit = process.env.MOBILE_APP_URL?.replace(/\/$/, "");
  const base = explicit ?? originFromEnv();
  return `${base}/?code=${encodeURIComponent(code)}`;
}

/**
 * Role-aware invite link: members are routed straight into the mobile app
 * (where the product actually lives for them), while agency admins and
 * sub-account holders keep going to the web dashboard, which is their
 * management surface.
 */
export function buildInviteUrl(role: string, code: string): string {
  return role === "member" ? buildMobileAppUrl(code) : buildRedeemUrl(code);
}

function originFromEnv(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  const domain = domains?.[0] ?? process.env.REPLIT_DEV_DOMAIN;
  if (!domain) {
    throw new Error(
      "Cannot build redeem link: no DASHBOARD_URL, REPLIT_DOMAINS, or REPLIT_DEV_DOMAIN set.",
    );
  }
  return `https://${domain}`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ROLE_LABELS: Record<string, string> = {
  agency_admin: "Agency Admin",
  sub_account_holder: "Program Holder",
  member: "Member",
};

export interface SendInviteEmailArgs {
  to: string;
  code: string;
  role: string;
  programName?: string | null;
  inviteExpiresAt?: Date | null;
}

/**
 * Send the invite redeem link to an invitee. Throws on failure so callers can
 * surface send status; never silently swallows delivery errors.
 */
export async function sendInviteEmail(args: SendInviteEmailArgs): Promise<void> {
  const apiKey = await getResendApiKey();
  const from = process.env.INVITE_EMAIL_FROM ?? DEFAULT_FROM;
  const isMember = args.role === "member";
  const redeemUrl = buildInviteUrl(args.role, args.code);
  const roleLabel = ROLE_LABELS[args.role] ?? args.role.replace(/_/g, " ");
  const program = args.programName ? ` for ${args.programName}` : "";
  const expiryLine = args.inviteExpiresAt
    ? `<p style="color:#6b7280;font-size:14px;">This invite expires on ${args.inviteExpiresAt.toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      )}.</p>`
    : "";
  const ctaLabel = isMember ? "Open the app" : "Accept invite";
  const introLine = isMember
    ? "Tap the button below to open the Authentic Steps Youth app and accept your invite."
    : "Tap the button below to accept your invite and get access.";

  const subject = `You've been invited to Authentic Steps`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h1 style="font-size:22px;color:#111827;margin:0 0 12px;">You've been invited</h1>
      <p style="color:#374151;font-size:16px;line-height:1.5;">
        You've been invited to join <strong>Authentic Steps</strong> as a
        <strong>${escapeHtml(roleLabel)}</strong>${escapeHtml(program)}.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.5;">
        ${introLine}
      </p>
      <p style="margin:28px 0;">
        <a href="${redeemUrl}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">
          ${ctaLabel}
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;">
        Or paste this link into your browser:<br />
        <a href="${redeemUrl}" style="color:#4f46e5;word-break:break-all;">${redeemUrl}</a>
      </p>
      ${expiryLine}
    </div>
  `.trim();

  const text = [
    `You've been invited to join Authentic Steps as a ${roleLabel}${program}.`,
    "",
    isMember
      ? "Open the app and accept your invite using this link:"
      : "Accept your invite using this link:",
    redeemUrl,
    args.inviteExpiresAt
      ? `\nThis invite expires on ${args.inviteExpiresAt.toISOString().slice(0, 10)}.`
      : "",
  ].join("\n");

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [args.to], subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.warn(
      { status: res.status, body },
      "Resend rejected invite email send",
    );
    throw new Error(
      `Email delivery failed (${res.status}). ${body.slice(0, 200)}`,
    );
  }
}

export interface FeedbackNotificationArgs {
  issueIdentifier: string;
  issueUrl: string;
  userId: string;
  messagePreview: string;
  platform?: string;
}

/**
 * Best-effort real-time nudge to the team inbox whenever a new beta feedback
 * issue is filed in Linear, so reports don't sit unseen between manual Linear
 * checks. Recipients come from FEEDBACK_NOTIFY_EMAIL (comma-separated). If
 * that's unset, or delivery fails, this logs and returns without throwing —
 * callers should never let a notification failure affect issue filing.
 */
export async function sendFeedbackNotificationEmail(
  args: FeedbackNotificationArgs,
): Promise<void> {
  const recipients = (process.env.FEEDBACK_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    logger.info(
      "FEEDBACK_NOTIFY_EMAIL is not set; skipping feedback notification email",
    );
    return;
  }

  try {
    const apiKey = await getResendApiKey();
    const from = process.env.INVITE_EMAIL_FROM ?? DEFAULT_FROM;
    const subject = `[Beta feedback] New report: ${args.issueIdentifier}`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h1 style="font-size:20px;color:#111827;margin:0 0 12px;">New beta feedback report</h1>
        <p style="color:#374151;font-size:15px;line-height:1.5;">
          <strong>${escapeHtml(args.issueIdentifier)}</strong> was just filed in Linear${
            args.platform ? ` from ${escapeHtml(args.platform)}` : ""
          }.
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.5;white-space:pre-wrap;background:#f9fafb;border-radius:8px;padding:12px;">
          ${escapeHtml(args.messagePreview)}
        </p>
        <p style="margin:24px 0;">
          <a href="${args.issueUrl}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
            View in Linear
          </a>
        </p>
      </div>
    `.trim();
    const text = [
      `New beta feedback report: ${args.issueIdentifier}`,
      args.platform ? `Platform: ${args.platform}` : null,
      "",
      args.messagePreview,
      "",
      args.issueUrl,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: recipients, subject, html, text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn(
        { status: res.status, body, recipients },
        "Resend rejected feedback notification email",
      );
      return;
    }

    logger.info(
      { issueIdentifier: args.issueIdentifier, recipients },
      "Sent feedback notification email",
    );
  } catch (err) {
    logger.warn(
      { err },
      "Failed to send feedback notification email; issue was still filed in Linear",
    );
  }
}
