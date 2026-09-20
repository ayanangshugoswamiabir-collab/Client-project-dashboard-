
import { Router } from "express";

import { getDevelopersController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get(
  "/developers",
  authenticate,
  getDevelopersController
);

export default router;
