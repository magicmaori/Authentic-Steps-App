import { Router, type IRouter } from "express";
import healthRouter from "./health";
import syncRouter from "./sync";
import meRouter from "./me";
import subAccountsRouter from "./sub-accounts";
import invitesRouter from "./invites";
import membersRouter from "./members";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(syncRouter);
// storageRouter must be mounted before the routers below: they register
// `router.use(requireAuth, ...)` with no path prefix, which (since each
// router is itself mounted at "/") intercepts every request that reaches
// it regardless of path — so any router placed after them would 401 on
// paths it doesn't even own.
router.use(storageRouter);
router.use(meRouter);
router.use(subAccountsRouter);
router.use(invitesRouter);
router.use(membersRouter);

export default router;
