/**
 * Smoke test: the critical agency-admin path, end-to-end, against REAL Clerk
 * test sessions.
 *
 * Why this exists (and why it's separate from access-flows.test.ts): the vitest
 * suite mocks `@clerk/express` entirely, so it proves the routes/RBAC logic but
 * NOT that the real auth wiring works. A change to the Clerk middleware, the
 * publishable-key resolution, session-cookie/Bearer handling, or the API
 * contracts could break sign-in for a real admin without any mocked test
 * noticing. This script boots the real app (unmocked Clerk verification) and
 * exercises it with genuine Clerk session tokens minted for throwaway test
 * users, then cleans everything up.
 *
 * What it exercises (the core admin path):
 *   provision admin -> bootstrap agency -> sign in (real session)
 *   -> create sub-account -> issue invite -> invitee signs in -> redeem
 *   -> member appears -> renew -> revoke -> access lost.
 *
 * Run it:
 *   pnpm --filter @workspace/api-server run smoke
 *
 * Requires (already present in this environment): CLERK_SECRET_KEY,
 * CLERK_PUBLISHABLE_KEY (a Clerk *test* instance) and DATABASE_URL. It refuses
 * to run against a live Clerk instance so it never creates real users.
 *
 * Cleanup: the agency it creates is deleted (cascading to its sub-accounts,
 * memberships and invites) and both throwaway Clerk users are deleted in a
 * finally block, even if a step fails.
 */
import { execFileSync } from "node:child_process";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { and, eq, isNull } from "drizzle-orm";
import { db, agenciesTable, membershipsTable, pool } from "@workspace/db";
import app from "../app";

const SK = process.env.CLERK_SECRET_KEY;
const PK = process.env.CLERK_PUBLISHABLE_KEY;

if (!SK || !PK) {
  console.error(
    "Missing CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY — cannot mint real Clerk sessions.",
  );
  process.exit(1);
}
if (PK.startsWith("pk_live") || SK.startsWith("sk_live")) {
  console.error(
    "Refusing to run the smoke test against a LIVE Clerk instance — it would create real users.",
  );
  process.exit(1);
}

const BACKEND_API = "https://api.clerk.com/v1";
const FRONTEND_API =
  "https://" +
  Buffer.from(PK.replace(/^pk_(test|live)_/, ""), "base64")
    .toString("utf8")
    .replace(/\$$/, "");

const backendHeaders = {
  Authorization: `Bearer ${SK}`,
  "Content-Type": "application/json",
};

