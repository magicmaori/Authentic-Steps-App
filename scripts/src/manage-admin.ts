/**
 * Add, replace, or list the agency admin(s) of an EXISTING agency.
 *
 * Unlike bootstrap-agency (which creates a brand-new agency plus its first
 * admin), this operates on an agency that already exists. Use it to hand the
 * agency off to a new operator, add a co-admin, or inspect who the admins are.
 *
 * The target user must already exist as a Clerk user (i.e. they signed in once).
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run manage-admin list    "<Agency Name>|<agency-id>"
 *   pnpm --filter @workspace/scripts run manage-admin add     "<Agency Name>|<agency-id>" <admin-email>
 *   pnpm --filter @workspace/scripts run manage-admin replace "<Agency Name>|<agency-id>" <admin-email>
 *
 * <agency> is either the agency's UUID or its exact name. If a name matches more
 * than one agency, the command lists the candidates and asks you to re-run with
 * the UUID.
 *
 *   - list:    prints the agency's current active admins.
 *   - add:     ensures <admin-email> is an active agency_admin, keeping any
 *              existing admins (co-admin).
 *   - replace: ensures <admin-email> is an active agency_admin AND revokes every
 *              other active agency_admin of that agency (hand-off / swap).
 *
 * The operation is idempotent: re-running `add`/`replace` with the same email is
 * a safe no-op once that user is the (sole) active admin.
 */
import { clerkClient } from "@clerk/express";
import { and, eq, isNull, ne } from "drizzle-orm";
import {
  db,
  agenciesTable,
  membershipsTable,
  type Agency,
} from "@workspace/db";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACTIONS = ["list", "add", "replace"] as const;
type Action = (typeof ACTIONS)[number];

function isAction(value: string | undefined): value is Action {
  return !!value && (ACTIONS as readonly string[]).includes(value);
}

function usage(): never {
  console.error(
    [
      "Usage:",
      '  pnpm --filter @workspace/scripts run manage-admin list    "<Agency Name>|<agency-id>"',
      '  pnpm --filter @workspace/scripts run manage-admin add     "<Agency Name>|<agency-id>" <admin-email>',
      '  pnpm --filter @workspace/scripts run manage-admin replace "<Agency Name>|<agency-id>" <admin-email>',
    ].join("\n"),
  );
  process.exit(1);
}

async function resolveAgency(agencyRef: string): Promise<Agency> {
  if (UUID_RE.test(agencyRef)) {
    const rows = await db
      .select()
      .from(agenciesTable)
      .where(eq(agenciesTable.id, agencyRef))
      .limit(1);
    const agency = rows[0];
    if (!agency) {
      console.error(`No agency found with id ${agencyRef}.`);
      process.exit(1);
    }
    return agency;
  }

  const rows = await db
    .select()
    .from(agenciesTable)
    .where(eq(agenciesTable.name, agencyRef));

  if (rows.length === 0) {
    console.error(
      `No agency found with name "${agencyRef}". Pass the agency id or check the name.`,
    );
    process.exit(1);
  }
  if (rows.length > 1) {
    console.error(
      `Multiple agencies are named "${agencyRef}". Re-run with the agency id:`,
    );
    for (const a of rows) {
      console.error(`  ${a.id}  (created ${a.createdAt.toISOString()})`);
    }
    process.exit(1);
  }
  return rows[0]!;
}

async function resolveUser(
  email: string,
): Promise<{ userId: string; email: string }> {
  const users = await clerkClient.users.getUserList({ emailAddress: [email] });
  const user = users.data[0];
  if (!user) {
    console.error(
      `No Clerk user found with email ${email}. Ask them to sign in once, then re-run.`,
    );
    process.exit(1);
  }
  return {
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? email,
  };
}

function listAdmins(agencyId: string) {
  return db
    .select()
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.agencyId, agencyId),
        eq(membershipsTable.role, "agency_admin"),
        eq(membershipsTable.status, "active"),
        isNull(membershipsTable.subAccountId),
      ),
    );
}

async function main(): Promise<void> {
  const action = process.argv[2]?.trim();
  const agencyRef = process.argv[3]?.trim();

  if (!isAction(action) || !agencyRef) {
    usage();
  }

  const agency = await resolveAgency(agencyRef);

  if (action === "list") {
    const admins = await listAdmins(agency.id);
    console.log(`Agency: ${agency.id} (${agency.name})`);
    if (admins.length === 0) {
      console.log("  No active agency admins.");
    } else {
      console.log(`  Active agency admins (${admins.length}):`);
      for (const m of admins) {
        console.log(`    ${m.userId} (${m.email ?? "no email"})`);
      }
    }
    process.exit(0);
  }

  // add | replace both require an email.
  const email = process.argv[4]?.trim();
  if (!email) {
    usage();
  }

  const { userId, email: resolvedEmail } = await resolveUser(email);

  const result = await db.transaction(async (tx) => {
    // Upsert the target's admin membership. The unique index
    // memberships_user_agency_admin_uq covers (userId, agencyId) WHERE
    // subAccountId IS NULL regardless of status, so reactivate any existing
    // null-sub-account row instead of inserting a duplicate. The DB check
    // constraint guarantees a null-sub-account row is always agency_admin.
    const existing = (
      await tx
        .select()
        .from(membershipsTable)
        .where(
          and(
            eq(membershipsTable.userId, userId),
            eq(membershipsTable.agencyId, agency.id),
            isNull(membershipsTable.subAccountId),
          ),
        )
        .limit(1)
    )[0];

    let added: "created" | "reactivated" | "already-admin";
    if (existing) {
      if (existing.role === "agency_admin" && existing.status === "active") {
        added = "already-admin";
      } else {
        await tx
          .update(membershipsTable)
          .set({
            role: "agency_admin",
            status: "active",
            email: resolvedEmail,
            updatedAt: new Date(),
          })
          .where(eq(membershipsTable.id, existing.id));
        added = "reactivated";
      }
    } else {
      await tx.insert(membershipsTable).values({
        userId,
        agencyId: agency.id,
        subAccountId: null,
        role: "agency_admin",
        status: "active",
        email: resolvedEmail,
      });
      added = "created";
    }

    let revoked: { userId: string; email: string | null }[] = [];
    if (action === "replace") {
      const revokedRows = await tx
        .update(membershipsTable)
        .set({ status: "revoked", updatedAt: new Date() })
        .where(
          and(
            eq(membershipsTable.agencyId, agency.id),
            eq(membershipsTable.role, "agency_admin"),
            eq(membershipsTable.status, "active"),
            isNull(membershipsTable.subAccountId),
            ne(membershipsTable.userId, userId),
          ),
        )
        .returning();
      revoked = revokedRows.map((r) => ({ userId: r.userId, email: r.email }));
    }

    return { added, revoked };
  });

  console.log(`Agency: ${agency.id} (${agency.name})`);
  if (result.added === "already-admin") {
    console.log(
      `Admin: ${resolvedEmail} (${userId}) is already an active agency admin (no change).`,
    );
  } else if (result.added === "reactivated") {
    console.log(`Admin: reactivated ${resolvedEmail} (${userId}) as agency admin.`);
  } else {
    console.log(`Admin: added ${resolvedEmail} (${userId}) as agency admin.`);
  }

  if (action === "replace") {
    if (result.revoked.length === 0) {
      console.log("Replace: no other active admins to revoke.");
    } else {
      console.log(`Replace: revoked ${result.revoked.length} other admin(s):`);
      for (const r of result.revoked) {
        console.log(`  ${r.userId} (${r.email ?? "no email"})`);
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
