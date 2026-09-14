import { Router } from "express";
import healthRouter from "./health.js";
import tablesRouter from "./tables.js";
import bookingsRouter from "./bookings.js";

const router = Router();

router.use(healthRouter);
router.use(tablesRouter);
router.use(bookingsRouter);

export default router;
