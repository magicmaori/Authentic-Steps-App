import { randomBytes } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  invitesTable,
  membershipsTable,
  subAccountsTable,
} from "@workspace/db";
import {
  ListInvitesResponse,
  ListInvitesResponseItem,
  ListInvitesQueryParams,
  ListMembersResponseItem,
  CreateInviteBody,
  RedeemInviteBody,
  ResendInviteParams,
  RevokeInviteParams,
  RevokeInviteResponse,
} from "@workspace/api-zod";
import { requireAuth, loadActor } from "../middlewares/auth";
import {
  DEFAULT_ACCESS_DURATION_DAYS,
  agencyIdsAsAdmin,
  daysFromNow,
  isAgencyAdminOf,
  isHolderOf,
  subAccountIdsAsHolder,
} from "../lib/access";
import { sendInviteEmail } from "../lib/email";

const router: IRouter = Router();

router.use(requireAuth, loadActor);

function generateInviteCode(): string {
  return randomBytes(16).toString("base64url");
}

router.get("/invites", async (req: Request, res: Response): Promise<void> => {
  const actor = req.actor!;
  const query = ListInvitesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const adminAgencyIds = agencyIdsAsAdmin(actor);
  const holderSubIds = subAccountIdsAsHolder(actor);

  const scope = [];
  if (adminAgencyIds.length > 0) {
    scope.push(inArray(invitesTable.agencyId, adminAgencyIds));
  }
  if (holderSubIds.length > 0) {
    scope.push(inArray(invitesTable.subAccountId, holderSubIds));
  }
  if (scope.length === 0) {
    res.json([]);
    return;
  }

  let where = or(...scope);
  if (query.data.subAccountId) {
    where = and(where, eq(invitesTable.subAccountId, query.data.subAccountId));
  }

  const invites = await db
    .select()
    .from(invitesTable)
    .where(where)
    .orderBy(desc(invitesTable.createdAt));

  res.json(ListInvitesResponse.parse(invites));
});

router.post("/invites", async (req: Request, res: Response): Promise<void> => {
  const actor = req.actor!;
  const parsed = CreateInviteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sub] = await db
    .select()
    .from(subAccountsTable)
    .where(eq(subAccountsTable.id, parsed.data.subAccountId))
    .limit(1);
  if (!sub) {
    res.status(404).json({ error: "Sub-account not found" });
    return;
  }

  // Authorize against the DB-fetched sub-account, never client-supplied ids.
  const canAdmin = isAgencyAdminOf(actor, sub.agencyId);
  const canHold = isHolderOf(actor, sub.id);
  if (parsed.data.role === "sub_account_holder") {
    if (!canAdmin) {
      res
        .status(403)
        .json({ error: "Only agency admins can invite sub-account holders" });
      return;
    }
  } else if (!canAdmin && !canHold) {
    res.status(403).json({ error: "Not permitted for this sub-account" });
    return;
  }

  // Members get a time-limited window; holders are non-expiring staff.
  const accessDurationDays =
    parsed.data.role === "member"
      ? (parsed.data.accessDurationDays ?? DEFAULT_ACCESS_DURATION_DAYS)
      : null;
  const inviteExpiresAt = parsed.data.inviteExpiresInDays
    ? daysFromNow(parsed.data.inviteExpiresInDays)
    : null;

  const email = parsed.data.email ?? null;

  const [invite] = await db
    .insert(invitesTable)
    .values({
      code: generateInviteCode(),
      agencyId: sub.agencyId,
      subAccountId: sub.id,
      role: parsed.data.role,
      accessDurationDays,
      inviteExpiresAt,
      status: "pending",
      email,
      createdByUserId: actor.userId,
    })
    .returning();

  let result = invite!;

  // If an invitee email was captured, deliver the redeem link automatically.
  // A delivery failure must not fail invite creation — the invite is still
  // valid and can be re-sent or copied manually; emailSentAt stays null so the
  // dashboard shows it was not delivered.
  if (email) {
    try {
      await sendInviteEmail({
        to: email,
        code: result.code,
        role: result.role,
        programName: sub.name,
        inviteExpiresAt: result.inviteExpiresAt,
      });
      const [updated] = await db
        .update(invitesTable)
        .set({ emailSentAt: new Date(), updatedAt: new Date() })
        .where(eq(invitesTable.id, result.id))
        .returning();
      result = updated ?? result;
    } catch (err) {
      req.log.warn({ err }, "Failed to send invite email on create");
    }
  }

  res.status(201).json(ListInvitesResponseItem.parse(result));
});

