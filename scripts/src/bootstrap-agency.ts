/**
 * Bootstrap an agency and its agency admin.
 *
 * The admin must already exist as a Clerk user (i.e. they signed in once). This
 * script resolves their Clerk user id by email, then creates an agency and an
 * agency_admin membership for them.
 *
 * The script is idempotent by (agency name, admin): if the admin already has an
 * active agency_admin membership for an agency with the same name, it reports
 * the existing agency and exits without creating a duplicate. Re-running the
 * exact same command is therefore a safe no-op. To create a second, distinct
 * agency for the same admin, run it again with a different agency name.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run bootstrap-agency "<Agency Name>" <admin-email>
 */
import { clerkClient } from "@clerk/express";
import { and, eq, isNull } from "drizzle-orm";
import { db, agenciesTable, membershipsTable } from "@workspace/db";

async function main(): Promise<void> {
  const agencyName = process.argv[2]?.trim();
  const email = process.argv[3]?.trim();

  if (!agencyName || !email) {
    console.error(
      'Usage: pnpm --filter @workspace/scripts run bootstrap-agency "<Agency Name>" <admin-email>',
    );
    process.exit(1);
  }

  const users = await clerkClient.users.getUserList({ emailAddress: [email] });
  const user = users.data[0];
  if (!user) {
    console.error(
      `No Clerk user found with email ${email}. Ask them to sign up first, then re-run.`,
    );
    process.exit(1);
  }
  const userId = user.id;
  const resolvedEmail = user.primaryEmailAddress?.emailAddress ?? email;

  const outcome = await db.transaction(async (tx) => {
    // Idempotency: if this admin already runs an agency with the same name,
    // don't create a duplicate. An agency_admin membership has a null
    // subAccountId (see the DB check constraint).
    const existingAdminMemberships = await tx
      .select()
      .from(membershipsTable)
      .innerJoin(agenciesTable, eq(membershipsTable.agencyId, agenciesTable.id))
      .where(
        and(
          eq(membershipsTable.userId, userId),
          eq(membershipsTable.role, "agency_admin"),
          eq(membershipsTable.status, "active"),
          isNull(membershipsTable.subAccountId),
          eq(agenciesTable.name, agencyName),
        ),
      )
      .limit(1);

    const existing = existingAdminMemberships[0];
    if (existing) {
      return {
        created: false as const,
        agency: existing.agencies,
        membership: existing.memberships,
      };
    }

    const [agency] = await tx
      .insert(agenciesTable)
      .values({ name: agencyName })
      .returning();

    const [membership] = await tx
      .insert(membershipsTable)
      .values({
        userId,
        agencyId: agency!.id,
        subAccountId: null,
        role: "agency_admin",
        status: "active",
        email: resolvedEmail,
      })
      .returning();

    return { created: true as const, agency: agency!, membership: membership! };
  });

  if (!outcome.created) {
    console.log(
      `Agency already exists (no-op): ${outcome.agency.id} (${outcome.agency.name})`,
    );
    console.log(
      `Agency admin: ${outcome.membership.userId} (${outcome.membership.email ?? "no email"})`,
    );
    process.exit(0);
  }

  console.log(`Created agency: ${outcome.agency.id} (${outcome.agency.name})`);
  console.log(
    `Agency admin: ${outcome.membership.userId} (${outcome.membership.email ?? "no email"})`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
