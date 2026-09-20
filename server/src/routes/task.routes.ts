import { Router } from "express";

import {
  createTaskController,
  getTasksController,
  getTaskController,
  updateTaskController,
  deleteTaskController,
} from "../controllers/task.controller";

import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

import {
  createTaskSchema,
  updateTaskSchema,
} from "../schemas/task.schema";

const router = Router();

router.get(
  "/",
  authenticate,
  getTasksController
);

router.get(
  "/:id",
  authenticate,
  getTaskController
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER"),
  validate(createTaskSchema),
  createTaskController
);

router.patch(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  validate(updateTaskSchema),
  updateTaskController
);

router.delete(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  deleteTaskController
);

export default router;