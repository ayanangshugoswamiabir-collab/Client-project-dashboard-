import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const accessSecret: Secret =
  process.env.JWT_ACCESS_SECRET ||
  (() => {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  })();

const refreshSecret: Secret =
  process.env.JWT_REFRESH_SECRET ||
  (() => {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  })();

export type JwtPayload = {
  userId: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
};

const accessTokenTtl =
  (process.env.ACCESS_TOKEN_TTL || "15m") as SignOptions["expiresIn"];

const refreshTokenTtl =
  `${process.env.REFRESH_TOKEN_TTL_DAYS || "7"}d` as SignOptions["expiresIn"];

export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, accessSecret, {
    expiresIn: accessTokenTtl,
  });
}

export function generateRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: refreshTokenTtl,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, accessSecret) as unknown as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, refreshSecret) as unknown as JwtPayload;
}