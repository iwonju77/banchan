import { config as loadEnv } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getPrismaClient } from "../src/lib/prisma";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const email = process.env.ADMIN_RESET_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_RESET_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Set a valid ADMIN_RESET_EMAIL in the environment.");
  }
  if (!password || password.length < 6) {
    throw new Error("ADMIN_RESET_PASSWORD must contain at least 6 characters.");
  }
  if (!connectionString) {
    throw new Error("DATABASE_URL is required; set it to the Preview database.");
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL is invalid; no changes were made.");
  }
  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("DATABASE_URL must be a PostgreSQL URL; no changes were made.");
  }
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error("Run this local reset command in an interactive terminal.");
  }

  const confirmation = `RESET ${email} ${databaseUrl.hostname}`;
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    console.info(`Target database host: ${databaseUrl.hostname}`);
    console.info("Verify this is the non-production Preview database in Neon.");
    const answer = await terminal.question(`Type \"${confirmation}\" to continue: `);
    if (answer.trim() !== confirmation) {
      throw new Error("Confirmation did not match; no changes were made.");
    }
  } finally {
    terminal.close();
  }

  const prisma = getPrismaClient();
  try {
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) {
      throw new Error("No administrator exists with that email in this database.");
    }

    const accounts = await prisma.adminAccount.findMany({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });
    if (accounts.length === 0) {
      throw new Error("No credential account exists for this administrator.");
    }
    if (accounts.length > 1) {
      throw new Error("Multiple credential accounts found; no changes were made.");
    }

    const passwordHash = await hashPassword(password);
    let revokedSessions = 0;
    await prisma.$transaction(async (transaction) => {
      await transaction.adminAccount.update({
        where: { id: accounts[0].id },
        data: { accountId: user.id, password: passwordHash },
      });
      const result = await transaction.adminSession.deleteMany({
        where: { userId: user.id },
      });
      revokedSessions = result.count;
      await transaction.auditLog.create({
        data: {
          actorType: "system",
          action: "admin.password.reset",
          targetType: "admin",
          targetId: user.id,
        },
      });
    });

    console.info(
      `Administrator credentials repaired and password reset. Revoked ${revokedSessions} session(s); TOTP and recovery codes were preserved.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Administrator password reset failed.");
  process.exitCode = 1;
});
