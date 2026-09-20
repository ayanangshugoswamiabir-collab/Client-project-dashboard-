import { Router } from "express";

import {
  getNotificationsController,
  getUnreadCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from "../controllers/notification.controller";

import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getNotificationsController);

router.get(
  "/unread-count",
  authenticate,
  getUnreadCountController
);

router.patch(
  "/:id/read",
  authenticate,
  markNotificationAsReadController
);

router.patch(
  "/read-all",
  authenticate,
  markAllNotificationsAsReadController
);

export default router;