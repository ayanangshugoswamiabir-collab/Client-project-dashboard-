import { Router } from "express";

import {
  getRecentActivitiesController,
  getActivitiesSinceController,
} from "../controllers/activity.controller";

import { authenticate } from "../middleware/auth";

const router = Router();

router.get(
  "/",
  authenticate,
  getRecentActivitiesController
);

router.get(
  "/since",
  authenticate,
  getActivitiesSinceController
);

export default router;