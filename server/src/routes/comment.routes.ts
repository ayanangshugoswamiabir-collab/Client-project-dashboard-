import { Router } from "express";

import {
  createCommentController,
  getTaskCommentsController,
} from "../controllers/comment.controller";

import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

import { createCommentSchema } from "../schemas/comment.schema";

const router = Router();

router.get(
  "/task/:taskId",
  authenticate,
  getTaskCommentsController
);

router.post(
  "/",
  authenticate,
  validate(createCommentSchema),
  createCommentController
);

export default router;