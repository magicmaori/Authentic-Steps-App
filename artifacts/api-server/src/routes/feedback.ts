import { Router, type IRouter, type Request, type Response } from "express";
import { SubmitFeedbackBody, type FeedbackResult } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { createFeedbackIssue } from "../lib/linear";

const router: IRouter = Router();

router.post(
  "/feedback",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SubmitFeedbackBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    try {
      const issue = await createFeedbackIssue({
        userId: req.userId!,
        ...parsed.data,
      });
      const result: FeedbackResult = {
        ok: true,
        issueIdentifier: issue.identifier,
        issueUrl: issue.url,
      };
      res.status(201).json(result);
    } catch (err) {
      req.log.error({ err }, "Failed to file beta feedback as a Linear issue");
      res.status(502).json({ error: "Failed to submit feedback" });
    }
  },
);

export default router;
