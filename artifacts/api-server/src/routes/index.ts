import { Router, type IRouter } from "express";
import healthRouter from "./health";
import syncRouter from "./sync";
import meRouter from "./me";
import subAccountsRouter from "./sub-accounts";
import invitesRouter from "./invites";
import membersRouter from "./members";

const router: IRouter = Router();

router.use(healthRouter);
router.use(syncRouter);
router.use(meRouter);
router.use(subAccountsRouter);
router.use(invitesRouter);
router.use(membersRouter);

export default router;
