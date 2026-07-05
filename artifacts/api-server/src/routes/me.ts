import { Router, type IRouter, type Request, type Response } from "express";
import { GetMeResponse, GetEntitlementResponse } from "@workspace/api-zod";
import { requireAuth, loadActor } from "../middlewares/auth";
import { computeEntitlement } from "../lib/access";

const router: IRouter = Router();

router.use(requireAuth, loadActor);

router.get("/me", (req: Request, res: Response): void => {
  const actor = req.actor!;
  res.json(
    GetMeResponse.parse({
      userId: actor.userId,
      memberships: actor.memberships,
    }),
  );
});

router.get("/me/entitlement", (req: Request, res: Response): void => {
  const actor = req.actor!;
  res.json(GetEntitlementResponse.parse(computeEntitlement(actor.memberships)));
});

export default router;
