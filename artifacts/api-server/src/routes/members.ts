import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db, membershipsTable } from "@workspace/db";
import {
  ListMembersResponse,
  ListMembersQueryParams,
  RenewMemberParams,
  RenewMemberBody,
  RenewMemberResponse,
  RevokeMemberParams,
  RevokeMemberResponse,
} from "@workspace/api-zod";
import { requireAuth, loadActor } from "../middlewares/auth";
import {
  DEFAULT_ACCESS_DURATION_DAYS,
  agencyIdsAsAdmin,
  extendExpiry,
  isAgencyAdminOf,
  isHolderOf,
  subAccountIdsAsHolder,
} from "../lib/access";

const router: IRouter = Router();

router.use(requireAuth, loadActor);

router.get("/members", async (req: Request, res: Response): Promise<void> => {
  const actor = req.actor!;
  const query = ListMembersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const adminAgencyIds = agencyIdsAsAdmin(actor);
  const holderSubIds = subAccountIdsAsHolder(actor);

  const scope = [];
  if (adminAgencyIds.length > 0) {
    scope.push(inArray(membershipsTable.agencyId, adminAgencyIds));
  }
  if (holderSubIds.length > 0) {
    scope.push(inArray(membershipsTable.subAccountId, holderSubIds));
  }
  if (scope.length === 0) {
    res.json([]);
    return;
  }

  let where = and(eq(membershipsTable.role, "member"), or(...scope));
  if (query.data.subAccountId) {
    where = and(where, eq(membershipsTable.subAccountId, query.data.subAccountId));
  }

  const members = await db
    .select()
    .from(membershipsTable)
    .where(where)
    .orderBy(desc(membershipsTable.createdAt));

  res.json(ListMembersResponse.parse(members));
});

router.post(
  "/members/:id/renew",
  async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor!;
    const params = RenewMemberParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = RenewMemberBody.safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [member] = await db
      .select()
      .from(membershipsTable)
      .where(eq(membershipsTable.id, params.data.id))
      .limit(1);
    if (!member || member.role !== "member") {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const canManage =
      isAgencyAdminOf(actor, member.agencyId) ||
      (member.subAccountId ? isHolderOf(actor, member.subAccountId) : false);
    if (!canManage) {
      res.status(403).json({ error: "Not permitted for this member" });
      return;
    }

    const days = body.data.accessDurationDays ?? DEFAULT_ACCESS_DURATION_DAYS;
    const [updated] = await db
      .update(membershipsTable)
      .set({
        accessExpiresAt: extendExpiry(member.accessExpiresAt, days),
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(membershipsTable.id, member.id))
      .returning();

    res.json(RenewMemberResponse.parse(updated!));
  },
);

router.post(
  "/members/:id/revoke",
  async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor!;
    const params = RevokeMemberParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [member] = await db
      .select()
      .from(membershipsTable)
      .where(eq(membershipsTable.id, params.data.id))
      .limit(1);
    if (!member || member.role !== "member") {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const canManage =
      isAgencyAdminOf(actor, member.agencyId) ||
      (member.subAccountId ? isHolderOf(actor, member.subAccountId) : false);
    if (!canManage) {
      res.status(403).json({ error: "Not permitted for this member" });
      return;
    }

    const [updated] = await db
      .update(membershipsTable)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(membershipsTable.id, member.id))
      .returning();

    res.json(RevokeMemberResponse.parse(updated!));
  },
);

export default router;
