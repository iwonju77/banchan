import "server-only";

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrismaClientIfConfigured } from "@/lib/prisma";
import { createLineProvider } from "@/lib/line-provider";
import { revokeLineAccessToken as revokeLineToken } from "@/lib/line-token";

const lineLoginEnabled = process.env.LINE_LOGIN_ENABLED === "true";
const lineClientId = process.env.LINE_LOGIN_CHANNEL_ID;
const lineClientSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;

if (lineLoginEnabled && (!lineClientId || !lineClientSecret)) {
  throw new Error(
    "LINE_LOGIN_CHANNEL_ID and LINE_LOGIN_CHANNEL_SECRET are required when LINE login is enabled.",
  );
}

const prisma = getPrismaClientIfConfigured();
const provider =
  lineLoginEnabled && lineClientId && lineClientSecret
    ? createLineProvider(lineClientId, lineClientSecret)
    : null;

async function revokeLineAccessToken(
  account: { provider: string; access_token: string | null } | null,
) {
  if (!account?.access_token || account.provider !== "line") {
    return;
  }
  if (!lineClientId || !lineClientSecret) {
    throw new Error("LINE credentials are unavailable for token revocation.");
  }
  await revokeLineToken(
    account.access_token,
    lineClientId,
    lineClientSecret,
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  providers: provider ? [provider] : [],
  secret: process.env.CUSTOMER_AUTH_SECRET,
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-onulbanchan.customer-session"
          : "onulbanchan.customer-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ account }) {
      return account?.provider === "line";
    },
  },
  events: {
    async signIn({ user }) {
      if (!prisma || !user.id) return;
      await prisma.auditLog.create({
        data: {
          actorType: "customer",
          actorId: user.id,
          action: "customer.login",
        },
      });
    },
    async signOut(message) {
      const customerId =
        "session" in message ? message.session?.userId : null;
      if (!prisma || !customerId) return;

      let revocationFailed = false;
      try {
        const account = await prisma.account.findFirst({
          where: { userId: customerId, provider: "line" },
        });
        await revokeLineAccessToken(account);
      } catch {
        revocationFailed = true;
      }

      await prisma.auditLog.create({
        data: {
          actorType: "customer",
          actorId: customerId,
          action: revocationFailed
            ? "customer.logout.line_revocation_failed"
            : "customer.logout",
        },
      });
    },
  },
});
