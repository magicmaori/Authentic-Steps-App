import { Router, type IRouter } from "express";
import healthRouter from "./health";
import syncRouter from "./sync";
import storageRouter from "./storage";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(syncRouter);
router.use(storageRouter);
router.use(feedbackRouter);

export default router;
