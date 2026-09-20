import type { Request, Response } from "express";

import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";

import type { AuthenticatedRequest } from "../middleware/auth";

export async function getNotificationsController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const notifications = await getUserNotifications(user.userId);

    res.json({
      success: true,
      data: notifications,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch notifications" },
    });
  }
}

export async function getUnreadCountController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const count = await getUnreadNotificationCount(user.userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch unread count" },
    });
  }
}

export async function markNotificationAsReadController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const notificationId = String(req.params.id);

    const notification = await markNotificationAsRead(
      notificationId,
      user.userId
    );

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to mark notification as read";

    const statusCode =
      message === "Notification not found" ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      error: { message },
    });
  }
}

export async function markAllNotificationsAsReadController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const result = await markAllNotificationsAsRead(user.userId);

    res.json({
      success: true,
      data: {
        updatedCount: result.count,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { message: "Failed to mark notifications as read" },
    });
  }
}