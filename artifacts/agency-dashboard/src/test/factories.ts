import type { Membership, MembershipRole } from "@workspace/api-client-react";

let seq = 0;

export function makeMembership(overrides: Partial<Membership> = {}): Membership {
  seq += 1;
  return {
    id: `mem_${seq}`,
    userId: `user_${seq}`,
    agencyId: "agency_1",
    subAccountId: null,
    role: "member" as MembershipRole,
    status: "active",
    email: null,
    accessExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function adminMemberships(): Membership[] {
  return [makeMembership({ role: "agency_admin", subAccountId: null })];
}

export function holderMemberships(subAccountId = "sub_1"): Membership[] {
  return [makeMembership({ role: "sub_account_holder", subAccountId })];
}

export function memberMemberships(subAccountId = "sub_1"): Membership[] {
  return [makeMembership({ role: "member", subAccountId })];
}
