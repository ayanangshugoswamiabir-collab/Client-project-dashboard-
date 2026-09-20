import { Router } from "express";

import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
} from "../controllers/project.controller";

import { authenticate, authorize } from "../middleware/auth";

import { validate } from "../middleware/validate";

import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/project.schema";

const router = Router();

// Get all projects
router.get(
  "/",
  authenticate,
  getProjectsController
);

// Get one project
router.get(
  "/:id",
  authenticate,
  getProjectController
);

// Create project
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER"),
  validate(createProjectSchema),
  createProjectController
);

// Update project
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER"),
  validate(updateProjectSchema),
  updateProjectController
);

// Delete project
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER"),
  deleteProjectController
);

export default router;