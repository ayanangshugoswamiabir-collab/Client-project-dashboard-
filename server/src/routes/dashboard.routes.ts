import { Router } from "express";

import { authenticate } from "../middleware/auth";

import {
  getDashboardStatsController,
} from "../controllers/dashboard.controller";

const router = Router();

router.get(
  "/stats",
  authenticate,
  getDashboardStatsController
);

export default router;