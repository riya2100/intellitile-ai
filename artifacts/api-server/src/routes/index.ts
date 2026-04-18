import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tilesRouter from "./tiles";
import recommendationsRouter from "./recommendations";
import visualizerRouter from "./visualizer";
import conversationsRouter from "./conversations";
import analyticsRouter from "./analytics";
import compareRouter from "./compare";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tilesRouter);
router.use(recommendationsRouter);
router.use(visualizerRouter);
router.use(conversationsRouter);
router.use(analyticsRouter);
router.use(compareRouter);

export default router;
