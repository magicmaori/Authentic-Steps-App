import type { Membership } from "@workspace/db";
import type { Actor } from "../middlewares/auth";

export const DEFAULT_ACCESS_DURATION_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysFromNow(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

/** Extend from the later of now or the current expiry, so early renewals never
 * steal remaining time. */
export function extendExpiry(
  current: Date | null,
  days: number,
  now: Date = new Date(),
): Date {
  const base = current && current > now ? current : now;
  return new Date(base.getTime() + days * MS_PER_DAY);
}

export function agencyIdsAsAdmin(actor: Actor): string[] {
  return actor.memberships
    .filter((m) => m.role === "agency_admin" && m.status === "active")
    .map((m) => m.agencyId);
}

export function subAccountIdsAsHolder(actor: Actor): string[] {
  return actor.memberships
    .filter(
      (m) =>
        m.role === "sub_account_holder" &&
        m.status === "active" &&
        m.subAccountId !== null,
    )
    .map((m) => m.subAccountId as string);
}

export function isAgencyAdminOf(actor: Actor, agencyId: string): boolean {
  return agencyIdsAsAdmin(actor).includes(agencyId);
}

export function isHolderOf(actor: Actor, subAccountId: string): boolean {
  return subAccountIdsAsHolder(actor).includes(subAccountId);
}

export type EntitlementReason = "active" | "none" | "revoked" | "expired";

export interface EntitlementResult {
  active: boolean;
  reason: EntitlementReason;
  role: string | null;
  agencyId: string | null;
  subAccountId: string | null;
  expiresAt: Date | null;
}

function expiryMs(m: Membership): number {
  return m.accessExpiresAt ? m.accessExpiresAt.getTime() : 0;
}

/**
 * Server-authoritative entitlement. Active = a membership that is status
 * "active" and either non-expiring or not yet expired. Reason is prioritized
 * active > expired > revoked > none for the most actionable client message.
 */
export function computeEntitlement(
  memberships: Membership[],
  now: Date = new Date(),
): EntitlementResult {
  if (memberships.length === 0) {
    return {
      active: false,
      reason: "none",
      role: null,
      agencyId: null,
      subAccountId: null,
      expiresAt: null,
    };
  }

  const active = memberships.filter(
    (m) =>
      m.status === "active" &&
      (m.accessExpiresAt === null || m.accessExpiresAt > now),
  );
  if (active.length > 0) {
    const nonExpiring = active.find((m) => m.accessExpiresAt === null);
    const chosen =
      nonExpiring ??
      active.reduce((a, b) => (expiryMs(a) >= expiryMs(b) ? a : b));
    return {
      active: true,
      reason: "active",
      role: chosen.role,
      agencyId: chosen.agencyId,
      subAccountId: chosen.subAccountId ?? null,
      expiresAt: chosen.accessExpiresAt ?? null,
    };
  }

  const expired = memberships.filter(
    (m) =>
      m.status === "active" &&
      m.accessExpiresAt !== null &&
      m.accessExpiresAt <= now,
  );
  if (expired.length > 0) {
    const chosen = expired.reduce((a, b) => (expiryMs(a) >= expiryMs(b) ? a : b));
    return {
      active: false,
      reason: "expired",
      role: chosen.role,
      agencyId: chosen.agencyId,
      subAccountId: chosen.subAccountId ?? null,
      expiresAt: chosen.accessExpiresAt ?? null,
    };
  }

  const revoked = memberships.find((m) => m.status === "revoked");
  if (revoked) {
    return {
      active: false,
      reason: "revoked",
      role: revoked.role,
      agencyId: revoked.agencyId,
      subAccountId: revoked.subAccountId ?? null,
      expiresAt: revoked.accessExpiresAt ?? null,
    };
  }

  return {
    active: false,
    reason: "none",
    role: null,
    agencyId: null,
    subAccountId: null,
    expiresAt: null,
  };
}
