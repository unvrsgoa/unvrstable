import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tablesRouter from "./tables";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tablesRouter);

export default router;
