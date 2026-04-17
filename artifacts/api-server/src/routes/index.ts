import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scansRouter from "./scans";
import recommendationsRouter from "./recommendations";
import cropsRouter from "./crops";
import voiceRouter from "./voice";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scansRouter);
router.use(recommendationsRouter);
router.use(cropsRouter);
router.use(voiceRouter);
router.use(reportsRouter);

export default router;
