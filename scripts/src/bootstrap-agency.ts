/**
 * Bootstrap an agency and its agency admin.
 *
 * The admin must already exist as a Clerk user (i.e. they signed in once). This
 * script resolves their Clerk user id by email, then creates an agency and an
 * agency_admin membership for them. Run it once per agency — each run creates a
 * new agency.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run bootstrap-agency "<Agency Name>" <admin-email>
 */
import { clerkClient } from "@clerk/express";
import { db, agenciesTable, membershipsTable } from "@workspace/db";

async function main(): Promise<void> {
  const agencyName = process.argv[2];
  const email = process.argv[3];

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

  const result = await db.transaction(async (tx) => {
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

    return { agency: agency!, membership: membership! };
  });

  console.log(`Created agency: ${result.agency.id} (${result.agency.name})`);
  console.log(
    `Agency admin: ${result.membership.userId} (${result.membership.email ?? "no email"})`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
