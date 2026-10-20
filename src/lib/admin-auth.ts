import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { twoFactor } from "better-auth/plugins";
import { getPrismaClient } from "@/lib/prisma";

export function createAdminAuth() {
  const secret = process.env.ADMIN_AUTH_SECRET;
  const baseURL = process.env.AUTH_URL;
  if (!secret || !baseURL) {
    throw new Error("ADMIN_AUTH_SECRET and AUTH_URL are required for admin auth");
  }

  return betterAuth({
    appName: "오늘반찬 관리자",
    secret,
    baseURL,
    basePath: "/api/admin/auth",
    trustedOrigins: [baseURL],
    database: prismaAdapter(getPrismaClient(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: false,
      minPasswordLength: 6,
    },
    user: { modelName: "adminUser" },
    session: {
      modelName: "adminSession",
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
    },
    account: { modelName: "adminAccount" },
    verification: { modelName: "adminVerification" },
    plugins: [
      twoFactor({
        issuer: "오늘반찬 관리자",
        twoFactorTable: "adminTwoFactor",
        backupCodeOptions: { storeBackupCodes: "encrypted" },
      }),
    ],
    advanced: {
      cookiePrefix: "onulbanchan-admin",
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  });
}
