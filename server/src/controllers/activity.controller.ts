import type { Request, Response } from "express";

import {
  getRecentActivities,
  getActivitiesSince,
} from "../services/activity.service";

import type { AuthenticatedRequest } from "../middleware/auth";

export async function getRecentActivitiesController(
  req: Request,
  res: Response
) {
  try {
    const limitParam = Number(req.query.limit);

    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 50;

    const activities = await getRecentActivities(limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch activities",
      },
    });
  }
}

export async function getActivitiesSinceController(
  req: Request,
  res: Response
) {
  try {
    const sinceParam = String(req.query.since || "");

    if (!sinceParam) {
      res.status(400).json({
        success: false,
        error: {
          message: "The 'since' query parameter is required",
        },
      });
      return;
    }

    const since = new Date(sinceParam);

    if (Number.isNaN(since.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid 'since' timestamp",
        },
      });
      return;
    }

    const activities = await getActivitiesSince(since);

    res.json({
      success: true,
      data: activities,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to recover activities",
      },
    });
  }
}