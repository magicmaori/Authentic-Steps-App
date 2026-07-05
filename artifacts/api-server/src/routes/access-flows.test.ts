import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Mutable auth state so each request can act as a different Clerk user.
const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock("@clerk/express", () => ({
  // Prefer a per-request header so concurrent requests can each act as a
  // distinct user; fall back to the shared authState for the serial `call`
  // helper. The shared variable can't express concurrency because every
  // in-flight request would observe whatever value was set last.
  getAuth: (req: any) => {
    const header = req?.headers?.["x-test-user"];
    return { userId: header != null ? String(header) : authState.userId };
  },
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  clerkClient: {
    users: {
      getUser: async (id: string) => ({
        primaryEmailAddress: { emailAddress: `${id}@example.com` },
        emailAddresses: [{ emailAddress: `${id}@example.com` }],
      }),
    },
  },
}));

const { default: app } = await import("../app");
const { db, agenciesTable, membershipsTable } = await import("@workspace/db");
const { eq } = await import("drizzle-orm");

// Unique per run so repeated runs never collide on the (user, sub-account)
// uniqueness constraints or leave data that skews later assertions.
const RUN = Math.random().toString(36).slice(2, 10);
const ADMIN = `user_admin_${RUN}`;
const HOLDER = `user_holder_${RUN}`;
const MEMBER = `user_member_${RUN}`;
const OUTSIDER = `user_outsider_${RUN}`;
const EXPIRED_MEMBER = `user_expired_${RUN}`;

const DAY_MS = 24 * 60 * 60 * 1000;

let server: Server;
let baseUrl: string;
let agencyId: string;

interface Res {
  status: number;
  body: any;
}