router.post(
  "/invites/redeem",
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const parsed = RedeemInviteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const code = parsed.data.code;

    // Snapshot the redeemer's email for display; non-fatal if unavailable.
    let email: string | null = null;
    try {
      const user = await clerkClient.users.getUser(userId);
      email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress ??
        null;
    } catch (err) {
      req.log.warn({ err }, "Could not fetch Clerk user email for invite redeem");
    }

    const outcome = await db.transaction(async (tx) => {
      const [peek] = await tx
        .select()
        .from(invitesTable)
        .where(eq(invitesTable.code, code))
        .limit(1);
      if (!peek) {
        return { status: "invalid" as const };
      }

      // Reject a duplicate membership before burning the invite.
      if (peek.subAccountId) {
        const existing = await tx
          .select()
          .from(membershipsTable)
          .where(
            and(
              eq(membershipsTable.userId, userId),
              eq(membershipsTable.subAccountId, peek.subAccountId),
            ),
          )
          .limit(1);
        if (existing.length > 0) {
          return { status: "conflict" as const };
        }
      }

      // Atomic claim: only one caller can flip pending -> redeemed.
      const claimed = await tx
        .update(invitesTable)
        .set({
          status: "redeemed",
          redeemedByUserId: userId,
          redeemedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invitesTable.code, code),
            eq(invitesTable.status, "pending"),
            or(
              isNull(invitesTable.inviteExpiresAt),
              gt(invitesTable.inviteExpiresAt, new Date()),
            ),
          ),
        )
        .returning();
      const invite = claimed[0];
      if (!invite) {
        return { status: "invalid" as const };
      }

      const accessExpiresAt =
        invite.role === "member"
          ? daysFromNow(invite.accessDurationDays ?? DEFAULT_ACCESS_DURATION_DAYS)
          : null;

      const [membership] = await tx
        .insert(membershipsTable)
        .values({
          userId,
          agencyId: invite.agencyId,
          subAccountId: invite.subAccountId,
          role: invite.role,
          status: "active",
          email,
          accessExpiresAt,
        })
        .returning();

      return { status: "ok" as const, membership: membership! };
    });

    if (outcome.status === "conflict") {
      res
        .status(409)
        .json({ error: "You already have access for this sub-account" });
      return;
    }
    if (outcome.status === "invalid") {
      res.status(400).json({ error: "Invalid or expired invite code" });
      return;
    }

    res.status(201).json(ListMembersResponseItem.parse(outcome.membership));
  },
);

router.post(
  "/invites/:id/resend",
  async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor!;
    const params = ResendInviteParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [invite] = await db
      .select()
      .from(invitesTable)
      .where(eq(invitesTable.id, params.data.id))
      .limit(1);
    if (!invite) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }

    const canAdmin = isAgencyAdminOf(actor, invite.agencyId);
    const canHold = invite.subAccountId
      ? isHolderOf(actor, invite.subAccountId)
      : false;
    if (!canAdmin && !canHold) {
      res.status(403).json({ error: "Not permitted for this invite" });
      return;
    }

    if (invite.status !== "pending") {
      res.status(400).json({ error: "Only pending invites can be re-sent" });
      return;
    }
    if (!invite.email) {
      res
        .status(400)
        .json({ error: "This invite has no email address to send to" });
      return;
    }

    let programName: string | null = null;
    if (invite.subAccountId) {
      const [sub] = await db
        .select()
        .from(subAccountsTable)
        .where(eq(subAccountsTable.id, invite.subAccountId))
        .limit(1);
      programName = sub?.name ?? null;
    }

    try {
      await sendInviteEmail({
        to: invite.email,
        code: invite.code,
        role: invite.role,
        programName,
        inviteExpiresAt: invite.inviteExpiresAt,
      });
    } catch (err) {
      req.log.warn({ err }, "Failed to re-send invite email");
      res.status(400).json({
        error:
          err instanceof Error ? err.message : "Failed to send invite email",
      });
      return;
    }

    const [updated] = await db
      .update(invitesTable)
      .set({ emailSentAt: new Date(), updatedAt: new Date() })
      .where(eq(invitesTable.id, invite.id))
      .returning();

    res.json(ListInvitesResponseItem.parse(updated!));
  },
);

router.post(
  "/invites/:id/revoke",
  async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor!;
    const params = RevokeInviteParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [invite] = await db
      .select()
      .from(invitesTable)
      .where(eq(invitesTable.id, params.data.id))
      .limit(1);
    if (!invite) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }

    const canAdmin = isAgencyAdminOf(actor, invite.agencyId);
    const canHold = invite.subAccountId
      ? isHolderOf(actor, invite.subAccountId)
      : false;
    if (!canAdmin && !canHold) {
      res.status(403).json({ error: "Not permitted for this invite" });
      return;
    }

    if (invite.status !== "pending") {
      res.status(400).json({ error: "Only pending invites can be revoked" });
      return;
    }

    const [updated] = await db
      .update(invitesTable)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(invitesTable.id, invite.id))
      .returning();

    res.json(RevokeInviteResponse.parse(updated!));
  },
);

export default router;
