import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/me", requireAuth, (req: Request, res: Response): void => {
  res.json({ userId: req.userId });
});

export default router;
