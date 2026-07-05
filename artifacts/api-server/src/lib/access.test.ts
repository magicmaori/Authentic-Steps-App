import { describe, it, expect } from "vitest";
import type { Membership } from "@workspace/db";
import type { Actor } from "../middlewares/auth";
import {
  agencyIdsAsAdmin,
  computeEntitlement,
  extendExpiry,
  isAgencyAdminOf,
  isHolderOf,
  subAccountIdsAsHolder,
} from "./access";

const NOW = new Date("2026-07-05T00:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function member(overrides: Partial<Membership> = {}): Membership {
  return {
    id: "m1",
    userId: "u1",
    agencyId: "agency-1",
    subAccountId: null,
    role: "member",
    status: "active",
    email: null,
    accessExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function actor(memberships: Membership[]): Actor {
  return { userId: "u1", memberships };
}

describe("extendExpiry", () => {
  it("extends from now when there is no current expiry", () => {
    expect(extendExpiry(null, 10, NOW).getTime()).toBe(NOW.getTime() + 10 * DAY);
  });

  it("extends from now when the current expiry is already in the past", () => {
    const past = new Date(NOW.getTime() - 5 * DAY);
    expect(extendExpiry(past, 10, NOW).getTime()).toBe(NOW.getTime() + 10 * DAY);
  });

  it("extends from the current expiry when it is still in the future", () => {
    const future = new Date(NOW.getTime() + 30 * DAY);
    expect(extendExpiry(future, 10, NOW).getTime()).toBe(
      future.getTime() + 10 * DAY,
    );
  });
});

describe("computeEntitlement", () => {
  it("returns none for a user with no memberships", () => {
    expect(computeEntitlement([], NOW)).toMatchObject({
      active: false,
      reason: "none",
      role: null,
    });
  });

  it("is active for a non-expiring active membership", () => {
    const result = computeEntitlement(
      [member({ role: "agency_admin", accessExpiresAt: null })],
      NOW,
    );
    expect(result.active).toBe(true);
    expect(result.reason).toBe("active");
    expect(result.expiresAt).toBeNull();
  });

  it("is active for a membership expiring in the future", () => {
    const future = new Date(NOW.getTime() + 5 * DAY);
    const result = computeEntitlement(
      [member({ accessExpiresAt: future })],
      NOW,
    );
    expect(result.active).toBe(true);
    expect(result.reason).toBe("active");
    expect(result.expiresAt?.getTime()).toBe(future.getTime());
  });

  it("reports expired when the only membership is past its window", () => {
    const past = new Date(NOW.getTime() - DAY);
    const result = computeEntitlement([member({ accessExpiresAt: past })], NOW);
    expect(result.active).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("reports revoked when the only membership is revoked", () => {
    const result = computeEntitlement([member({ status: "revoked" })], NOW);
    expect(result.active).toBe(false);
    expect(result.reason).toBe("revoked");
  });

  it("prefers an active membership over an expired one", () => {
    const past = new Date(NOW.getTime() - DAY);
    const future = new Date(NOW.getTime() + DAY);
    const result = computeEntitlement(
      [
        member({ id: "expired", accessExpiresAt: past }),
        member({ id: "active", subAccountId: "sub-1", accessExpiresAt: future }),
      ],
      NOW,
    );
    expect(result.active).toBe(true);
    expect(result.reason).toBe("active");
    expect(result.subAccountId).toBe("sub-1");
  });

  it("prefers expired over revoked when there is no active membership", () => {
    const past = new Date(NOW.getTime() - DAY);
    const result = computeEntitlement(
      [
        member({ id: "revoked", status: "revoked" }),
        member({ id: "expired", accessExpiresAt: past }),
      ],
      NOW,
    );
    expect(result.reason).toBe("expired");
  });

  it("chooses the latest expiry among multiple active memberships", () => {
    const soon = new Date(NOW.getTime() + 2 * DAY);
    const later = new Date(NOW.getTime() + 20 * DAY);
    const result = computeEntitlement(
      [
        member({ id: "soon", accessExpiresAt: soon }),
        member({ id: "later", accessExpiresAt: later }),
      ],
      NOW,
    );
    expect(result.expiresAt?.getTime()).toBe(later.getTime());
  });
});

describe("role helpers", () => {
  it("agencyIdsAsAdmin only includes active agency_admin memberships", () => {
    const a = actor([
      member({ role: "agency_admin", agencyId: "a1" }),
      member({ role: "agency_admin", agencyId: "a2", status: "revoked" }),
      member({ role: "member", agencyId: "a3" }),
    ]);
    expect(agencyIdsAsAdmin(a)).toEqual(["a1"]);
    expect(isAgencyAdminOf(a, "a1")).toBe(true);
    expect(isAgencyAdminOf(a, "a2")).toBe(false);
    expect(isAgencyAdminOf(a, "a3")).toBe(false);
  });

  it("subAccountIdsAsHolder only includes active holders with a sub-account", () => {
    const a = actor([
      member({ role: "sub_account_holder", subAccountId: "s1" }),
      member({ role: "sub_account_holder", subAccountId: "s2", status: "revoked" }),
      member({ role: "sub_account_holder", subAccountId: null }),
      member({ role: "member", subAccountId: "s3" }),
    ]);
    expect(subAccountIdsAsHolder(a)).toEqual(["s1"]);
    expect(isHolderOf(a, "s1")).toBe(true);
    expect(isHolderOf(a, "s2")).toBe(false);
    expect(isHolderOf(a, "s3")).toBe(false);
  });
});
