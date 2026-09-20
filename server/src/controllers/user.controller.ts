
import type { Request, Response } from "express";

import { getDevelopers } from "../services/user.service";

export async function getDevelopersController(
  _req: Request,
  res: Response
) {
  try {
    const developers = await getDevelopers();

    res.json({
      success: true,
      data: developers,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch developers",
      },
    });
  }
}
