import type { Request, Response } from "express";

import { getOnlineUserCount } from "../realtime/socket";

import type { AuthenticatedRequest } from "../middleware/auth";

export function getPresenceController(
  req: Request,
  res: Response
) {
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

  res.json({
    success: true,
    data: {
      onlineCount: getOnlineUserCount(),
    },
  });
}