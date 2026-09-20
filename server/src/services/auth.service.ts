import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "../config/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
};

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const payload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const refreshTokenDays = Number(
    process.env.REFRESH_TOKEN_TTL_DAYS || 7
  );

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(
        Date.now() +
          refreshTokenDays * 24 * 60 * 60 * 1000
      ),
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshUserSession(
  refreshToken: string
) {
  const payload = verifyRefreshToken(refreshToken);

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      userId: payload.userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw new Error("Invalid or expired refresh token");
  }

  const newPayload = {
    userId: storedToken.user.id,
    role: storedToken.user.role,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  const newTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const refreshTokenDays = Number(
    process.env.REFRESH_TOKEN_TTL_DAYS || 7
  );

  await prisma.$transaction([
    prisma.refreshToken.delete({
      where: {
        id: storedToken.id,
      },
    }),

    prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: storedToken.user.id,
        expiresAt: new Date(
          Date.now() +
            refreshTokenDays * 24 * 60 * 60 * 1000
        ),
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: storedToken.user.id,
      name: storedToken.user.name,
      email: storedToken.user.email,
      role: storedToken.user.role,
    },
  };
}
export async function logoutUser(refreshToken: string) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await prisma.refreshToken.deleteMany({
    where: {
      tokenHash,
    },
  });
}