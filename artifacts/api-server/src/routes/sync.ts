import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import { eq } from "drizzle-orm";
import { db, userDataTable } from "@workspace/db";
import { z } from "zod/v4";
import { requireAuth, loadActor, requireEntitlement } from "../middlewares/auth";

const router: IRouter = Router();

// Scope the entitlement guard to /sync only. All feature routers share the
// same /api mount, and a path-less router.use() runs for every request that
// flows through this router on its way to a later one. Without the "/sync"
// path prefix, requireEntitlement would leak onto invites/redeem and block
// brand-new invitees (who have no membership yet) from ever redeeming.
router.use("/sync", requireAuth, loadActor, requireEntitlement);

const SyncPayloadSchema = z.object({
  userData: z.record(z.string(), z.unknown()),
  entries: z.record(z.string(), z.unknown()),
  groundingSessions: z.array(z.unknown()),
  completedExercises: z.record(z.string(), z.string()),
  updatedAt: z.string(),
});

router.get("/sync", async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  try {
    const rows = await db.select().from(userDataTable).where(eq(userDataTable.userId, userId));
    if (rows.length === 0) {
      res.json({ found: false });
      return;
    }
    res.json({ found: true, data: rows[0]!.data, updatedAt: rows[0]!.updatedAt });
  } catch (err) {
    req.log.error({ err }, "GET /sync failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/sync", async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const parsed = SyncPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  try {
    await db
      .insert(userDataTable)
      .values({ userId, data: parsed.data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userDataTable.userId,
        set: { data: parsed.data, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PUT /sync failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/sync", async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  try {
    await db.delete(userDataTable).where(eq(userDataTable.userId, userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /sync failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
