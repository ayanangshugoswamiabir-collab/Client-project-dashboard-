import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";

import { getDashboardStats } from "../services/dashboard.service";

export async function getDashboardStatsController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Authentication required",
        },
      });

      return;
    }

    const stats = await getDashboardStats(
      user.userId,
      user.role
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch dashboard statistics",
      },
    });
  }
}