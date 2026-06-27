import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, userDataTable } from "@workspace/db";
import { z } from "zod/v4";

const router: IRouter = Router();

router.use(clerkMiddleware());

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const SyncPayloadSchema = z.object({
  userData: z.record(z.string(), z.unknown()),
  entries: z.record(z.string(), z.unknown()),
  groundingSessions: z.array(z.unknown()),
  completedExercises: z.record(z.string(), z.string()),
  updatedAt: z.string(),
});

router.get("/sync", requireAuth, async (req: Request, res: Response) => {
  const auth = getAuth(req);
  const userId = auth!.userId!;
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

router.put("/sync", requireAuth, async (req: Request, res: Response) => {
  const auth = getAuth(req);
  const userId = auth!.userId!;
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

export default router;
