import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db, subAccountsTable, membershipsTable } from "@workspace/db";
import {
  ListSubAccountsResponse,
  ListSubAccountsResponseItem,
  CreateSubAccountBody,
} from "@workspace/api-zod";
import { requireAuth, loadActor } from "../middlewares/auth";
import { agencyIdsAsAdmin, subAccountIdsAsHolder } from "../lib/access";

const router: IRouter = Router();

router.use(requireAuth, loadActor);

router.get(
  "/sub-accounts",
  async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor!;
    const adminAgencyIds = agencyIdsAsAdmin(actor);
    const holderSubIds = subAccountIdsAsHolder(actor);

    const scope = [];
    if (adminAgencyIds.length > 0) {
      scope.push(inArray(subAccountsTable.agencyId, adminAgencyIds));
    }
    if (holderSubIds.length > 0) {
      scope.push(inArray(subAccountsTable.id, holderSubIds));
    }
    if (scope.length === 0) {
      res.json([]);
      return;
    }

    const subs = await db
      .select()
      .from(subAccountsTable)
      .where(or(...scope))
      .orderBy(subAccountsTable.createdAt);

    const subIds = subs.map((s) => s.id);
    const countRows =
      subIds.length > 0
        ? await db
            .select({
              subAccountId: membershipsTable.subAccountId,
              count: sql<number>`count(*)::int`,
            })
            .from(membershipsTable)
            .where(
              and(
                inArray(membershipsTable.subAccountId, subIds),
                eq(membershipsTable.role, "member"),
                eq(membershipsTable.status, "active"),
              ),
            )
            .groupBy(membershipsTable.subAccountId)
        : [];

    const countMap = new Map(
      countRows.map((r) => [r.subAccountId, Number(r.count)]),
    );
    const result = subs.map((s) => ({
      ...s,
      memberCount: countMap.get(s.id) ?? 0,
    }));

    res.json(ListSubAccountsResponse.parse(result));
  },
);

router.post(
  "/sub-accounts",
  async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor!;
    const adminAgencyIds = agencyIdsAsAdmin(actor);
    if (adminAgencyIds.length === 0) {
      res
        .status(403)
        .json({ error: "Only agency admins can create sub-accounts" });
      return;
    }

    const parsed = CreateSubAccountBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const agencyId = adminAgencyIds[0]!;
    const [created] = await db
      .insert(subAccountsTable)
      .values({ agencyId, name: parsed.data.name })
      .returning();

    res
      .status(201)
      .json(ListSubAccountsResponseItem.parse({ ...created!, memberCount: 0 }));
  },
);

export default router;