async function call(
  actorId: string | null,
  method: string,
  path: string,
  body?: unknown,
): Promise<Res> {
  authState.userId = actorId;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// Redeem an invite as a specific user via a per-request header, so many of
// these can be in flight at once without stomping on shared auth state.
async function redeemAs(actorId: string, code: string): Promise<Res> {
  const res = await fetch(`${baseUrl}/invites/redeem`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-test-user": actorId,
    },
    body: JSON.stringify({ code }),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}/api`;

  // Seed a fresh agency + an agency-admin membership for ADMIN.
  const [agency] = await db
    .insert(agenciesTable)
    .values({ name: "Flow Test Agency" })
    .returning();
  agencyId = agency!.id;
  await db.insert(membershipsTable).values({
    userId: ADMIN,
    agencyId,
    subAccountId: null,
    role: "agency_admin",
    status: "active",
  });
});

afterAll(async () => {
  // Cascades to sub-accounts, memberships, and invites for this agency.
  if (agencyId) {
    await db.delete(agenciesTable).where(eq(agenciesTable.id, agencyId));
  }
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

describe("access flows (end-to-end over HTTP)", () => {
  let subAccountId: string;
  let holderInviteCode: string;
  let memberInviteCode: string;
  let memberId: string;
  let memberExpiryAfterRedeem: number;

  it("rejects unauthenticated callers", async () => {
    const res = await call(null, "GET", "/me");
    expect(res.status).toBe(401);
  });

  it("agency admin is entitled and can create a sub-account", async () => {
    const ent = await call(ADMIN, "GET", "/me/entitlement");
    expect(ent.status).toBe(200);
    expect(ent.body).toMatchObject({
      active: true,
      reason: "active",
      role: "agency_admin",
    });

    const created = await call(ADMIN, "POST", "/sub-accounts", {
      name: "Downtown Clinic",
    });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe("Downtown Clinic");
    expect(created.body.memberCount).toBe(0);
    subAccountId = created.body.id;
  });

  it("admin creates a sub-account holder invite", async () => {
    const invite = await call(ADMIN, "POST", "/invites", {
      subAccountId,
      role: "sub_account_holder",
    });
    expect(invite.status).toBe(201);
    expect(invite.body.status).toBe("pending");
    expect(invite.body.role).toBe("sub_account_holder");
    expect(typeof invite.body.code).toBe("string");
    holderInviteCode = invite.body.code;

    // The pending invite is visible in the admin's list.
    const list = await call(ADMIN, "GET", "/invites");
    expect(list.status).toBe(200);
    expect(list.body.some((i: any) => i.code === holderInviteCode)).toBe(true);
  });

  it("holder redeems the invite via the shareable code", async () => {
    const redeemed = await call(HOLDER, "POST", "/invites/redeem", {
      code: holderInviteCode,
    });
    expect(redeemed.status).toBe(201);
    expect(redeemed.body.role).toBe("sub_account_holder");
    expect(redeemed.body.status).toBe("active");
    // Holders are non-expiring staff.
    expect(redeemed.body.accessExpiresAt).toBeNull();

    // Holder now sees only their own sub-account.
    const subs = await call(HOLDER, "GET", "/sub-accounts");
    expect(subs.status).toBe(200);
    expect(subs.body.map((s: any) => s.id)).toEqual([subAccountId]);
  });

  it("a redeemed invite cannot be redeemed again", async () => {
    const again = await call(OUTSIDER, "POST", "/invites/redeem", {
      code: holderInviteCode,
    });
    expect(again.status).toBe(400);
  });

  it("an unknown code is rejected", async () => {
    const bad = await call(OUTSIDER, "POST", "/invites/redeem", {
      code: "does-not-exist",
    });
    expect(bad.status).toBe(400);
  });

  it("holder creates a member invite with a one-year window", async () => {
    const invite = await call(HOLDER, "POST", "/invites", {
      subAccountId,
      role: "member",
      accessDurationDays: 365,
    });
    expect(invite.status).toBe(201);
    expect(invite.body.role).toBe("member");
    expect(invite.body.accessDurationDays).toBe(365);
    memberInviteCode = invite.body.code;
  });

  it("member redeems and appears with active status and a ~1yr expiry", async () => {
    const redeemed = await call(MEMBER, "POST", "/invites/redeem", {
      code: memberInviteCode,
    });
    expect(redeemed.status).toBe(201);
    expect(redeemed.body.role).toBe("member");
    expect(redeemed.body.status).toBe("active");
    expect(redeemed.body.email).toBe(`${MEMBER}@example.com`);
    expect(redeemed.body.accessExpiresAt).not.toBeNull();
    memberId = redeemed.body.id;
    memberExpiryAfterRedeem = new Date(redeemed.body.accessExpiresAt).getTime();

    const expectedApprox = Date.now() + 365 * DAY_MS;
    // Within a day of a year from now.
    expect(Math.abs(memberExpiryAfterRedeem - expectedApprox)).toBeLessThan(
      DAY_MS,
    );

    // Member is entitled with the member role.
    const ent = await call(MEMBER, "GET", "/me/entitlement");
    expect(ent.body).toMatchObject({
      active: true,
      reason: "active",
      role: "member",
    });
  });

  it("member shows up in admin and holder member lists", async () => {
    const adminList = await call(ADMIN, "GET", "/members", undefined);
    expect(adminList.body.some((m: any) => m.id === memberId)).toBe(true);

    const holderList = await call(
      HOLDER,
      "GET",
      `/members?subAccountId=${subAccountId}`,
    );
    const found = holderList.body.find((m: any) => m.id === memberId);
    expect(found).toBeDefined();
    expect(found.status).toBe("active");

    // Sub-account member count reflects the active member.
    const subs = await call(ADMIN, "GET", "/sub-accounts");
    const sub = subs.body.find((s: any) => s.id === subAccountId);
    expect(sub.memberCount).toBe(1);
  });

  it("enforces role boundaries: a member has no admin/holder powers", async () => {
    // Members are not entitled to see any sub-accounts, members, or invites.
    expect((await call(MEMBER, "GET", "/sub-accounts")).body).toEqual([]);
    expect((await call(MEMBER, "GET", "/members")).body).toEqual([]);
    expect((await call(MEMBER, "GET", "/invites")).body).toEqual([]);

    // Members cannot create sub-accounts.
    const createSub = await call(MEMBER, "POST", "/sub-accounts", {
      name: "Rogue",
    });
    expect(createSub.status).toBe(403);

    // Members cannot mint invites for a sub-account they don't hold.
    const createInvite = await call(MEMBER, "POST", "/invites", {
      subAccountId,
      role: "member",
    });
    expect(createInvite.status).toBe(403);

    // Members cannot renew or revoke other members.
    expect(
      (await call(MEMBER, "POST", `/members/${memberId}/renew`, {})).status,
    ).toBe(403);
    expect(
      (await call(MEMBER, "POST", `/members/${memberId}/revoke`, {})).status,
    ).toBe(403);
  });

  it("renewing extends the access window from the existing expiry", async () => {
    const renewed = await call(ADMIN, "POST", `/members/${memberId}/renew`, {
      accessDurationDays: 30,
    });
    expect(renewed.status).toBe(200);
    const newExpiry = new Date(renewed.body.accessExpiresAt).getTime();
    // Early renewal adds to the later of now/current expiry, so ~30 days more.
    const delta = newExpiry - memberExpiryAfterRedeem;
    expect(Math.abs(delta - 30 * DAY_MS)).toBeLessThan(DAY_MS);
  });

  it("revoking a member removes their access", async () => {
    const revoked = await call(ADMIN, "POST", `/members/${memberId}/revoke`, {});
    expect(revoked.status).toBe(200);
    expect(revoked.body.status).toBe("revoked");

    // The revoked member is no longer entitled.
    const ent = await call(MEMBER, "GET", "/me/entitlement");
    expect(ent.body).toMatchObject({ active: false, reason: "revoked" });

    // Active member count drops back to zero.
    const subs = await call(ADMIN, "GET", "/sub-accounts");
    const sub = subs.body.find((s: any) => s.id === subAccountId);
    expect(sub.memberCount).toBe(0);
  });

  it("lets only one of many concurrent redeemers claim a single invite", async () => {
    // A single fresh member invite for the shared sub-account.
    const invite = await call(ADMIN, "POST", "/invites", {
      subAccountId,
      role: "member",
    });
    expect(invite.status).toBe(201);
    const code = invite.body.code;

    // A crowd of distinct users races to redeem the same code simultaneously.
    const N = 24;
    const racers = Array.from(
      { length: N },
      (_, i) => `user_racer_${RUN}_${i}`,
    );
    const results = await Promise.all(racers.map((u) => redeemAs(u, code)));

    // Exactly one caller wins with a 201; every other caller is cleanly
    // rejected with 400 (invalid/already-claimed) or 409 (duplicate). Any 500
    // or a second 201 would mean the atomic claim leaked.
    const created = results.filter((r) => r.status === 201);
    const rejected = results.filter(
      (r) => r.status === 400 || r.status === 409,
    );
    expect(created).toHaveLength(1);
    expect(rejected).toHaveLength(N - 1);
    expect(results.every((r) => r.status === 201 || r.status === 400 || r.status === 409)).toBe(true);

    // The database is the source of truth: exactly one membership exists across
    // all racers for this sub-account, so the invite was never double-claimed.
    const memberships = await db
      .select()
      .from(membershipsTable)
      .where(eq(membershipsTable.subAccountId, subAccountId));
    const racerMemberships = memberships.filter((m) =>
      racers.includes(m.userId),
    );
    expect(racerMemberships).toHaveLength(1);

    // The lone membership belongs to the single 201 winner.
    expect(racerMemberships[0]!.userId).toBe(created[0]!.body.userId);
  });

  it("a pending invite can be revoked and then cannot be redeemed", async () => {
    const invite = await call(ADMIN, "POST", "/invites", {
      subAccountId,
      role: "member",
    });
    expect(invite.status).toBe(201);
    const code = invite.body.code;
    const inviteId = invite.body.id;

    const revoke = await call(ADMIN, "POST", `/invites/${inviteId}/revoke`, {});
    expect(revoke.status).toBe(200);
    expect(revoke.body.status).toBe("revoked");

    const redeem = await call(OUTSIDER, "POST", "/invites/redeem", { code });
    expect(redeem.status).toBe(400);
  });
});

// Proves expiry is enforced through the real HTTP layer, not just in the unit
// tests for computeEntitlement. A member whose one-year window has lapsed must
// lose access everywhere the entitlement guard runs, and a renew must restore
// it. Guards against a silent regression where an expired membership keeps
// working because a route skipped requireEntitlement.
describe("expiry enforcement (end-to-end over HTTP)", () => {
  let expiredSubAccountId: string;
  let expiredMemberId: string;

  const SYNC_PAYLOAD = {
    userData: { theme: "dark" },
    entries: {},
    groundingSessions: [],
    completedExercises: {},
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    // Fresh sub-account + redeemed member so we don't disturb the flow above.
    const sub = await call(ADMIN, "POST", "/sub-accounts", {
      name: "Expiry Test Clinic",
    });
    expect(sub.status).toBe(201);
    expiredSubAccountId = sub.body.id;

    const invite = await call(ADMIN, "POST", "/invites", {
      subAccountId: expiredSubAccountId,
      role: "member",
      accessDurationDays: 365,
    });
    expect(invite.status).toBe(201);

    const redeemed = await call(EXPIRED_MEMBER, "POST", "/invites/redeem", {
      code: invite.body.code,
    });
    expect(redeemed.status).toBe(201);
    expect(redeemed.body.status).toBe("active");
    expiredMemberId = redeemed.body.id;

    // Force the one-year window to have already lapsed. The membership row stays
    // status "active"; only accessExpiresAt moves into the past, mirroring a
    // member whose access simply ran out over time.
    await db
      .update(membershipsTable)
      .set({ accessExpiresAt: new Date(Date.now() - DAY_MS) })
      .where(eq(membershipsTable.id, expiredMemberId));
  });

  it("reports the lapsed member as inactive with reason 'expired'", async () => {
    const ent = await call(EXPIRED_MEMBER, "GET", "/me/entitlement");
    expect(ent.status).toBe(200);
    expect(ent.body).toMatchObject({
      active: false,
      reason: "expired",
      role: "member",
    });
  });

  it("blocks entitlement-gated routes for the lapsed member", async () => {
    const readSync = await call(EXPIRED_MEMBER, "GET", "/sync");
    expect(readSync.status).toBe(403);
    expect(readSync.body).toMatchObject({ reason: "expired" });

    const writeSync = await call(
      EXPIRED_MEMBER,
      "PUT",
      "/sync",
      SYNC_PAYLOAD,
    );
    expect(writeSync.status).toBe(403);
    expect(writeSync.body).toMatchObject({ reason: "expired" });
  });

  it("restores access after a renew", async () => {
    const renewed = await call(
      ADMIN,
      "POST",
      `/members/${expiredMemberId}/renew`,
      { accessDurationDays: 365 },
    );
    expect(renewed.status).toBe(200);
    expect(new Date(renewed.body.accessExpiresAt).getTime()).toBeGreaterThan(
      Date.now(),
    );

    // Entitlement flips back to active...
    const ent = await call(EXPIRED_MEMBER, "GET", "/me/entitlement");
    expect(ent.body).toMatchObject({
      active: true,
      reason: "active",
      role: "member",
    });

    // ...and gated routes let the member through again.
    const writeSync = await call(
      EXPIRED_MEMBER,
      "PUT",
      "/sync",
      SYNC_PAYLOAD,
    );
    expect(writeSync.status).toBe(200);
    expect(writeSync.body).toMatchObject({ ok: true });

    const readSync = await call(EXPIRED_MEMBER, "GET", "/sync");
    expect(readSync.status).toBe(200);
    expect(readSync.body).toMatchObject({ found: true });
  });
});
