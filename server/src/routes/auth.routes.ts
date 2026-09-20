import { Router } from "express";

import {
  register,
  login,
  refresh,
  me,
  logoutController,
} from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth";

import { validate } from "../middleware/validate";

import {
  registerSchema,
  loginSchema,
} from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.post(
  "/refresh",
  refresh
);

router.post(
  "/logout",
  logoutController
);

router.get(
  "/me",
  authenticate,
  me
);

export default router;