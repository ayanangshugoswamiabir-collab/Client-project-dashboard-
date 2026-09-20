import { prisma } from "../config/prisma";
import { type AuthenticatedRequest } from "../middleware/auth";
import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} from "../services/auth.service";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge:
    Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) *
    24 *
    60 *
    60 *
    1000,
};

export async function register(req: Request, res: Response) {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    res.status(400).json({
      success: false,
      error: {
        message,
      },
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await loginUser(
      req.body.email,
      req.body.password
    );

    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions
    );

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";

    res.status(401).json({
      success: false,
      error: {
        message,
      },
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          message: "Refresh token is missing",
        },
      });
      return;
    }

    const result = await refreshUserSession(refreshToken);

    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions
    );

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    res.clearCookie("refreshToken", refreshCookieOptions);

    const message =
      error instanceof Error
        ? error.message
        : "Refresh failed";

    res.status(401).json({
      success: false,
      error: {
        message,
      },
    });
  }
}
export async function me(
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

  try {
    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      res.status(404).json({
        success: false,
        error: {
          message: "User not found",
        },
      });
      return;
    }

    res.json({
      success: true,
      data: dbUser,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch current user",
      },
    });
  }
}
export async function logoutController(
  req: Request,
  res: Response
) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
    });

    res.json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to log out",
      },
    });
  }
}