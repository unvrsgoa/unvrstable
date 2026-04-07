import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tablesRouter from "./tables";
import bookingsRouter from "./bookings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tablesRouter);
router.use(bookingsRouter);

export default router;
