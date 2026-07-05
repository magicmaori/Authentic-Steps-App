import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, membershipsTable, type Membership } from "@workspace/db";
import { computeEntitlement } from "../lib/access";

export interface Actor {
  userId: string;
  memberships: Membership[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      actor?: Actor;
    }
  }
}

/**
 * Requires an authenticated Clerk session/token. Populates req.userId.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

/**
 * Loads all of the authenticated user's memberships onto req.actor for RBAC.
 * Must run after requireAuth.
 */
export async function loadActor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const memberships = await db
    .select()
    .from(membershipsTable)
    .where(eq(membershipsTable.userId, userId));
  req.actor = { userId, memberships };
  next();
}

/**
 * Enforces the closed-access model: the caller must have an active, unexpired
 * membership (a valid redeemed invite). Must run after loadActor. Returns 403
 * with the entitlement reason so the client can distinguish
 * expired/revoked/none.
 */
export function requireEntitlement(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.actor) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const entitlement = computeEntitlement(req.actor.memberships);
  if (!entitlement.active) {
    res.status(403).json({ error: "Access denied", reason: entitlement.reason });
    return;
  }
  next();
}