interface TestUser {
  id: string;
  email: string;
}
interface ApiRes {
  status: number;
  body: any;
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function clerkBackend(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<any> {
  const res = await fetch(`${BACKEND_API}${path}`, {
    method,
    headers: backendHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(
      `Clerk Backend ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  return json;
}

async function createTestUser(tag: string): Promise<TestUser> {
  // The `+clerk_test` local-part marks this as a Clerk test email, so no real
  // email is ever sent. The extra entropy keeps repeated runs from colliding.
  const nonce = `${Date.now()}${Math.floor(Math.random() * 1e5)}`;
  const email = `smoke_${tag}_${nonce}+clerk_test@example.com`;
  const user = await clerkBackend("/users", "POST", {
    email_address: [email],
    password: `Sm0ke-${nonce}-${Math.random().toString(36).slice(2)}!Aa`,
    skip_password_checks: true,
  });
  return {
    id: user.id,
    email: user.email_addresses?.[0]?.email_address ?? email,
  };
}

async function deleteTestUser(id: string): Promise<void> {
  await clerkBackend(`/users/${id}`, "DELETE");
}

/**
 * Mints a genuine, verifiable Clerk session token for a user with no browser:
 * backend sign-in token -> dev-browser handshake -> ticket sign-in ->
 * session token. This is the same token a signed-in dashboard user would send.
 */
async function mintSession(userId: string): Promise<string> {
  const signInToken = await clerkBackend("/sign_in_tokens", "POST", {
    user_id: userId,
  });

  const devBrowserRes = await fetch(`${FRONTEND_API}/v1/dev_browser`, {
    method: "POST",
  });
  const devBrowser = (await devBrowserRes.json()) as any;
  const dbJwt = devBrowser?.token ?? devBrowser?.id;
  assert(dbJwt, `dev_browser handshake failed: ${JSON.stringify(devBrowser)}`);

  const qs = `__clerk_db_jwt=${dbJwt}&_clerk_js_version=5.0.0`;
  const signInRes = await fetch(`${FRONTEND_API}/v1/client/sign_ins?${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `strategy=ticket&ticket=${signInToken.token}`,
  });
  const cookie = signInRes.headers.get("set-cookie");
  const signIn = (await signInRes.json()) as any;
  const sessionId = signIn?.response?.created_session_id;
  assert(
    sessionId,
    `ticket sign-in did not create a session: ${JSON.stringify(signIn).slice(0, 300)}`,
  );

  const tokenRes = await fetch(
    `${FRONTEND_API}/v1/client/sessions/${sessionId}/tokens?${qs}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    },
  );
  const token = (await tokenRes.json()) as any;
  assert(token?.jwt, `could not mint session token: ${JSON.stringify(token)}`);
  return token.jwt;
}

// Session tokens are short-lived; cache and re-mint when stale or rejected so a
// slow step can't spuriously fail the run.
const tokenCache = new Map<string, { jwt: string; ts: number }>();
async function sessionFor(userId: string): Promise<string> {
  const cached = tokenCache.get(userId);
  if (cached && Date.now() - cached.ts < 40_000) return cached.jwt;
  const jwt = await mintSession(userId);
  tokenCache.set(userId, { jwt, ts: Date.now() });
  return jwt;
}

let baseUrl = "";
async function rawApi(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiRes> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function apiAs(
  userId: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiRes> {
  let res = await rawApi(await sessionFor(userId), method, path, body);
  if (res.status === 401) {
    tokenCache.delete(userId);
    res = await rawApi(await sessionFor(userId), method, path, body);
  }
  return res;
}

let stepNum = 0;
async function step<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  stepNum += 1;
  const label = `Step ${stepNum}: ${name}`;
  try {
    const value = await fn();
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    return value;
  } catch (err) {
    console.error(`  \x1b[31m✗ ${label}\x1b[0m`);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`FAILED at "${label}": ${message}`);
  }
}

async function main(): Promise<void> {
  let server: Server | undefined;
  let adminId = "";
  let inviteeId = "";
  let agencyId = "";

  console.log(
    "Running agency-admin smoke test against real Clerk sessions...\n",
  );

  try {
    server = app.listen(0);
    await new Promise<void>((resolve) => server!.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

    const admin = await step("Provision throwaway admin Clerk user", () =>
      createTestUser("admin"),
    );
    adminId = admin.id;

    const invitee = await step("Provision throwaway invitee Clerk user", () =>
      createTestUser("invitee"),
    );
    inviteeId = invitee.id;

    const agencyName = `Smoke Test Agency ${Date.now()}`;
    await step("Bootstrap agency + admin via bootstrap-agency script", () => {
      execFileSync(
        "pnpm",
        [
          "--filter",
          "@workspace/scripts",
          "run",
          "bootstrap-agency",
          agencyName,
          admin.email,
        ],
        { stdio: "pipe" },
      );
    });

    agencyId = await step(
      "Confirm agency-admin membership landed in the DB",
      async () => {
        const rows = await db
          .select()
          .from(membershipsTable)
          .innerJoin(
            agenciesTable,
            eq(membershipsTable.agencyId, agenciesTable.id),
          )
          .where(
            and(
              eq(membershipsTable.userId, adminId),
              eq(membershipsTable.role, "agency_admin"),
              eq(membershipsTable.status, "active"),
              isNull(membershipsTable.subAccountId),
              eq(agenciesTable.name, agencyName),
            ),
          )
          .limit(1);
        assert(rows[0], "bootstrap did not create an agency-admin membership");
        return rows[0].agencies.id;
      },
    );

    await step("Admin signs in and is entitled as agency_admin", async () => {
      const res = await apiAs(adminId, "GET", "/me/entitlement");
      assert(
        res.status === 200,
        `expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
      );
      assert(
        res.body?.active === true && res.body?.role === "agency_admin",
        `unexpected entitlement: ${JSON.stringify(res.body)}`,
      );
    });

    const subAccountId = await step("Admin creates a sub-account", async () => {
      const res = await apiAs(adminId, "POST", "/sub-accounts", {
        name: `Smoke Clinic ${Date.now()}`,
      });
      assert(
        res.status === 201,
        `expected 201, got ${res.status}: ${JSON.stringify(res.body)}`,
      );
      return res.body.id as string;
    });

    const inviteCode = await step(
      "Admin issues a member invite (1-year window)",
      async () => {
        const res = await apiAs(adminId, "POST", "/invites", {
          subAccountId,
          role: "member",
          accessDurationDays: 365,
        });
        assert(
          res.status === 201,
          `expected 201, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
        assert(
          typeof res.body?.code === "string",
          `invite has no shareable code: ${JSON.stringify(res.body)}`,
        );
        return res.body.code as string;
      },
    );

    const memberId = await step(
      "Invitee signs in and redeems the invite",
      async () => {
        const res = await apiAs(inviteeId, "POST", "/invites/redeem", {
          code: inviteCode,
        });
        assert(
          res.status === 201,
          `expected 201, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
        assert(
          res.body?.status === "active" && res.body?.role === "member",
          `unexpected redeem result: ${JSON.stringify(res.body)}`,
        );
        return res.body.id as string;
      },
    );

    await step("Redeemed member is visible to the admin", async () => {
      const res = await apiAs(adminId, "GET", "/members");
      assert(
        res.status === 200,
        `expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
      );
      assert(
        Array.isArray(res.body) &&
          res.body.some((m: any) => m.id === memberId),
        "redeemed member did not appear in the admin member list",
      );
    });

    await step("Admin renews the member's access", async () => {
      const res = await apiAs(adminId, "POST", `/members/${memberId}/renew`, {
        accessDurationDays: 30,
      });
      assert(
        res.status === 200,
        `expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
      );
    });

    await step("Admin revokes the member", async () => {
      const res = await apiAs(adminId, "POST", `/members/${memberId}/revoke`, {});
      assert(
        res.status === 200 && res.body?.status === "revoked",
        `expected revoked, got ${res.status}: ${JSON.stringify(res.body)}`,
      );
    });

    await step("Revoked member has lost entitlement", async () => {
      const res = await apiAs(inviteeId, "GET", "/me/entitlement");
      assert(
        res.status === 200,
        `expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
      );
      assert(
        res.body?.active === false && res.body?.reason === "revoked",
        `expected inactive/revoked, got ${JSON.stringify(res.body)}`,
      );
    });

    console.log(
      "\n\x1b[32m✅ Smoke test passed\x1b[0m — sign-in, sub-account, invite, redeem, and member management all work against real Clerk sessions.",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n\x1b[31m❌ Smoke test FAILED\x1b[0m\n${message}`);
    process.exitCode = 1;
  } finally {
    // Clean up regardless of outcome. Deleting the agency cascades to its
    // sub-accounts, memberships and invites.
    if (agencyId) {
      await db
        .delete(agenciesTable)
        .where(eq(agenciesTable.id, agencyId))
        .catch((e) => console.error("cleanup: failed to delete agency:", e));
    }
    for (const id of [adminId, inviteeId].filter(Boolean)) {
      await deleteTestUser(id).catch((e) =>
        console.error(`cleanup: failed to delete Clerk user ${id}:`, e),
      );
    }
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    await pool.end().catch(() => {});
  }
}

main();
