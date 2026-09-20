import { Router } from "express";

import { authenticate, authorize } from "../middleware/auth";

import { getPresenceController } from "../controllers/presence.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getPresenceController
);

export default router;