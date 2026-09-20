import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
  };
};

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        message: "Authentication required",
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: {
        message: "Invalid or expired access token",
      },
    });
  }
}export function authorize(
  ...allowedRoles: Array<
    "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER"
  >
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: "You do not have permission to perform this action",
        },
      });
      return;
    }

    next();
  };
}