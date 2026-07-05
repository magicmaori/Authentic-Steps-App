import type { Membership, MembershipRole } from "@workspace/api-client-react";

const ROLE_RANK: Record<MembershipRole, number> = {
  agency_admin: 3,
  sub_account_holder: 2,
  member: 1,
};

export function getActiveRole(memberships?: Membership[]): MembershipRole | undefined {
  const active = (memberships ?? []).filter((m) => m.status === "active");
  if (active.length === 0) return undefined;
  return active.reduce((best, m) => (ROLE_RANK[m.role] > ROLE_RANK[best.role] ? m : best)).role;
}

export function getActiveMembership(memberships?: Membership[]): Membership | undefined {
  const active = (memberships ?? []).filter((m) => m.status === "active");
  if (active.length === 0) return undefined;
  return active.reduce((best, m) => (ROLE_RANK[m.role] > ROLE_RANK[best.role] ? m : best));
}
